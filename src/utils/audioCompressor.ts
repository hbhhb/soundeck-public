import { logger } from './logger';
import * as lamejs from 'lamejs';

/**
 * Compresses an audio file to MP3 format using lamejs.
 * Target: 128kbps, Mono (to save space for 15MB limit)
 */
export async function compressAudio(file: File): Promise<File> {
  // 1. Skip if already small MP3 (e.g. < 500KB and is mp3)
  // But user wanted "all audio to MP3 128kbps", so we usually proceed unless it's very efficient already.
  // For safety and consistency, we'll try to compress everything except very small files.
  if (file.size < 1024 * 500 && file.type === 'audio/mpeg') {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 2. Prepare Encoder
    // Mono (1 channel) is enough for soundboard effects and saves 50% space vs Stereo
    const channels = 1;
    const sampleRate = audioBuffer.sampleRate;
    const kbps = 128;

    // @ts-ignore - lamejs types might be missing
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

    // 3. Convert Float32Array (Web Audio) to Int16Array (LAME)
    // We mix down to mono if original is stereo
    const originalLeft = audioBuffer.getChannelData(0);
    const samples = new Int16Array(originalLeft.length);

    // Mixdown logic: if stereo, average left and right. If mono, just use left.
    if (audioBuffer.numberOfChannels > 1) {
      const originalRight = audioBuffer.getChannelData(1);
      for (let i = 0; i < originalLeft.length; i++) {
        // Mix stereo to mono: (L + R) / 2
        const s = (originalLeft[i] + originalRight[i]) / 2;
        // Clamp and convert
        const clamped = Math.max(-1, Math.min(1, s));
        samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      }
    } else {
      for (let i = 0; i < originalLeft.length; i++) {
        const s = originalLeft[i];
        const clamped = Math.max(-1, Math.min(1, s));
        samples[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      }
    }

    // 4. Encode
    // Encode in chunks to prevent blocking UI too much (though this loop is synchronous in JS)
    // For very large files, we might want to use chunks/setTimeout, but for <5MB files, sync is acceptable usually.
    // Lamejs encodeBuffer takes Int16Array
    const mp3Data: Int8Array[] = [];

    // Encode the whole buffer (mono)
    const mp3buf = mp3encoder.encodeBuffer(samples);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(endBuf);
    }

    // 5. Create new File
    const blob = new Blob(mp3Data, { type: 'audio/mp3' });
    const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".mp3";

    return new File([blob], newFileName, { type: 'audio/mp3', lastModified: Date.now() });

  } catch (error) {
    logger.error("Compression failed:", error);
    // Fallback: return original file if compression fails
    return file;
  }
}
