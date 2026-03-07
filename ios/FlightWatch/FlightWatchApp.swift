import SwiftUI

@main
struct FlightWatchApp: App {
    @State private var viewModel = FlightWatchViewModel()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environment(viewModel)
        }
    }
}
