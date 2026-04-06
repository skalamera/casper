import React, { useCallback, useRef, useState } from 'react'
import { useContextStore } from '../../stores/context-store'

interface FileUploadZoneProps {
  type: 'resume' | 'jobDescription'
}

export function FileUploadZone({ type }: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { resume, jobDescription, setResume, setJobDescription } = useContextStore()

  const current = type === 'resume' ? resume : jobDescription
  const setDoc = type === 'resume' ? setResume : setJobDescription

  const processFile = useCallback(
    async (filePath: string) => {
      setLoading(true)
      setError(null)
      const result = await window.casper.context.upload(filePath, type)
      if (result.success && result.doc) {
        setDoc(result.doc)
      } else {
        setError(result.error ?? 'Failed to parse file')
      }
      setLoading(false)
    },
    [type, setDoc]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      // @ts-ignore — Electron exposes path on File objects
      await processFile(file.path)
    },
    [processFile]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      // @ts-ignore
      await processFile(file.path)
      e.target.value = ''
    },
    [processFile]
  )

  const handleClear = async () => {
    await window.casper.context.clear(type)
    setDoc(null)
    setError(null)
  }

  const label = type === 'resume' ? 'Resume' : 'Job Description'
  const icon = type === 'resume' ? '📄' : '💼'

  if (current) {
    return (
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">{current.filename}</p>
              <p className="text-xs text-zinc-500">
                ~{current.tokenEstimate.toLocaleString()} tokens
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        </div>
        <div className="mt-3 text-xs text-zinc-400 line-clamp-3 font-mono bg-zinc-900/50 rounded-lg p-2">
          {current.text.slice(0, 200)}…
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-indigo-500 bg-indigo-950/30'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/30 hover:bg-zinc-800/50'
        }`}
      >
        <span className="text-2xl">{icon}</span>
        <p className="mt-2 text-sm font-medium text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {loading ? 'Parsing…' : 'Drop PDF or TXT, or click to browse'}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
