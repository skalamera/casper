import React from 'react'
import { useAudioStore } from '../../stores/audio-store'

export function StatusIndicator() {
  const { isCapturing, deepgramInterviewerConnected, deepgramCandidateConnected, error } = useAudioStore()

  const allConnected = isCapturing && deepgramInterviewerConnected && deepgramCandidateConnected

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {/* Recording dot */}
      <div className="relative flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            allConnected
              ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]'
              : isCapturing
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-zinc-500'
          }`}
        />
        <span className="text-xs font-medium text-zinc-300">
          {allConnected ? 'Live' : isCapturing ? 'Connecting…' : 'Idle'}
        </span>
      </div>

      {/* Deepgram connection dots */}
      {isCapturing && (
        <div className="flex gap-1 ml-auto">
          <span title="Interviewer audio">
            <span className={`block w-1.5 h-1.5 rounded-full ${deepgramInterviewerConnected ? 'bg-blue-400' : 'bg-zinc-600'}`} />
          </span>
          <span title="Candidate audio">
            <span className={`block w-1.5 h-1.5 rounded-full ${deepgramCandidateConnected ? 'bg-purple-400' : 'bg-zinc-600'}`} />
          </span>
        </div>
      )}

      {error && (
        <span className="text-xs text-red-400 truncate max-w-[120px]" title={error}>
          ⚠ {error}
        </span>
      )}
    </div>
  )
}
