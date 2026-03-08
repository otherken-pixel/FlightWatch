import SwiftUI

// MARK: - Settings

struct SettingsView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        @Bindable var vm = vm

        NavigationStack {
            Form {
                // ── Tracked Aircraft ──
                Section {
                    if vm.sortedAircraft.isEmpty {
                        Text("No aircraft tracked yet")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(vm.sortedAircraft) { plane in
                            AircraftSettingsRow(aircraft: plane)
                                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                    Button(role: .destructive) {
                                        withAnimation { vm.deleteAircraft(plane) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
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

                // ── Notifications ──
                Section("Notifications") {
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
                }

                // ── Map & Data ──
                Section {
                    Picker(selection: $vm.appSettings.mapStyle) {
                        ForEach(MapStyle.allCases) { style in
                            Label(style.label, systemImage: style.icon)
                                .tag(style)
                        }
                    } label: {
                        Label("Map Style", systemImage: "map")
                    }

                    Picker(selection: $vm.appSettings.pollInterval) {
                        ForEach(PollInterval.allCases) { interval in
                            Text(interval.label).tag(interval)
                        }
                    } label: {
                        Label("Refresh Interval", systemImage: "arrow.clockwise")
                    }

                    Picker(selection: $vm.appSettings.units) {
                        ForEach(AppSettings.Units.allCases) { unit in
                            Text(unit.label).tag(unit)
                        }
                    } label: {
                        Label("Units", systemImage: "ruler")
                    }
                } header: {
                    Text("Map & Data")
                } footer: {
                    Text("Shorter intervals use more data but update positions faster.")
                }

                // ── API Keys ──
                Section {
                    SecureFieldRow(
                        label: "OpenSky",
                        icon: "key.fill",
                        placeholder: "username:password",
                        text: $vm.apiKeys.openSky
                    )
                    SecureFieldRow(
                        label: "OpenWeather",
                        icon: "cloud.sun.fill",
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
                    Text("Credentials are stored locally on this device and are never sent to third-party servers.")
                }

                // ── About ──
                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")

                    Link(destination: URL(string: "https://openskynetwork.github.io/opensky-api/")!) {
                        Label("OpenSky Network API", systemImage: "arrow.up.right.square")
                    }
                }

                // ── Danger Zone ──
                Section {
                    Button(role: .destructive) {
                        vm.isConfirmingClearHistory = true
                    } label: {
                        Label("Clear Flight History", systemImage: "trash")
                    }
                } footer: {
                    Text("Permanently removes all recorded flights.")
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $vm.isAddAircraftPresented) {
                AddAircraftSheet()
            }
            .confirmationDialog(
                "Clear Flight History",
                isPresented: $vm.isConfirmingClearHistory,
                titleVisibility: .visible
            ) {
                Button("Delete All Flights", role: .destructive) {
                    withAnimation { vm.clearHistory() }
                }
            } message: {
                Text("This will permanently delete all \(vm.flightHistory.count) recorded flights. This action cannot be undone.")
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
                .background(aircraft.statusTint.opacity(0.12), in: .rect(cornerRadius: 8))

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
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(aircraft.nickname), \(aircraft.tailNumber)")
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
                .lineLimit(1)

            if isRevealed {
                TextField(placeholder, text: $text)
                    .monospaced()
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            } else {
                SecureField(placeholder, text: $text)
                    .monospaced()
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
            .accessibilityLabel(isRevealed ? "Hide \(label)" : "Show \(label)")
        }
    }
}

// MARK: - Previews

#Preview("Settings") {
    SettingsView()
        .environment(FlightWatchViewModel.preview)
}
