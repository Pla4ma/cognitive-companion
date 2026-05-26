import ExpoModulesCore
import ActivityKit

struct IntentActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var stateEmoji: String
    var stateLabel: String
    var timeRemaining: Int
    var isActive: Bool
  }
  var sessionType: String
}

class LiveActivityModule: Module {
  def props -> [String: Any] { return [:] }
}
