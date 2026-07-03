import ActivityKit
import ExpoModulesCore

// MARK: - Live Activity attributes
// ActivityKit matches an activity between the app (which starts it here) and the
// widget extension (which renders it) by the attribute TYPE NAME + Codable shape.
// This struct MUST stay byte-compatible with the copy in
// targets/widget/StreakActivity.swift — same name, same fields, same types.

struct StreakActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Days of streak on the line tonight.
    var streak: Int
    /// Couple-midnight (device-local) — the countdown target.
    var endDate: Date
  }

  /// The couple-local yyyy-mm-dd this activity is about; the dedupe key.
  var dayKey: String
}

// MARK: - Module
// Tiny local Expo module (expo-modules-core) — @bacons/apple-targets has no JS
// API for ActivityKit, so the app drives start/update/end through this bridge.
// Live Activities can only be STARTED while the app is foregrounded; push-to-start
// (remote) is a follow-up that needs the APNs Live Activity entitlement.

public class ParallaxLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ParallaxLiveActivity")

    /// Whether the user/device allows Live Activities at all.
    Function("isSupported") { () -> Bool in
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Starts tonight's streak-countdown activity, or updates it in place if one
    /// for the same dayKey is already live. Any stray activity from a previous
    /// day is ended first. Returns true when an activity is live afterwards.
    AsyncFunction("startOrUpdate") { (streak: Int, endTimestampMs: Double, dayKey: String) async -> Bool in
      let endDate = Date(timeIntervalSince1970: endTimestampMs / 1000)
      guard endDate > Date() else { return false }

      let state = StreakActivityAttributes.ContentState(streak: streak, endDate: endDate)
      let content = ActivityContent(state: state, staleDate: endDate)

      if let existing = Activity<StreakActivityAttributes>.activities.first(where: { $0.attributes.dayKey == dayKey }) {
        await existing.update(content)
        return true
      }

      for stray in Activity<StreakActivityAttributes>.activities {
        await stray.end(ActivityContent(state: stray.content.state, staleDate: nil), dismissalPolicy: .immediate)
      }

      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
      do {
        _ = try Activity.request(attributes: StreakActivityAttributes(dayKey: dayKey), content: content)
        return true
      } catch {
        return false
      }
    }

    /// Ends every streak activity immediately (drop revealed, day rolled over,
    /// or the streak is no longer at risk). Returns true if any was ended.
    AsyncFunction("endAll") { () async -> Bool in
      var ended = false
      for activity in Activity<StreakActivityAttributes>.activities {
        await activity.end(ActivityContent(state: activity.content.state, staleDate: nil), dismissalPolicy: .immediate)
        ended = true
      }
      return ended
    }
  }
}
