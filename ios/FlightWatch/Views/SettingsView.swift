import SwiftUI

// MARK: - Settings

struct SettingsView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        @Bindable var vm = vm

        NavigationStack {
            Form {
                // Tracked Aircraft
                Section {
                    if vm.sortedAircraft.isEmpty {
                        Text("No aircraft tracked yet")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(vm.sortedAircraft) { plane in
                            AircraftSettingsRow(aircraft: plane)
                        }
                        .onDelete { offsets in
                            vm.deleteAircraft(at: offsets)
                        }
                    }

                    Button {
                        vm.isAddAircraftPresented = true
                    } label: {
                        Label("Add Aircraft", systemImage: "plus.circle.fill")
                    }
                } header: {
                    Text("Tracked Aircraft")
                } footer: {
                    Text("Swipe left on any aircraft to remove it from tracking.")
                }

                // Notifications
                Section {
                    Toggle(isOn: $vm.notifications.takeoff) {
                        Label("Takeoff Alerts", systemImage: "airplane.departure")
                    }
                    Toggle(isOn: $vm.notifications.landing) {
                        Label("Landing Alerts", systemImage: "airplane.arrival")
                    }
                    Toggle(isOn: $vm.notifications.lostSignal) {
                        Label("Signal Lost", systemImage: "wifi.slash")
                    }
                    Toggle(isOn: $vm.notifications.sound) {
                        Label("Sound", systemImage: "speaker.wave.2")
                    }
                } header: {
                    Text("Notifications")
                }

                // Map & Polling
                Section {
                    Picker("Map Style", selection: $vm.appSettings.mapStyle) {
                        ForEach(MapStyle.allCases) { style in
                            Text(style.label).tag(style)
                        }
                    }

                    Picker("Refresh Interval", selection: $vm.appSettings.pollInterval) {
                        ForEach(PollInterval.allCases) { interval in
                            Text(interval.label).tag(interval)
                        }
                    }
                } header: {
                    Text("Map & Data")
                } footer: {
                    Text("Shorter intervals use more data but update positions faster.")
                }

                // API Keys
                Section {
                    SecureFieldRow(
                        label: "OpenSky",
                        icon: "key",
                        placeholder: "username:password",
                        text: $vm.apiKeys.openSky
                    )
                    SecureFieldRow(
                        label: "OpenWeather",
                        icon: "cloud.sun",
                        placeholder: "API key",
                        text: $vm.apiKeys.openWeather
                    )
                    SecureFieldRow(
                        label: "ADS-B Exchange",
                        icon: "antenna.radiowaves.left.and.right",
                        placeholder: "API key",
                        text: $vm.apiKeys.adsbExchange
                    )
                } header: {
                    Text("API Keys")
                } footer: {
                    Text("Optional. Providing credentials can increase rate limits and enable additional data sources.")
                }

                // About
                Section {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")

                    Link(destination: URL(string: "https://openskynetwork.github.io/opensky-api/")!) {
                        Label("OpenSky Network API", systemImage: "arrow.up.right.square")
                    }
                } header: {
                    Text("About")
                }

                // Danger Zone
                Section {
                    Button(role: .destructive) {
                        vm.clearHistory()
                    } label: {
                        Label("Clear Flight History", systemImage: "trash")
                    }
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $vm.isAddAircraftPresented) {
                AddAircraftSheet()
            }
        }
    }
}

// MARK: - Aircraft Settings Row

private struct AircraftSettingsRow: View {
    let aircraft: Aircraft

    var body: some View {
        HStack(spacing: 12) {
            Text(aircraft.emoji)
                .font(.title3)
                .frame(width: 36, height: 36)
                .background(aircraft.color.opacity(0.12), in: .rect(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(aircraft.nickname)
                    .font(.body.weight(.medium))
                HStack(spacing: 6) {
                    Text(aircraft.tailNumber)
                        .font(.caption.monospaced())
                        .foregroundStyle(.secondary)
                    if !aircraft.icao24.isEmpty {
                        Text("·")
                            .foregroundStyle(.quaternary)
                        Text(aircraft.icao24.uppercased())
                            .font(.caption.monospaced())
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Spacer()

            StatusBadge(status: aircraft.status)
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Secure Field Row

private struct SecureFieldRow: View {
    let label: String
    let icon: String
    let placeholder: String
    @Binding var text: String
    @State private var isRevealed = false

    var body: some View {
        HStack {
            Label(label, systemImage: icon)
                .frame(width: 140, alignment: .leading)

            if isRevealed {
                TextField(placeholder, text: $text)
                    .font(.body.monospaced())
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            } else {
                SecureField(placeholder, text: $text)
                    .font(.body.monospaced())
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }

            Button {
                isRevealed.toggle()
            } label: {
                Image(systemName: isRevealed ? "eye.slash" : "eye")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
    }
}

// MARK: - Previews

#Preview("Settings") {
    SettingsView()
        .environment(FlightWatchViewModel.preview)
}
