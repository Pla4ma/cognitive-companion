import ExpoModulesCore
import WidgetKit

public class WidgetModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetModule")

    Function("updateWidget") {
      WidgetCenter.shared.reloadAllTimelines()
    }

    Function("updateWidgetKind") { (kind: String) in
      WidgetCenter.shared.reloadTimelines(ofKind: kind)
    }
  }
}
