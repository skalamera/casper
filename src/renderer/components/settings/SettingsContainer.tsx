import React, { useEffect, useState } from 'react'
import { FileUploadZone } from '../context/FileUploadZone'
import { useContextStore } from '../../stores/context-store'

interface Keys {
  deepgramApiKey: string
  anthropicApiKey: string
}

export function SettingsContainer() {
  const [keys, setKeys] = useState<Keys>({ deepgramApiKey: '', anthropicApiKey: '' })
  const [saved, setSaved] = useState(false)
  const [model, setModel] = useState<'claude-sonnet-4-20250514' | 'claude-opus-4-20250514'>(
    'claude-sonnet-4-20250514'
  )
  const [autoTrigger, setAutoTrigger] = useState(true)
  const { setResume, setJobDescription } = useContextStore()

  useEffect(() => {
    // Load existing keys and settings
    Promise.all([window.casper.settings.getKeys(), window.casper.settings.get()]).then(
      ([k, s]) => {
        setKeys({ deepgramApiKey: k.deepgramApiKey, anthropicApiKey: k.anthropicApiKey })
        setModel(s.model)
        setAutoTrigger(s.autoTrigger)
      }
    )
    // Load existing context docs
    window.casper.context.get().then(({ resume, jobDescription }) => {
      if (resume) setResume(resume)
      if (jobDescription) setJobDescription(jobDescription)
    })
  }, [])

  const handleSave = async () => {
    await Promise.all([
      window.casper.settings.setKey('deepgramApiKey', keys.deepgramApiKey),
      window.casper.settings.setKey('anthropicApiKey', keys.anthropicApiKey),
      window.casper.settings.set({ model, autoTrigger })
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-zinc-100 p-6 overflow-y-auto">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Casper Settings</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-11">AI Interview Assistant</p>
        </div>

        {/* API Keys */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            API Keys
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Deepgram API Key
                <a
                  href="https://console.deepgram.com"
                  className="ml-2 text-indigo-400 hover:text-indigo-300"
                  target="_blank"
                >
                  Get key ↗
                </a>
              </label>
              <input
                type="password"
                value={keys.deepgramApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, deepgramApiKey: e.target.value }))}
                placeholder="dg_••••••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Anthropic API Key
                <a
                  href="https://console.anthropic.com"
                  className="ml-2 text-indigo-400 hover:text-indigo-300"
                  target="_blank"
                >
                  Get key ↗
                </a>
              </label>
              <input
                type="password"
                value={keys.anthropicApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, anthropicApiKey: e.target.value }))}
                placeholder="sk-ant-••••••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Documents */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            Interview Context
          </h2>
          <p className="text-xs text-zinc-500">
            Upload your resume and the job description. Casper uses these to generate personalized
            answers.
          </p>
          <div className="space-y-3">
            <FileUploadZone type="resume" />
            <FileUploadZone type="jobDescription" />
          </div>
        </section>

        {/* AI Model */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            AI Model
          </h2>
          <div className="space-y-2">
            {(
              [
                { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet', desc: 'Faster · Recommended' },
                { id: 'claude-opus-4-20250514', label: 'Claude Opus', desc: 'Smarter · Slower' }
              ] as const
            ).map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  model === m.id
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/30'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="text-indigo-600"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-200">{m.label}</p>
                  <p className="text-xs text-zinc-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Auto-trigger */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            Behavior
          </h2>
          <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-700 bg-zinc-800/30 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-zinc-200">Auto-generate suggestions</p>
              <p className="text-xs text-zinc-500">
                Automatically generate a suggestion when the interviewer finishes speaking
              </p>
            </div>
            <button
              role="switch"
              aria-checked={autoTrigger}
              onClick={() => setAutoTrigger((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                autoTrigger ? 'bg-indigo-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  autoTrigger ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </section>

        {/* Keyboard shortcuts reference */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
            Keyboard Shortcuts
          </h2>
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 overflow-hidden">
            {[
              ['⌘\\', 'Toggle overlay'],
              ['⌘↵', 'Generate AI suggestion'],
              ['⌘⇧1', 'Suggest Answer mode'],
              ['⌘⇧2', 'Assist mode'],
              ['⌘⇧3', 'Follow-up Questions mode'],
              ['⌘⇧4', 'Recap mode'],
              ['⌘⇧R', 'Start / Stop recording'],
              ['⌘Esc', 'Panic hide overlay']
            ].map(([kbd, desc], i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700/50 last:border-0"
              >
                <span className="text-xs text-zinc-400">{desc}</span>
                <kbd className="text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5">
                  {kbd}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
