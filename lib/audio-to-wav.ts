/**
 * Decode an audio blob (e.g. webm from MediaRecorder) and re-encode as WAV
 * so the Whisper API can decode it reliably.
 * See: https://developers.openai.com/api/docs/guides/speech-to-text (supported: wav, webm, mp3, etc.)
 */

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function writeWavHeader(
  dataView: DataView,
  numChannels: number,
  sampleRate: number,
  bytesPerSample: number,
  totalLength: number
): void {
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalLength;

  // RIFF header
  dataView.setUint32(0, 0x52494646, false); // "RIFF"
  dataView.setUint32(4, 36 + dataSize, true); // file size - 8
  dataView.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  dataView.setUint32(12, 0x666d7420, false); // "fmt "
  dataView.setUint32(16, 16, true); // chunk size (16 for PCM)
  dataView.setUint16(20, 1, true); // audio format (1 = PCM)
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, byteRate, true);
  dataView.setUint16(32, blockAlign, true);
  dataView.setUint16(34, bytesPerSample * 8, true);

  // data chunk
  dataView.setUint32(36, 0x64617461, false); // "data"
  dataView.setUint32(40, dataSize, true);
}

/**
 * Convert an audio Blob (e.g. recording.webm) to WAV using the Web Audio API.
 * Returns a WAV Blob suitable for upload to the Whisper API.
 */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numChannels;

  // Interleave channels and convert to 16-bit PCM
  const interleaved = new Float32Array(length);
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = audioBuffer.getChannelData(ch)[i];
    }
  }
  const pcm = floatTo16BitPCM(interleaved);
  const bytesPerSample = 2;
  const dataSize = pcm.byteLength;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const dataView = new DataView(wavBuffer);

  writeWavHeader(dataView, numChannels, sampleRate, bytesPerSample, dataSize);
  new Uint8Array(wavBuffer).set(new Uint8Array(pcm), 44);

  return new Blob([wavBuffer], { type: "audio/wav" });
}
