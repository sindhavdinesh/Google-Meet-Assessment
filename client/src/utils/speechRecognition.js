// Web Speech API for Google Meet Live Captions [CC]

export function createSpeechRecognizer(onTranscript, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[Captions] SpeechRecognition not supported in this browser');
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      onTranscript(final || interim);
    };

    recognition.onerror = (event) => {
      console.warn('[Captions] Error:', event.error);
      if (onError) onError(event.error);
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {}
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  } catch (err) {
    console.warn('[Captions] Failed to init speech recognition:', err);
    return null;
  }
}
