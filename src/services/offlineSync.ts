import { AttendanceRecord } from '../types';
import { db } from './db';

const OFFLINE_QUEUE_KEY = 'SMART_WORKFORCE_OFFLINE_ATTENDANCE_QUEUE';

export interface OfflineAttendanceItem {
  id: string;
  record: AttendanceRecord;
  capturedAt: string;
  signature: string;
}

export function getOfflineQueue(): OfflineAttendanceItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineAttendance(record: AttendanceRecord): void {
  const queue = getOfflineQueue();
  const item: OfflineAttendanceItem = {
    id: `OFFLINE-${Date.now()}`,
    record: {
      ...record,
      remarks: `${record.remarks || ''} [Recorded Offline - Pending Sync]`.trim(),
    },
    capturedAt: new Date().toISOString(),
    signature: `OFFLINE_SIG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };

  queue.push(item);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function syncOfflineQueue(): { count: number; items: OfflineAttendanceItem[] } {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { count: 0, items: [] };

  queue.forEach((item) => {
    db.addAttendance({
      ...item.record,
      remarks: item.record.remarks?.replace('[Recorded Offline - Pending Sync]', '[Synced from Offline Queue]'),
    });
  });

  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  return { count: queue.length, items: queue };
}
