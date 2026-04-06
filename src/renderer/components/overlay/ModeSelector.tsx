import React from 'react'
import { useSuggestionStore } from '../../stores/suggestion-store'
import type { ResponseMode } from '../../../main/ipc/channels'

const MODES: { id: ResponseMode; label: string; emoji: string; shortcut: string }[] = [
  { id: 'suggest', label: 'Suggest', emoji: '💡', shortcut: '⌘⇧1' },
  { id: 'assist', label: 'Assist', emoji: '🧠', shortcut: '⌘⇧2' },
  { id: 'followup', label: 'Follow-up', emoji: '🔍', shortcut: '⌘⇧3' },
  { id: 'recap', label: 'Recap', emoji: '📋', shortcut: '⌘⇧4' }
]

export function ModeSelector() {
  const { mode, setMode } = useSuggestionStore()

  return (
    <div className="flex gap-1 px-3 pb-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          title={`${m.label} (${m.shortcut})`}
          className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all ${
            mode === m.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
              : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200'
          }`}
        >
          <span>{m.emoji}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
