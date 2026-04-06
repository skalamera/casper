/**
 * Manages dual-stream audio capture in the renderer.
 *
 * Two audio sources are captured simultaneously:
 * 1. System audio (loopback) — interviewer's voice
 * 2. Microphone — candidate's voice
 *
 * Both are piped through the AudioWorklet which resamples to 16kHz
 * and emits 100ms PCM chunks. Chunks are sent to main process via
 * casper.audio.sendInterviewerChunk / sendCandidateChunk for Deepgram.
 */
import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    casper: import('../../preload/index').CasperAPI
  }
}

export function useAudioCapture() {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamsRef = useRef<MediaStream[]>([])

  const stopCapture = useCallback(() => {
    // Stop all media streams
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()))
    streamsRef.current = []

    // Close AudioContext
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    workletNodeRef.current = null
  }, [])

  const startCapture = useCallback(async (micDeviceId?: string | null) => {
    try {
      const ctx = new AudioContext({ sampleRate: 48000 }) // input at native rate; worklet resamples
      audioCtxRef.current = ctx

      // Load the AudioWorklet processor
      await ctx.audioWorklet.addModule(
        new URL('../audio-processor.worklet.js', import.meta.url).href
      )

      const workletNode = new AudioWorkletNode(ctx, 'audio-processor', {
        numberOfInputs: 2,   // [0] = system audio, [1] = mic
        numberOfOutputs: 0,  // we don't need audio output
        processorOptions: {}
      })
      workletNodeRef.current = workletNode

      // Route PCM chunks from worklet to main process
      workletNode.port.onmessage = (e: MessageEvent) => {
        const { type, buffer } = e.data as { type: 'interviewer' | 'candidate'; buffer: ArrayBuffer }
        const chunk = Buffer.from(buffer)
        if (type === 'interviewer') {
          window.casper.audio.sendInterviewerChunk(chunk)
        } else {
          window.casper.audio.sendCandidateChunk(chunk)
        }
      }

      // ── System Audio (loopback) ────────────────────────────────────────────
      let systemStream: MediaStream | null = null
      try {
        // Request display media with system audio enabled
        // macOS 13.2+: ScreenCaptureKit will include audio
        systemStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: {
            frameRate: 1, // minimize video processing (we only want audio)
            width: 1,
            height: 1
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 48000
          },
          // Chromium loopback flags
          preferCurrentTab: false,
          surfaceSwitching: 'exclude',
          selfBrowserSurface: 'exclude',
          systemAudio: 'include'
        })

        // Stop video track immediately — we only need audio
        systemStream.getVideoTracks().forEach((t) => t.stop())

        if (systemStream.getAudioTracks().length > 0) {
          const systemSource = ctx.createMediaStreamSource(systemStream)
          systemSource.connect(workletNode, 0, 0) // connect to input 0 (interviewer)
          streamsRef.current.push(systemStream)
        }
      } catch (err) {
        console.warn('[Audio] System audio unavailable (user may have denied or not selected):', err)
        window.casper.audio.reportError(`System audio unavailable: ${err}`)
      }

      // ── Microphone ─────────────────────────────────────────────────────────
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: micDeviceId ? { exact: micDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      })

      const micSource = ctx.createMediaStreamSource(micStream)
      micSource.connect(workletNode, 0, 1) // connect to input 1 (candidate)
      streamsRef.current.push(micStream)

      // Connect worklet to ctx destination (needed even with 0 outputs)
      workletNode.connect(ctx.destination)

      window.casper.audio.reportReady()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      window.casper.audio.reportError(msg)
      stopCapture()
    }
  }, [stopCapture])

  // Listen for start/stop commands from main process
  useEffect(() => {
    const unsubStart = window.casper.audio.onStartCapture(() => {
      window.casper.settings.get().then((s) => {
        startCapture(s.micDeviceId)
      })
    })

    const unsubStop = window.casper.audio.onStopCapture(() => {
      stopCapture()
    })

    return () => {
      unsubStart()
      unsubStop()
    }
  }, [startCapture, stopCapture])

  return { startCapture, stopCapture }
}
