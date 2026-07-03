import WidgetKit
import SwiftUI

// MARK: - Shared data (written by the app via @bacons/apple-targets ExtensionStorage;
// see src/features/widget/sync.ts)

let appGroup = "group.com.yashgadodia.parallax"
let snapshotKey = "widget_snapshot"

// MARK: - Design tokens
// Hardcoded hex values mirror src/design/tokens.ts — keep in sync manually.

extension Color {
  init(hex: UInt32) {
    self.init(
      .sRGB,
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255,
      opacity: 1
    )
  }
}

enum Tokens {
  static let ink = Color(hex: 0x3A3340)        // colors.ink
  static let inkSoft = Color(hex: 0x8B8398)    // colors.inkSoft
  static let inkMute = Color(hex: 0xB7B0C2)    // colors.inkMute
  static let p1 = Color(hex: 0xFF8E7A)         // colors.p1 (coral)
  static let p1Deep = Color(hex: 0xEF6A53)     // colors.p1Deep
  static let p2 = Color(hex: 0x9D95F5)         // colors.p2 (periwinkle)
  static let p2Deep = Color(hex: 0x7064E6)     // colors.p2Deep
  static let match = Color(hex: 0x54C2A0)      // colors.match

  // gradients.dawn — soft peach → lilac
  static let dawn = LinearGradient(
    colors: [Color(hex: 0xFCEFF0), Color(hex: 0xF6EDF6), Color(hex: 0xEEEDFB)],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
  )
}

// MARK: - Snapshot model

struct WidgetSnapshot: Codable {
  var state: String
  var partnerName: String
  var wavePct: Int
  var streak: Int
  var date: String
}

enum WidgetMood {
  case guess(partner: String)          // (a) partner answered, you haven't
  case synced(wave: Int, streak: Int)  // (b) both done
  case waiting                         // (c) neither answered
  case none                            // (d) no data yet
  case risk(streak: Int)               // (e) 20:00+, streak alive, not revealed
}

func localDayString(_ date: Date = Date()) -> String {
  let fmt = DateFormatter()
  fmt.dateFormat = "yyyy-MM-dd"
  fmt.locale = Locale(identifier: "en_US_POSIX")
  return fmt.string(from: date)
}

func readMood(at date: Date = Date()) -> WidgetMood {
  guard
    let defaults = UserDefaults(suiteName: appGroup),
    let raw = defaults.string(forKey: snapshotKey),
    let data = raw.data(using: .utf8),
    let snap = try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
  else {
    return .none
  }
  // A snapshot from a previous day is stale: a fresh drop is waiting.
  if snap.date != localDayString(date) {
    return .waiting
  }
  // The app may have synced hours ago, so the 20:00 streak-risk flip is also
  // derived here (mirrors src/features/widget/snapshot.ts: risk outranks guess,
  // never a revealed day, never without a streak to lose).
  let isRiskHour = Calendar.current.component(.hour, from: date) >= 20
  switch snap.state {
  case "risk": return .risk(streak: snap.streak)
  case "guess":
    return (isRiskHour && snap.streak > 0)
      ? .risk(streak: snap.streak)
      : .guess(partner: snap.partnerName)
  case "synced": return .synced(wave: snap.wavePct, streak: snap.streak)
  case "waiting":
    return (isRiskHour && snap.streak > 0) ? .risk(streak: snap.streak) : .waiting
  default: return .none
  }
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let mood: WidgetMood
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    Entry(date: Date(), mood: .waiting)
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: Date(), mood: context.isPreview ? .waiting : readMood()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let now = Date()
    let midnight = Calendar.current.nextDate(
      after: now,
      matching: DateComponents(hour: 0, minute: 0, second: 30),
      matchingPolicy: .nextTime
    ) ?? now.addingTimeInterval(60 * 60 * 6)
    // One entry now, plus one at 20:00 so the streak-risk flip happens even if
    // the app hasn't synced since the morning; refresh just past midnight so
    // yesterday's state degrades to the teaser.
    var entries = [Entry(date: now, mood: readMood(at: now))]
    if let eightPM = Calendar.current.nextDate(
      after: now,
      matching: DateComponents(hour: 20, minute: 0, second: 0),
      matchingPolicy: .nextTime
    ), eightPM < midnight {
      entries.append(Entry(date: eightPM, mood: readMood(at: eightPM)))
    }
    completion(Timeline(entries: entries, policy: .after(midnight)))
  }
}

// MARK: - Views

struct Wordmark: View {
  var size: CGFloat = 15
  var body: some View {
    Text("para//ax")
      .font(.system(size: size, weight: .regular, design: .serif))
      .italic()
      .foregroundStyle(Tokens.ink)
  }
}

struct KickLabel: View {
  let text: String
  var color: Color = Tokens.inkMute
  var body: some View {
    Text(text.uppercased())
      .font(.system(size: 9, weight: .semibold, design: .monospaced))
      .tracking(1.1)
      .foregroundStyle(color)
  }
}

