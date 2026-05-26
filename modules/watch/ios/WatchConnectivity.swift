import WatchConnectivity

class IntentWatchConnectivity: NSObject, WCSessionDelegate {
  static let shared = IntentWatchConnectivity()
  
  func startSession() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
  }
  
  func sendRescueCommand(state: String, minutes: Int) {
    guard WCSession.default.isReachable else { return }
    WCSession.default.sendMessage([
      "command": "startRescue",
      "state": state,
      "minutes": minutes
    ], replyHandler: nil, errorHandler: nil)
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    // Handle messages from watch
  }
  
  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) {}
}
