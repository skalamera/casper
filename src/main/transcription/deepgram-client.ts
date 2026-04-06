import { createClient, LiveTranscriptionEvents, type LiveClient } from '@deepgram/sdk'
import { transcriptStore } from './transcript-store'
import { windowManager } from '../windows/window-manager'
import { IPC, type Speaker } from '../ipc/channels'
import { aiTrigger } from '../ai/ai-trigger'
import { secureStore } from '../storage/secure-store'

const DEEPGRAM_PARAMS = {
  model: 'nova-3',
  language: 'en',
  smart_format: true,
  interim_results: true,
  utterance_end_ms: 1000,
  vad_events: true,
  encoding: 'linear16' as const,
  sample_rate: 16000,
  channels: 1
}

class DeepgramConnection {
  private client: LiveClient | null = null
  private speaker: Speaker
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldReconnect = false
  private interimId: string

  constructor(speaker: Speaker) {
    this.speaker = speaker
    this.interimId = `${speaker}-interim`
  }

  async connect(apiKey: string): Promise<void> {
    this.shouldReconnect = true
    const dg = createClient(apiKey)

    this.client = dg.listen.live(DEEPGRAM_PARAMS)

    this.client.on(LiveTranscriptionEvents.Open, () => {
      console.log(`[Deepgram:${this.speaker}] Connected`)
      this.notifyStatus(true)
    })

    this.client.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data?.channel?.alternatives?.[0]
      if (!alt?.transcript) return

      const text: string = alt.transcript
      const isFinal: boolean = data.is_final ?? false

      if (isFinal) {
        const entry = transcriptStore.finalize(this.interimId, text)
        if (entry) {
          windowManager.sendToOverlay(IPC.TRANSCRIPT_ENTRY, entry)
          // Trigger AI when interviewer finishes speaking
          if (this.speaker === 'interviewer') {
            aiTrigger.scheduleAutoTrigger()
          }
        }
      } else {
        const entry = transcriptStore.addOrUpdateInterim(this.speaker, text, this.interimId)
        windowManager.sendToOverlay(IPC.TRANSCRIPT_ENTRY, entry)
      }
    })

    this.client.on(LiveTranscriptionEvents.SpeechStarted, () => {
      // Cancel pending AI trigger if interviewer starts speaking again mid-response
      if (this.speaker === 'interviewer') {
        aiTrigger.cancel()
      }
    })

    this.client.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      // Belt-and-suspenders: also trigger on utterance end
      if (this.speaker === 'interviewer') {
        aiTrigger.scheduleAutoTrigger()
      }
    })

    this.client.on(LiveTranscriptionEvents.Error, (err) => {
      console.error(`[Deepgram:${this.speaker}] Error:`, err)
      this.notifyStatus(false)
    })

    this.client.on(LiveTranscriptionEvents.Close, () => {
      console.log(`[Deepgram:${this.speaker}] Connection closed`)
      this.notifyStatus(false)
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.reconnect(apiKey), 3000)
      }
    })
  }

  private async reconnect(apiKey: string): Promise<void> {
    console.log(`[Deepgram:${this.speaker}] Reconnecting...`)
    await this.connect(apiKey)
  }

  private notifyStatus(connected: boolean): void {
    windowManager.sendToOverlay(IPC.AUDIO_STATUS, {
      [`deepgram${this.speaker.charAt(0).toUpperCase() + this.speaker.slice(1)}Connected`]: connected
    })
  }

  sendAudioChunk(chunk: Buffer): void {
    if (this.client && this.client.getReadyState() === 1 /* OPEN */) {
      this.client.send(chunk)
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.client?.finish()
    this.client = null
  }

  isConnected(): boolean {
    return this.client?.getReadyState() === 1
  }
}

class DeepgramManager {
  private interviewer = new DeepgramConnection('interviewer')
  private candidate = new DeepgramConnection('candidate')

  async connect(): Promise<void> {
    const { deepgramApiKey } = secureStore.getKeys()
    if (!deepgramApiKey) {
      throw new Error('Deepgram API key not configured. Open Settings to add your key.')
    }
    await Promise.all([
      this.interviewer.connect(deepgramApiKey),
      this.candidate.connect(deepgramApiKey)
    ])
  }

  sendInterviewerChunk(chunk: Buffer): void {
    this.interviewer.sendAudioChunk(chunk)
  }

  sendCandidateChunk(chunk: Buffer): void {
    this.candidate.sendAudioChunk(chunk)
  }

  disconnect(): void {
    this.interviewer.disconnect()
    this.candidate.disconnect()
  }

  isConnected(): { interviewer: boolean; candidate: boolean } {
    return {
      interviewer: this.interviewer.isConnected(),
      candidate: this.candidate.isConnected()
    }
  }
}

export const deepgramManager = new DeepgramManager()
