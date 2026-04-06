/**
 * AudioWorklet processor — runs on dedicated audio thread.
 *
 * Receives raw samples from two MediaStreamSource nodes:
 *   - Input 0: System audio (interviewer)
 *   - Input 1: Microphone (candidate)
 *
 * Resamples from any input sample rate down to 16kHz (Deepgram's preferred rate)
 * and emits Int16 PCM chunks via MessagePort.
 *
 * Output format: { type: 'interviewer'|'candidate', buffer: Int16Array }
 */

const TARGET_SAMPLE_RATE = 16000
const CHUNK_DURATION_MS = 100 // emit every 100ms

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._interviewerBuffer = []
    this._candidateBuffer = []
    this._samplesPerChunk = Math.floor((TARGET_SAMPLE_RATE * CHUNK_DURATION_MS) / 1000)
    this._sourceSampleRate = sampleRate // global AudioWorklet variable
    this._ratio = this._sourceSampleRate / TARGET_SAMPLE_RATE
  }

  process(inputs) {
    // inputs[0] = system audio (interviewer), inputs[1] = mic (candidate)
    const interviewerInput = inputs[0]?.[0]
    const candidateInput = inputs[1]?.[0]

    if (interviewerInput) {
      this._processChannel(interviewerInput, this._interviewerBuffer, 'interviewer')
    }
    if (candidateInput) {
      this._processChannel(candidateInput, this._candidateBuffer, 'candidate')
    }

    return true // keep processor alive
  }

  _processChannel(samples, buffer, type) {
    // Simple linear resampling
    const step = this._ratio
    for (let i = 0; i < samples.length; i += step) {
      const idx = Math.floor(i)
      buffer.push(samples[idx] ?? 0)
    }

    // Emit chunks when we have enough samples
    while (buffer.length >= this._samplesPerChunk) {
      const chunk = buffer.splice(0, this._samplesPerChunk)
      // Convert Float32 to Int16
      const int16 = new Int16Array(chunk.length)
      for (let i = 0; i < chunk.length; i++) {
        const clamped = Math.max(-1, Math.min(1, chunk[i]))
        int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
      }
      this.port.postMessage({ type, buffer: int16.buffer }, [int16.buffer])
    }
  }
}

registerProcessor('audio-processor', AudioProcessor)
