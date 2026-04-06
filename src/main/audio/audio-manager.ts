/**
 * AudioManager — orchestrates dual-stream audio capture.
 *
 * System audio (loopback) → Deepgram interviewer connection
 * Microphone audio         → Deepgram candidate connection
 *
 * Audio capture happens in the renderer process (Web Audio API),
 * PCM chunks are sent to main via IPC, then forwarded to Deepgram.
 */
import { ipcMain } from 'electron'
import { deepgramManager } from '../transcription/deepgram-client'
import { windowManager } from '../windows/window-manager'
import { IPC } from '../ipc/channels'

// IPC channels used for audio chunk transfer (renderer → main)
export const AUDIO_IPC = {
  INTERVIEWER_CHUNK: 'audio-internal:interviewer-chunk',
  CANDIDATE_CHUNK: 'audio-internal:candidate-chunk',
  CAPTURE_READY: 'audio-internal:capture-ready',
  CAPTURE_ERROR: 'audio-internal:capture-error'
} as const

class AudioManager {
  private capturing = false
  private startedAt: number | null = null

  constructor() {
    this.registerInternalHandlers()
  }

  private registerInternalHandlers(): void {
    // Receive PCM chunks from renderer and forward to Deepgram
    ipcMain.on(AUDIO_IPC.INTERVIEWER_CHUNK, (_event, chunk: Buffer) => {
      deepgramManager.sendInterviewerChunk(chunk)
    })

    ipcMain.on(AUDIO_IPC.CANDIDATE_CHUNK, (_event, chunk: Buffer) => {
      deepgramManager.sendCandidateChunk(chunk)
    })

    ipcMain.on(AUDIO_IPC.CAPTURE_READY, () => {
      this.capturing = true
      this.startedAt = Date.now()
      this.broadcastStatus()
    })

    ipcMain.on(AUDIO_IPC.CAPTURE_ERROR, (_event, error: string) => {
      console.error('[AudioManager] Capture error:', error)
      this.capturing = false
      windowManager.sendToOverlay(IPC.AUDIO_STATUS, {
        isCapturing: false,
        error
      })
    })
  }

  async start(): Promise<{ success: boolean; error?: string }> {
    try {
      // Connect Deepgram first
      await deepgramManager.connect()

      // Signal renderer to start audio capture
      windowManager.sendToOverlay('audio-internal:start-capture', {})

      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }

  async stop(): Promise<void> {
    // Signal renderer to stop audio capture
    windowManager.sendToOverlay('audio-internal:stop-capture', {})

    // Disconnect Deepgram
    deepgramManager.disconnect()

    this.capturing = false
    this.startedAt = null
    this.broadcastStatus()
  }

  async getDevices(): Promise<unknown[]> {
    // Devices are enumerated in the renderer; this is a passthrough
    return []
  }

  async setMicDevice(deviceId: string): Promise<void> {
    windowManager.sendToOverlay('audio-internal:set-mic-device', deviceId)
  }

  isCapturing(): boolean {
    return this.capturing
  }

  getStartedAt(): number | null {
    return this.startedAt
  }

  private broadcastStatus(): void {
    const dg = deepgramManager.isConnected()
    windowManager.sendToOverlay(IPC.AUDIO_STATUS, {
      isCapturing: this.capturing,
      micConnected: this.capturing,
      systemAudioConnected: this.capturing,
      deepgramInterviewerConnected: dg.interviewer,
      deepgramCandidateConnected: dg.candidate
    })
  }
}

export const audioManager = new AudioManager()
