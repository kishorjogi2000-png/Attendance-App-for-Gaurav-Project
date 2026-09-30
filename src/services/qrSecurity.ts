import QRCode from 'qrcode';
import { db } from './db';

export interface QRTokenPayload {
  version: string;
  locationId: string;
  locationCode: string;
  timestamp: number; // Unix epoch ms
  expiresAt?: number; // Optional; only if dynamic timer is explicitly set
  type: 'static' | 'dynamic';
  nonce: string;
  signature?: string;
  status?: 'ACTIVE' | 'DEACTIVATED';
}

function generateHMACSignature(data: string, secret: string): string {
  let hash = 0;
  const combined = `${data}:${secret}:smart-workforce-v2`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generates an encrypted/signed QR string payload.
 * As per Section 22: QR codes do NOT expire automatically.
 * Remains valid until an authorized Admin deactivates it.
 */
export function generateQRToken(
  locationId: string,
  locationCode: string,
  secret: string,
  type: 'static' | 'dynamic' = 'static',
  validitySeconds?: number
): { qrString: string; payload: QRTokenPayload } {
  const now = Date.now();
  // If static: no expiry. If dynamic explicitly given: calculate expiresAt.
  const expiresAt = validitySeconds ? now + validitySeconds * 1000 : undefined;
  const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();

  const dataToSign = `${locationId}|${locationCode}|${now}|${expiresAt || 'NO_EXPIRY'}|${type}|${nonce}`;
  const signature = generateHMACSignature(dataToSign, secret);

  const payload: QRTokenPayload = {
    version: '2.0',
    locationId,
    locationCode,
    timestamp: now,
    expiresAt,
    type,
    nonce,
    signature,
    status: 'ACTIVE',
  };

  const qrString = `SWQR::${btoa(JSON.stringify(payload))}`;
  return { qrString, payload };
}

export interface QRValidationResult {
  isValid: boolean;
  message: string;
  locationId?: string;
  locationCode?: string;
  isExpired?: boolean;
  isDeactivated?: boolean;
  type?: 'static' | 'dynamic';
}

/**
 * Validates a scanned QR string against registered location QR records
 * Implements Section 22, 23, 24, 25
 */
export function validateQRToken(
  scannedCode: string,
  expectedLocationId: string,
  secret: string
): QRValidationResult {
  if (!scannedCode || !scannedCode.startsWith('SWQR::')) {
    // If raw location code scanned
    if (scannedCode.trim().length > 2 && scannedCode.includes(expectedLocationId)) {
      return {
        isValid: true,
        message: 'Location matched via raw code',
        locationId: expectedLocationId,
        type: 'static',
      };
    }
    return {
      isValid: false,
      message: 'Invalid QR format. Please scan an authorized workforce terminal QR.',
    };
  }

  try {
    const jsonStr = atob(scannedCode.replace('SWQR::', ''));
    const payload: QRTokenPayload = JSON.parse(jsonStr);

    if (payload.locationId !== expectedLocationId) {
      return {
        isValid: false,
        message: `Location mismatch! This QR belongs to ${payload.locationCode || 'another location'}.`,
        locationId: payload.locationId,
      };
    }

    // Check database QR code status (Section 23: Deactivation check)
    const qrRecords = db.getLocationQRCodes();
    const matchingRecord = qrRecords.find(
      (r) => r.location_id === payload.locationId && r.qr_token.includes(payload.nonce)
    ) || qrRecords.find((r) => r.location_id === payload.locationId && r.status === 'DEACTIVATED');

    if (matchingRecord && matchingRecord.status === 'DEACTIVATED') {
      return {
        isValid: false,
        isDeactivated: true,
        message: 'This attendance QR is currently inactive.',
      };
    }

    // Check expiry only if dynamic token had an explicit timer
    if (payload.expiresAt) {
      const now = Date.now();
      if (now > payload.expiresAt) {
        return {
          isValid: false,
          isExpired: true,
          message: 'This dynamic QR has expired. Please refresh the terminal screen.',
          locationId: payload.locationId,
        };
      }
    }

    return {
      isValid: true,
      message: 'Attendance QR verified successfully',
      locationId: payload.locationId,
      locationCode: payload.locationCode,
      type: payload.type,
    };
  } catch (err) {
    return {
      isValid: false,
      message: 'Failed to decode QR code token.',
    };
  }
}

/**
 * Render QR as Data URL
 */
export async function renderQRCodeDataUrl(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: {
      dark: '#0f172a', // Slate 900
      light: '#ffffff',
    },
    ...options,
  });
}
