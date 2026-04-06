import React, { useEffect, useState } from 'react'
import { FileUploadZone } from '../context/FileUploadZone'
import { useContextStore } from '../../stores/context-store'

interface Keys {
  deepgramApiKey: string
  geminiApiKey: string
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-400">
        {title}
      </span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

export function SettingsContainer() {
  const [keys, setKeys] = useState<Keys>({ deepgramApiKey: '', geminiApiKey: '' })
  const [saved, setSaved] = useState(false)
  const [model, setModel] = useState<'gemini-2.0-flash' | 'gemini-2.5-pro'>('gemini-2.0-flash')
  const [autoTrigger, setAutoTrigger] = useState(true)
  const { setResume, setJobDescription } = useContextStore()

  useEffect(() => {
    Promise.all([window.casper.settings.getKeys(), window.casper.settings.get()]).then(
      ([k, s]) => {
        setKeys({ deepgramApiKey: k.deepgramApiKey, geminiApiKey: k.geminiApiKey })
        setModel(s.model)
        setAutoTrigger(s.autoTrigger)
      }
    )
    window.casper.context.get().then(({ resume, jobDescription }) => {
      if (resume) setResume(resume)
      if (jobDescription) setJobDescription(jobDescription)
    })
  }, [])

  const handleSave = async () => {
    await Promise.all([
      window.casper.settings.setKey('deepgramApiKey', keys.deepgramApiKey),
      window.casper.settings.setKey('geminiApiKey', keys.geminiApiKey),
      window.casper.settings.set({ model, autoTrigger })
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0d0d18] text-zinc-100 overflow-y-auto">
      {/* Title bar spacer — accounts for macOS traffic-light buttons (hiddenInset) */}
      <div className="h-9 w-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      <div className="px-8 pb-10 max-w-[520px] mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100 leading-tight">Casper Settings</h1>
            <p className="text-xs text-zinc-500 mt-0.5">AI Interview Assistant</p>
          </div>
        </div>

        {/* ── API Keys ───────────────────────────────────────────────── */}
        <section className="mb-9">
          <SectionHeader title="API Keys" />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Deepgram API Key</label>
                <a
                  href="https://console.deepgram.com"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get key ↗
                </a>
              </div>
              <input
                type="password"
                value={keys.deepgramApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, deepgramApiKey: e.target.value }))}
                placeholder="dg_••••••••••••••••••••••"
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get key ↗
                </a>
              </div>
              <input
                type="password"
                value={keys.geminiApiKey}
                onChange={(e) => setKeys((k) => ({ ...k, geminiApiKey: e.target.value }))}
                placeholder="AIza••••••••••••••••••••••••••••••••••••"
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>
        </section>

        {/* ── Interview Context ──────────────────────────────────────── */}
        <section className="mb-9">
          <SectionHeader title="Interview Context" />
          <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
            Upload your resume and the job description. Casper uses these to tailor every suggestion to your background and the role.
          </p>
          <div className="space-y-3">
            <FileUploadZone type="resume" />
            <FileUploadZone type="jobDescription" />
          </div>
        </section>

        {/* ── AI Model ───────────────────────────────────────────────── */}
        <section className="mb-9">
          <SectionHeader title="AI Model" />
          <div className="space-y-2">
            {(
              [
                {
                  id: 'gemini-2.0-flash',
                  label: 'Gemini 2.0 Flash',
                  desc: 'Faster responses · Recommended for live interviews',
                  badge: 'Recommended'
                },
                {
                  id: 'gemini-2.5-pro',
                  label: 'Gemini 2.5 Pro',
                  desc: 'Higher quality · Slightly slower',
                  badge: null
                }
              ] as const
            ).map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
                  model === m.id
                    ? 'border-indigo-500/70 bg-indigo-950/40 shadow-sm shadow-indigo-900/30'
                    : 'border-zinc-700/70 hover:border-zinc-600 bg-zinc-800/30 hover:bg-zinc-800/50'
                }`}
              >
                {/* Custom radio */}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  model === m.id ? 'border-indigo-500' : 'border-zinc-600'
                }`}>
                  {model === m.id && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">{m.label}</p>
                    {m.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* ── Behavior ───────────────────────────────────────────────── */}
        <section className="mb-9">
          <SectionHeader title="Behavior" />
          <div className="flex items-center justify-between px-4 py-4 rounded-xl border border-zinc-700/70 bg-zinc-800/30">
            <div className="pr-6">
              <p className="text-sm font-medium text-zinc-200">Auto-generate suggestions</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Automatically generate a suggestion when the interviewer finishes speaking
              </p>
            </div>
            <button
              role="switch"
              aria-checked={autoTrigger}
              onClick={() => setAutoTrigger((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                autoTrigger ? 'bg-indigo-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  autoTrigger ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ── Keyboard Shortcuts ─────────────────────────────────────── */}
        <section className="mb-9">
          <SectionHeader title="Keyboard Shortcuts" />
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/20 overflow-hidden">
            {[
              ['⌘\\', 'Toggle overlay visibility'],
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
                className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/40 last:border-0"
              >
                <span className="text-sm text-zinc-400">{desc}</span>
                <kbd className="ml-4 shrink-0 text-[11px] font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 rounded-md px-2.5 py-1 shadow-sm">
                  {kbd}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* ── Save ───────────────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg ${
            saved
              ? 'bg-green-600 text-white shadow-green-900/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 active:scale-[0.99]'
          }`}
        >
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
