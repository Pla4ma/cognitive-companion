import { requireNativeModule } from 'expo-modules-core'
const LiveActivityModule = requireNativeModule('LiveActivityModule')

export function startActivity(stateEmoji: string, stateLabel: string, minutes: number, sessionType: string) {
  LiveActivityModule.startActivity(stateEmoji, stateLabel, minutes, sessionType)
}

export function updateActivity(timeRemaining: number) {
  LiveActivityModule.updateActivity(timeRemaining)
}

export function endActivity() {
  LiveActivityModule.endActivity()
}
