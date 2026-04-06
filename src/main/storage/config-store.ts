import Store from 'electron-store'
import type { Settings } from '../ipc/channels'

const DEFAULT_SETTINGS: Settings = {
  overlayOpacity: 0.95,
  overlayPosition: { x: -1, y: -1 }, // -1 = use default (right edge)
  model: 'gemini-2.0-flash',
  autoTrigger: true,
  autoTriggerDebounceMs: 2000,
  micDeviceId: null,
  theme: 'dark'
}

const store = new Store<{ settings: Settings }>({
  name: 'casper-config',
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

class ConfigStore {
  get(): Settings {
    return store.get('settings')
  }

  set(partial: Partial<Settings>): void {
    const current = this.get()
    store.set('settings', { ...current, ...partial })
  }

  reset(): void {
    store.set('settings', DEFAULT_SETTINGS)
  }
}

export const configStore = new ConfigStore()
