import React, { useEffect, useRef } from 'react'
import { useSuggestionStore } from '../../stores/suggestion-store'

// Very lightweight markdown renderer — handles bold, bullets, numbered lists
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      // Italic: *text*
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={j}>{part.slice(1, -1)}</em>
      }
      return part
    })

    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-indigo-400 shrink-0">•</span>
          <span>{parts.map((p, j) => (typeof p === 'string' ? p.slice(2) : p))}</span>
        </div>
      )
    }
    // Numbered
    if (/^\d+\.\s/.test(line)) {
      const [num, ...rest] = line.split(/(?<=^\d+\.)\s/)
      return (
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="text-indigo-400 shrink-0 w-4">{num}</span>
          <span>{rest.join(' ')}</span>
        </div>
      )
    }
    // Header
    if (line.startsWith('## ')) {
      return <p key={i} className="font-semibold text-zinc-100 mt-2 mb-1 text-[11px]">{line.slice(3)}</p>
    }
    if (line.startsWith('# ')) {
      return <p key={i} className="font-bold text-zinc-100 mt-2 mb-1 text-xs">{line.slice(2)}</p>
    }
    // Empty line
    if (!line.trim()) return <div key={i} className="h-1.5" />

    return <p key={i} className="my-0.5">{parts}</p>
  })
}

export function SuggestionPanel() {
  const { state, text, error, mode, startStreaming } = useSuggestionStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [text])

  const handleManualTrigger = async () => {
    startStreaming()
    await window.casper.ai.request(mode)
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent min-h-0">
      {state === 'idle' && (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-6">
          <p className="text-zinc-500 text-xs">
            AI suggestions appear here when the interviewer finishes speaking
          </p>
          <button
            onClick={handleManualTrigger}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Generate Now (⌘↵)
          </button>
        </div>
      )}

      {(state === 'loading' || (state === 'streaming' && !text)) && (
        <div className="flex items-center gap-2 py-4 px-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span className="text-zinc-400 text-xs">Thinking…</span>
        </div>
      )}

      {(state === 'streaming' || state === 'done') && text && (
        <div className="text-xs leading-relaxed text-zinc-200 space-y-0.5">
          {renderMarkdown(text)}
          {state === 'streaming' && (
            <span className="inline-block w-0.5 h-3 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}

      {state === 'error' && (
        <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
          <p className="text-red-400 text-xs">{error}</p>
          <button
            onClick={handleManualTrigger}
            className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
