import React, { useEffect } from 'react'
import { OverlayContainer } from './components/overlay/OverlayContainer'
import { SettingsContainer } from './components/settings/SettingsContainer'
import { useIpcEvents } from './hooks/useIpcEvents'
import { useAudioCapture } from './hooks/useAudioCapture'

export default function App() {
  // Connect all IPC event listeners
  useIpcEvents()

  // Set up audio capture pipeline (listens for start/stop from main)
  useAudioCapture()

  // Detect which "view" to show based on URL hash
  const isSettings = window.location.hash === '#settings'

  if (isSettings) {
    return <SettingsContainer />
  }

  return (
    <div className="w-full h-full">
      <OverlayContainer />
    </div>
  )
}
