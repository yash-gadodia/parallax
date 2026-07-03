import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Live Activity attributes
// ActivityKit matches an activity between the app process (which starts it via
// modules/parallax-live-activity) and this extension (which renders it) by the
// attribute TYPE NAME + Codable shape. This struct MUST stay byte-compatible
// with the copy in modules/parallax-live-activity/ios/ParallaxLiveActivityModule.swift.

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

// MARK: - Views
// Reuses Tokens / KickLabel / Wordmark from index.swift (same target module).
// Copy stays warm + lowercase — a gentle nudge, never guilt.

/// Auto-ticking countdown; renders "3:12:45" and counts down natively, so the
/// activity needs no pushes or timeline updates while it runs.
struct StreakCountdownText: View {
  let endDate: Date
  var size: CGFloat = 32
  var color: Color = Tokens.p1Deep

  var body: some View {
    Text(timerInterval: Date.now...max(Date.now, endDate), countsDown: true)
      .font(.system(size: size, weight: .regular, design: .serif))
      .monospacedDigit()
      .multilineTextAlignment(.leading)
      .foregroundStyle(color)
  }
}

struct StreakLockScreenView: View {
  let state: StreakActivityAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(spacing: 5) {
        Circle().fill(Tokens.p1Deep).frame(width: 6, height: 6)
        KickLabel(text: "still time for tonight's drop", color: Tokens.p1Deep)
        Spacer(minLength: 0)
        Wordmark(size: 13).opacity(0.55)
      }
      HStack(alignment: .lastTextBaseline, spacing: 8) {
        StreakCountdownText(endDate: state.endDate, size: 32)
          .frame(maxWidth: 104, alignment: .leading)
        Text("to keep your \(state.streak)-day streak 🔥")
          .font(.system(size: 13, weight: .semibold, design: .rounded))
          .foregroundStyle(Tokens.inkSoft)
      }
    }
    .padding(16)
  }
}

// MARK: - Configuration

struct StreakLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StreakActivityAttributes.self) { context in
      StreakLockScreenView(state: context.state)
        .activityBackgroundTint(Color(hex: 0xFCEFF0)) // dawn gradient start
        .activitySystemActionForegroundColor(Tokens.ink)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 4) {
            KickLabel(text: "tonight's drop", color: Tokens.p1)
            Text("🔥 \(context.state.streak) day\(context.state.streak == 1 ? "" : "s")")
              .font(.system(size: 13, weight: .bold, design: .rounded))
              .foregroundStyle(.white)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          StreakCountdownText(endDate: context.state.endDate, size: 22, color: .white)
            .frame(maxWidth: 76, alignment: .trailing)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text("still time for tonight's drop")
            .font(.system(size: 13, weight: .semibold, design: .rounded))
            .foregroundStyle(.white.opacity(0.85))
        }
      } compactLeading: {
        Text("🔥")
      } compactTrailing: {
        StreakCountdownText(endDate: context.state.endDate, size: 13, color: Tokens.p1)
          .frame(maxWidth: 52)
      } minimal: {
        Text("🔥")
      }
    }
  }
}
