// Generate audio data URLs programmatically to avoid CORS issues

export const generateBeep = (frequency: number, duration: number, type: OscillatorType = 'sine'): string => {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();
  const sampleRate = audioContext.sampleRate;
  const numSamples = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (type === 'sine') {
      sample = Math.sin(2 * Math.PI * frequency * t);
    } else if (type === 'square') {
      sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
    } else if (type === 'sawtooth') {
      sample = 2 * ((frequency * t) % 1) - 1;
    }

    // Apply envelope (fade in/out to avoid clicks)
    const fadeTime = 0.01;
    const fadeSamples = fadeTime * sampleRate;
    if (i < fadeSamples) {
      sample *= i / fadeSamples;
    } else if (i > numSamples - fadeSamples) {
      sample *= (numSamples - i) / fadeSamples;
    }

    channel[i] = sample * 0.3; // Volume control
  }

  // Convert to WAV and return data URL
  const wav = bufferToWave(buffer, numSamples);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

function bufferToWave(buffer: AudioBuffer, len: number): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = new Float32Array(len);
  buffer.copyFromChannel(data, 0);

  const dataLength = len * numChannels * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < len; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Pre-generated sounds
export const PRESET_SOUNDS = {
  airHorn: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4c9404ec97.mp3',
  success: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
  drumRoll: 'https://cdn.pixabay.com/audio/2022/03/24/audio_c49c609473.mp3',
  applause: 'https://cdn.pixabay.com/audio/2022/03/10/audio_13e11ae5a5.mp3',
  fail: 'https://cdn.pixabay.com/audio/2023/04/02/audio_1fcdbb0023.mp3',
  laugh: 'https://cdn.pixabay.com/audio/2022/03/24/audio_167a968a88.mp3',
};
