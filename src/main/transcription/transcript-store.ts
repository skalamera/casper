import { randomUUID } from 'crypto'
import type { TranscriptEntry, Speaker } from '../ipc/channels'

class TranscriptStore {
  private entries: TranscriptEntry[] = []
  private interimEntries: Map<string, TranscriptEntry> = new Map()

  addOrUpdateInterim(speaker: Speaker, text: string, interimId: string): TranscriptEntry {
    const existing = this.interimEntries.get(interimId)
    if (existing) {
      existing.text = text
      existing.timestamp = Date.now()
      return existing
    }
    const entry: TranscriptEntry = {
      id: randomUUID(),
      speaker,
      text,
      isFinal: false,
      timestamp: Date.now()
    }
    this.interimEntries.set(interimId, entry)
    return entry
  }

  finalize(interimId: string, finalText: string): TranscriptEntry | null {
    const entry = this.interimEntries.get(interimId)
    if (!entry) {
      // No interim tracked (can happen if connection was briefly down) — create a new entry
      const newEntry: TranscriptEntry = {
        id: randomUUID(),
        speaker: 'interviewer',
        text: finalText,
        isFinal: true,
        timestamp: Date.now()
      }
      this.entries.push(newEntry)
      return newEntry
    }

    entry.text = finalText
    entry.isFinal = true
    this.interimEntries.delete(interimId)
    this.entries.push(entry)
    return entry
  }

  getAll(): TranscriptEntry[] {
    return [...this.entries]
  }

  /**
   * Returns the last N final entries, suitable for inclusion in an AI prompt.
   * Keeps token usage bounded.
   */
  getLastN(n = 15): TranscriptEntry[] {
    return this.entries.slice(-n)
  }

  getLastInterviewerUtterance(): TranscriptEntry | null {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].speaker === 'interviewer') {
        return this.entries[i]
      }
    }
    return null
  }

  clear(): void {
    this.entries = []
    this.interimEntries.clear()
  }
}

export const transcriptStore = new TranscriptStore()
