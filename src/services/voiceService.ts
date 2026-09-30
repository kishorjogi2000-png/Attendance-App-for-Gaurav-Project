/**
 * Voice Greeting Service using Web Speech Synthesis API.
 * Dynamically synthesizes personalized greetings based on time of day,
 * employee name, location, and language preference (English, Hindi, Hinglish).
 */

export function getTimeGreeting(hours: number = new Date().getHours()): string {
  if (hours < 12) return 'Good Morning';
  if (hours < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function generateGreetingText(
  employeeName: string,
  locationName: string,
  language: 'English' | 'Hindi' | 'Hinglish' = 'English',
  punchType: 'in' | 'out' = 'in'
): string {
  const firstName = employeeName.split(' ')[0] || employeeName;
  const hours = new Date().getHours();
  const timeGreeting = getTimeGreeting(hours);

  if (punchType === 'out') {
    switch (language) {
      case 'Hindi': {
        return `धन्यवाद ${firstName}! ${locationName} से आपका पंच आउट सफलतापूर्वक दर्ज कर लिया गया है। आपका दिन शुभ रहे!`;
      }
      case 'Hinglish': {
        return `Thank you ${firstName}! ${locationName} par aapka Punch Out successfully ho gaya hai. Have a great evening!`;
      }
      case 'English':
      default: {
        return `Thank you ${firstName}! Your Punch Out from ${locationName} has been successfully recorded. Have a great day!`;
      }
    }
  }

  switch (language) {
    case 'Hindi': {
      let timeHindi = 'नमस्ते';
      if (hours < 12) timeHindi = 'शुभ प्रभात';
      else if (hours < 17) timeHindi = 'शुभ दोपहर';
      else timeHindi = 'शुभ संध्या';

      return `${timeHindi} ${firstName}! ${locationName} में आपका स्वागत है। आपका पंच इन सफलतापूर्वक दर्ज कर लिया गया है।`;
    }

    case 'Hinglish': {
      return `${timeGreeting} ${firstName}! Welcome to ${locationName}. Aapka Punch In confirm ho gaya hai. Have a productive day!`;
    }

    case 'English':
    default: {
      return `${timeGreeting} ${firstName}! Welcome to ${locationName}. Your Punch In has been successfully recorded.`;
    }
  }
}

export function playAttendanceChime(type: 'in' | 'out' = 'in') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (type === 'in') {
      // Pleasant rising confirmation chime: C5 -> E5 -> G5
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
    } else {
      // Pleasant gentle exit chime: G5 -> E5 -> C5
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(523.25, now + 0.2);
    }

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    // Ignore audio context autoplay warnings
  }
}

export function playVoiceGreeting(
  employeeName: string,
  locationName: string,
  options?: {
    enabled?: boolean;
    language?: 'English' | 'Hindi' | 'Hinglish';
    rate?: number;
    pitch?: number;
    punchType?: 'in' | 'out';
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    if (options?.enabled === false) {
      resolve(false);
      return;
    }

    // Play immediate biometric confirmation tone
    playAttendanceChime(options?.punchType || 'in');

    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const text = generateGreetingText(
        employeeName,
        locationName,
        options?.language || 'English',
        options?.punchType || 'in'
      );
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;
      utterance.lang = options?.language === 'Hindi' ? 'hi-IN' : 'en-IN';

      // Select suitable voice if available
      const voices = window.speechSynthesis.getVoices();
      if (options?.language === 'Hindi') {
        const hindiVoice = voices.find(
          (v) => v.lang.toLowerCase().includes('hi') || v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const engVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.lang.includes('IN'))
        );
        if (engVoice) utterance.voice = engVoice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error or interrupted:', err);
        resolve(false);
      };

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error playing voice greeting:', e);
      resolve(false);
    }
  });
}
