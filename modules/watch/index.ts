import { requireNativeModule, EventEmitter } from 'expo-modules-core'
const WatchModule = requireNativeModule('WatchModule')
const emitter = new EventEmitter(WatchModule)

export function startWatchSession() {
  // Enable WatchConnectivity
}

export function sendRescueToWatch(state: string, minutes: number) {
  // Send rescue command to paired watch
}
