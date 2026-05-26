const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

/**
 * Expo config plugin for iOS WidgetKit (Lock Screen + Home Screen widgets).
 *
 * Adds an IntentWidget extension target to the Xcode project.
 * The actual widget Swift code must be created in ios/IntentWidget/.
 *
 * Usage in app.json:
 *   "plugins": ["./plugins/withWidgetKit"]
 */
const withWidgetKit = (config) => {
  // Step 1: Ensure the widget directory exists
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const widgetDir = path.join(cfg.modRequest.platformProjectRoot, 'IntentWidget')
      if (!fs.existsSync(widgetDir)) {
        fs.mkdirSync(widgetDir, { recursive: true })

        // Write minimal widget Swift file
        const widgetSwift = `import WidgetKit
import SwiftUI

struct IntentProvider: TimelineProvider {
    func placeholder(in context: Context) -> IntentEntry {
        IntentEntry(date: Date(), emoji: "⚡", message: "Rescue Me")
    }

    func getSnapshot(in context: Context, completion: @escaping (IntentEntry) -> Void) {
        let entry = IntentEntry(date: Date(), emoji: "⚡", message: "Rescue Me")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let entry = IntentEntry(date: Date(), emoji: "⚡", message: "Rescue Me")
        let timeline = Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(3600)))
        completion(timeline)
    }
}

struct IntentEntry: TimelineEntry {
    let date: Date
    let emoji: String
    let message: String
}

struct IntentWidgetEntryView: View {
    var entry: IntentProvider.Entry

    var body: some View {
        VStack(spacing: 4) {
            Text(entry.emoji)
                .font(.system(size: 24))
            Text(entry.message)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.white)
        }
        .containerBackground(for: .widget) {
            Color(red: 0.024, green: 0.024, blue: 0.031) // #060608
        }
    }
}

struct IntentWidget: Widget {
    let kind: String = "IntentWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: IntentProvider()) { entry in
            IntentWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("INTENT")
        .description("Quick rescue from your lock screen.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])
    }
}

@main
struct IntentWidgetBundle: WidgetBundle {
    var body: some Widget {
        IntentWidget()
    }
}
`
        fs.writeFileSync(path.join(widgetDir, 'IntentWidget.swift'), widgetSwift)

        // Write Info.plist for the widget extension
        const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>IntentWidget</string>
    <key>CFBundleName</key>
    <string>IntentWidget</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>
`
        fs.writeFileSync(path.join(widgetDir, 'Info.plist'), infoPlist)
      }
      return cfg
    },
  ])

  // Step 2: Add the widget target to the Xcode project
  config = withXcodeProject(config, (cfg) => {
    const xcodeProject = cfg.modResults
    const widgetGroupName = 'IntentWidget'
    const bundleId = `${config.ios.bundleIdentifier}.IntentWidget`

    // Check if target already exists
    const targets = xcodeProject.pbxNativeTargetSection()
    const alreadyExists = Object.keys(targets).some(
      (key) => targets[key]?.name === widgetGroupName
    )

    if (!alreadyExists) {
      try {
        const target = xcodeProject.addTarget(widgetGroupName, 'app_extension', widgetGroupName, bundleId)
        if (target) {
          // Add the Swift file to the target
          xcodeProject.addSourceFile(
            'IntentWidget/IntentWidget.swift',
            { target: target.uuid },
            widgetGroupName
          )
        }
      } catch (err) {
        console.warn('[withWidgetKit] Could not add widget target:', err.message)
      }
    }

    return cfg
  })

  return config
}

module.exports = withWidgetKit
