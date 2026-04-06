/**
 * Sets up all IPC event listeners for the overlay renderer.
 * Call once at the app root level.
 */
import { useEffect } from 'react'
import { useAudioStore } from '../stores/audio-store'
import { useTranscriptStore } from '../stores/transcript-store'
import { useSuggestionStore } from '../stores/suggestion-store'
import type { ResponseMode } from '../../main/ipc/channels'

export function useIpcEvents() {
  const audioUpdate = useAudioStore((s) => s.update)
  const addOrUpdateEntry = useTranscriptStore((s) => s.addOrUpdate)
  const suggestion = useSuggestionStore()

  useEffect(() => {
    const unsubs: Array<() => void> = []

    // ── Audio status ─────────────────────────────────────────────────────────
    unsubs.push(window.casper.audio.onStatus((status) => audioUpdate(status)))

    // ── Transcript ───────────────────────────────────────────────────────────
    unsubs.push(window.casper.transcript.onEntry((entry) => addOrUpdateEntry(entry)))

    // ── AI streaming ─────────────────────────────────────────────────────────
    unsubs.push(
      window.casper.ai.onChunk((chunk) => {
        if (suggestion.state !== 'streaming') {
          suggestion.startStreaming()
        }
        suggestion.appendChunk(chunk)
      })
    )

    unsubs.push(window.casper.ai.onDone(() => suggestion.setDone()))

    unsubs.push(window.casper.ai.onError((err) => suggestion.setError(err)))

    // ── Shortcuts ────────────────────────────────────────────────────────────
    unsubs.push(
      window.casper.shortcuts.onTriggerAi(({ mode }) => {
        suggestion.startStreaming()
        window.casper.ai.request(mode)
      })
    )

    unsubs.push(
      window.casper.shortcuts.onSetMode((mode: ResponseMode) => {
        suggestion.setMode(mode)
      })
    )

    return () => unsubs.forEach((u) => u())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
