import SwiftUI

struct MainTabView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        @Bindable var vm = vm

        TabView(selection: $vm.selectedTab) {
            Tab("Aircraft", systemImage: "airplane", value: .home) {
                HomeView()
            }
            .badge(vm.airborneCount > 0 ? vm.airborneCount : 0)

            Tab("History", systemImage: "clock.arrow.circlepath", value: .history) {
                HistoryView()
            }

            Tab("Settings", systemImage: "gearshape.fill", value: .settings) {
                SettingsView()
            }
        }
        .tint(.blue)
    }
}

#Preview {
    MainTabView()
        .environment(FlightWatchViewModel.preview)
}