struct GuessView: View {
  let partner: String
  let isMedium: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 5) {
        Circle().fill(Tokens.p1Deep).frame(width: 6, height: 6)
        KickLabel(text: "your move", color: Tokens.p1Deep)
      }
      Spacer(minLength: 0)
      Text("\(partner.lowercased()) answered today's drop 👀")
        .font(.system(size: isMedium ? 17 : 14, weight: .bold, design: .rounded))
        .foregroundStyle(Tokens.ink)
        .lineLimit(3)
        .minimumScaleFactor(0.8)
      Text("can you guess?")
        .font(.system(size: isMedium ? 13 : 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Tokens.p1Deep)
    }
  }
}

struct SyncedView: View {
  let wave: Int
  let streak: Int
  let isMedium: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      KickLabel(text: "today", color: Tokens.p2Deep)
      Spacer(minLength: 0)
      HStack(alignment: .lastTextBaseline, spacing: 2) {
        Text("\(wave)")
          .font(.system(size: isMedium ? 44 : 34, weight: .regular, design: .serif))
          .foregroundStyle(Tokens.p2Deep)
        Text("%")
          .font(.system(size: isMedium ? 20 : 16, weight: .regular, design: .serif))
          .foregroundStyle(Tokens.p2)
      }
      Text("in sync")
        .font(.system(size: isMedium ? 13 : 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Tokens.inkSoft)
      if streak > 0 {
        Text("🔥 \(streak) day\(streak == 1 ? "" : "s")")
          .font(.system(size: isMedium ? 12 : 10, weight: .bold, design: .rounded))
          .foregroundStyle(Tokens.p1Deep)
          .padding(.horizontal, 8)
          .padding(.vertical, 3)
          .background(Capsule().fill(Tokens.p1.opacity(0.16)))
      }
    }
  }
}

struct WaitingView: View {
  let isMedium: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      KickLabel(text: "today's drop", color: Tokens.p2Deep)
      Spacer(minLength: 0)
      Text("today's three are waiting")
        .font(.system(size: isMedium ? 17 : 14, weight: .bold, design: .rounded))
        .foregroundStyle(Tokens.ink)
        .lineLimit(3)
        .minimumScaleFactor(0.8)
      Text("3 little questions ☁️")
        .font(.system(size: isMedium ? 13 : 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Tokens.inkSoft)
    }
  }
}

struct RiskView: View {
  let streak: Int
  let isMedium: Bool
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 5) {
        Circle().fill(Tokens.p1Deep).frame(width: 6, height: 6)
        KickLabel(text: "streak on the line", color: Tokens.p1Deep)
      }
      Spacer(minLength: 0)
      Text("play before midnight 🔥")
        .font(.system(size: isMedium ? 17 : 14, weight: .bold, design: .rounded))
        .foregroundStyle(Tokens.ink)
        .lineLimit(3)
        .minimumScaleFactor(0.8)
      Text("\(streak) day\(streak == 1 ? "" : "s") to keep")
        .font(.system(size: isMedium ? 12 : 10, weight: .bold, design: .rounded))
        .foregroundStyle(Tokens.p1Deep)
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(Capsule().fill(Tokens.p1.opacity(0.16)))
    }
  }
}

struct EmptyStateView: View {
  var body: some View {
    VStack(spacing: 6) {
      Wordmark(size: 18)
      Text("open parallax")
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .foregroundStyle(Tokens.inkSoft)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct ParallaxWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry

  var isMedium: Bool { family == .systemMedium }

  var body: some View {
    ZStack(alignment: .topTrailing) {
      if case .none = entry.mood {
        EmptyStateView()
      } else {
        HStack(spacing: 0) {
          Group {
            switch entry.mood {
            case .guess(let partner):
              GuessView(partner: partner, isMedium: isMedium)
            case .synced(let wave, let streak):
              SyncedView(wave: wave, streak: streak, isMedium: isMedium)
            case .risk(let streak):
              RiskView(streak: streak, isMedium: isMedium)
            case .waiting, .none:
              WaitingView(isMedium: isMedium)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          if isMedium {
            Wordmark(size: 14)
              .rotationEffect(.degrees(-90))
              .frame(width: 26)
              .opacity(0.55)
          }
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(for: .widget) {
      Tokens.dawn
    }
  }
}

struct ParallaxWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "ParallaxWidget", provider: Provider()) { entry in
      ParallaxWidgetView(entry: entry)
    }
    .configurationDisplayName("parallax")
    .description("today's drop, your wavelength, and your streak — at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct ParallaxWidgetBundle: WidgetBundle {
  var body: some Widget {
    ParallaxWidget()
    StreakLiveActivity() // streak-countdown Live Activity (StreakActivity.swift)
  }
}
