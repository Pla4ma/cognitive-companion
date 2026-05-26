import ActivityKit

class LiveActivityManager {
  static let shared = LiveActivityManager()
  private var currentActivity: Activity<IntentActivityAttributes>?
  
  func startActivity(stateEmoji: String, stateLabel: String, minutes: Int, sessionType: String) {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    let attributes = IntentActivityAttributes(sessionType: sessionType)
    let state = IntentActivityAttributes.ContentState(
      stateEmoji: stateEmoji,
      stateLabel: stateLabel,
      timeRemaining: minutes * 60,
      isActive: true
    )
    do {
      currentActivity = try Activity.request(attributes: attributes, content: .init(state: state, staleDate: nil))
    } catch {}
  }
  
  func updateActivity(timeRemaining: Int) {
    guard let activity = currentActivity else { return }
    let state = IntentActivityAttributes.ContentState(
      stateEmoji: activity.content.state.stateEmoji,
      stateLabel: activity.content.state.stateLabel,
      timeRemaining: timeRemaining,
      isActive: true
    )
    Task { await activity.update(.init(state: state, staleDate: nil)) }
  }
  
  func endActivity() {
    guard let activity = currentActivity else { return }
    let state = IntentActivityAttributes.ContentState(
      stateEmoji: "✅",
      stateLabel: "Complete",
      timeRemaining: 0,
      isActive: false
    )
    Task {
      await activity.end(.init(state: state, staleDate: nil), dismissalPolicy: .after(.now + 30))
      currentActivity = nil
    }
  }
}
