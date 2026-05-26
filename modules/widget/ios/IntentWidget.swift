import WidgetKit
import SwiftUI

struct IntentProvider: TimelineProvider {
    func placeholder(in context: Context) -> IntentEntry {
        IntentEntry(date: Date(), stateEmoji: "⚡", stateLabel: "Ready")
    }

    func getSnapshot(in context: Context, completion: @escaping (IntentEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<IntentEntry>) -> Void) {
        let entry = placeholder(in: context)
        completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600))))
    }
}

struct IntentEntry: TimelineEntry {
    let date: Date
    let stateEmoji: String
    let stateLabel: String
}

struct IntentWidgetEntryView: View {
    var entry: IntentEntry

    var body: some View {
        VStack(spacing: 8) {
            Text(entry.stateEmoji)
                .font(.system(size: 32))
            Text(entry.stateLabel)
                .font(.caption)
                .foregroundColor(.gray)
            Link(destination: URL(string: "intent://rescue")!) {
                Text("Rescue Me")
                    .font(.caption.bold())
                    .foregroundColor(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.purple)
                    .cornerRadius(16)
            }
        }
        .padding()
        .containerBackground(for: .widget) {
            Color(red: 0.024, green: 0.024, blue: 0.031) // #060608
        }
    }
}

@main
struct IntentWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "IntentWidget", provider: IntentProvider()) { entry in
            IntentWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("INTENT")
        .description("Quick rescue from your home screen")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
