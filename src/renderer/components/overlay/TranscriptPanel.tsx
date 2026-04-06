import React, { useEffect, useRef, useState } from 'react'
import { useTranscriptStore } from '../../stores/transcript-store'

export function TranscriptPanel() {
  const entries = useTranscriptStore((s) => s.entries)
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)

  // Auto-scroll when new entries arrive, if pinned
  useEffect(() => {
    if (pinned) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries, pinned])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setPinned(atBottom)
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-zinc-500 text-xs px-4 text-center">
        Transcript will appear here when the interview begins…
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto max-h-52 px-3 py-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
    >
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-2 items-start">
          {/* Speaker badge */}
          <span
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5 ${
              entry.speaker === 'interviewer'
                ? 'bg-blue-900/60 text-blue-300'
                : 'bg-purple-900/60 text-purple-300'
            }`}
          >
            {entry.speaker === 'interviewer' ? 'Int' : 'You'}
          </span>

          {/* Text */}
          <p
            className={`text-xs leading-relaxed ${
              entry.isFinal ? 'text-zinc-200' : 'text-zinc-400 italic'
            }`}
          >
            {entry.text}
          </p>
        </div>
      ))}

      {/* Scroll-to-bottom indicator */}
      {!pinned && (
        <button
          onClick={() => {
            setPinned(true)
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="sticky bottom-0 w-full text-center text-[10px] text-zinc-400 bg-zinc-900/80 py-1 rounded hover:text-zinc-200 transition-colors"
        >
          ↓ New messages
        </button>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
