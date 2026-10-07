// Detect audio speaking volume level using Web Audio AnalyserNode

export function createAudioLevelDetector(stream, onLevelChange) {
  if (!stream || stream.getAudioTracks().length === 0) return null;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId;

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normal threshold for speaking: volume > 12-15
      const isSpeaking = average > 14;
      onLevelChange(average, isSpeaking);

      animationFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    return {
      stop: () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        try {
          source.disconnect();
          analyser.disconnect();
          audioContext.close();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  } catch (err) {
    console.warn('[AudioDetector] Could not initialize Web Audio:', err);
    return null;
  }
}
