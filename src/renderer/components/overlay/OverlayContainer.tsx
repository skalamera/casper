import React, { useState } from 'react'
import { StatusIndicator } from './StatusIndicator'
import { TranscriptPanel } from './TranscriptPanel'
import { ModeSelector } from './ModeSelector'
import { SuggestionPanel } from './SuggestionPanel'
import { useAudioStore } from '../../stores/audio-store'

export function OverlayContainer() {
  const [minimized, setMinimized] = useState(false)
  const { isCapturing } = useAudioStore()

  const handleStart = async () => {
    await window.casper.audio.start()
  }

  const handleStop = async () => {
    await window.casper.audio.stop()
  }

  if (minimized) {
    return (
      <MinimizedPill
        isCapturing={isCapturing}
        onExpand={() => setMinimized(false)}
      />
    )
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15, 15, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center px-3 py-2 gap-2"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Logo */}
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-white">C</span>
        </div>

        <span className="text-xs font-semibold text-zinc-300 tracking-wide select-none">
          Casper
        </span>

        <div
          className="ml-auto flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Record / Stop */}
          <button
            onClick={isCapturing ? handleStop : handleStart}
            title={isCapturing ? 'Stop recording (⌘⇧R)' : 'Start recording (⌘⇧R)'}
            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
              isCapturing
                ? 'bg-red-600/80 hover:bg-red-500/80 text-white'
                : 'bg-indigo-600/80 hover:bg-indigo-500/80 text-white'
            }`}
          >
            {isCapturing ? '⏹ Stop' : '⏺ Start'}
          </button>

          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            title="Minimize (⌘⇧M)"
            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-all text-xs"
          >
            _
          </button>

          {/* Settings */}
          <button
            onClick={() => window.casper.window.openSettings()}
            title="Settings (⌘,)"
            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-all text-xs"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <StatusIndicator />

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="h-px bg-white/[0.06] mx-3" />

      {/* ── Live Transcript ───────────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
          Live Transcript
        </p>
      </div>
      <TranscriptPanel />

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="h-px bg-white/[0.06] mx-3 my-1" />

      {/* ── AI Mode selector ──────────────────────────────────────────────── */}
      <div className="px-3 pt-1 pb-1">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
          AI Assistance
        </p>
      </div>
      <ModeSelector />

      {/* ── Suggestion panel ──────────────────────────────────────────────── */}
      <SuggestionPanel />

      {/* ── Footer hint ───────────────────────────────────────────────────── */}
      <div className="px-3 py-1.5 border-t border-white/[0.04]">
        <p className="text-[9px] text-zinc-600 text-center">
          ⌘↵ Generate  •  ⌘\ Toggle  •  ⌘Esc Panic hide
        </p>
      </div>
    </div>
  )
}

function MinimizedPill({
  isCapturing,
  onExpand
}: {
  isCapturing: boolean
  onExpand: () => void
}) {
  return (
    <div
      onClick={onExpand}
      className="flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer"
      style={{
        background: 'rgba(15,15,20,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        WebkitAppRegion: 'drag'
      } as React.CSSProperties}
    >
      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <span className="text-[8px] font-bold text-white">C</span>
      </div>
      <span
        className={`w-2 h-2 rounded-full ${
          isCapturing ? 'bg-green-400 animate-pulse' : 'bg-zinc-500'
        }`}
      />
    </div>
  )
}
