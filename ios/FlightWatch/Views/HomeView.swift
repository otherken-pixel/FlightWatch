import SwiftUI

// MARK: - Home / Aircraft Dashboard

struct HomeView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        NavigationStack {
            List {
                // Stats banner
                Section {
                    StatsRow(airborne: vm.airborneCount, totalTrips: vm.totalTrips)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }

                // Aircraft list
                Section {
                    if vm.sortedAircraft.isEmpty {
                        emptyState
                    } else {
                        ForEach(vm.sortedAircraft) { plane in
                            NavigationLink(value: plane) {
                                AircraftRow(aircraft: plane)
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    vm.deleteAircraft(plane)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                        }
                    }
                } header: {
                    Text("Tracked Aircraft")
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Aircraft")
            .navigationDestination(for: Aircraft.self) { plane in
                AircraftDetailView(aircraft: plane)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        vm.isAddAircraftPresented = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                }
            }
            .sheet(isPresented: Bindable(vm).isAddAircraftPresented) {
                AddAircraftSheet()
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "airplane.circle")
                .font(.system(size: 48))
                .foregroundStyle(.tertiary)
            Text("No Aircraft Tracked")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Tap + to add your first aircraft")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .listRowBackground(Color.clear)
    }
}

// MARK: - Stats Row

private struct StatsRow: View {
    let airborne: Int
    let totalTrips: Int

    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                icon: "airplane.departure",
                label: "Live",
                value: "\(airborne)",
                tint: .green
            )
            StatCard(
                icon: "point.topleft.down.to.point.bottomright.curvepath",
                label: "Trips",
                value: "\(totalTrips)",
                tint: .blue
            )
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

private struct StatCard: View {
    let icon: String
    let label: String
    let value: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.subheadline)
                    .foregroundStyle(tint)
                Text(label)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Text(value)
                .font(.system(.title, design: .rounded, weight: .bold))
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial, in: .rect(cornerRadius: 14))
    }
}

// MARK: - Aircraft Row

private struct AircraftRow: View {
    let aircraft: Aircraft

    var body: some View {
        HStack(spacing: 14) {
            // Emoji avatar
            Text(aircraft.emoji)
                .font(.title)
                .frame(width: 48, height: 48)
                .background(
                    aircraft.color.opacity(0.15),
                    in: .rect(cornerRadius: 12)
                )

            // Info
            VStack(alignment: .leading, spacing: 3) {
                Text(aircraft.nickname)
                    .font(.headline)

                HStack(spacing: 8) {
                    Text(aircraft.tailNumber)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    if !aircraft.aircraftType.isEmpty {
                        Text("·")
                            .foregroundStyle(.quaternary)
                        Text(aircraft.aircraftType)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            // Status badge
            StatusBadge(status: aircraft.status)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: FlightStatus

    var body: some View {
        HStack(spacing: 5) {
            if status == .airborne {
                Circle()
                    .fill(.green)
                    .frame(width: 7, height: 7)
                    .shadow(color: .green.opacity(0.5), radius: 3)
            }
            Image(systemName: status.icon)
                .font(.caption)
        }
        .foregroundStyle(status.tint)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(status.tint.opacity(0.12), in: .capsule)
    }
}

// MARK: - Aircraft Detail (Stub)

struct AircraftDetailView: View {
    let aircraft: Aircraft

    var body: some View {
        List {
            Section {
                VStack(spacing: 12) {
                    Text(aircraft.emoji)
                        .font(.system(size: 56))
                    Text(aircraft.nickname)
                        .font(.title2.bold())
                    Text(aircraft.tailNumber)
                        .font(.subheadline.monospaced())
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
                .listRowBackground(Color.clear)
            }

            Section("Details") {
                LabeledContent("Aircraft Type", value: aircraft.aircraftType.isEmpty ? "—" : aircraft.aircraftType)
                LabeledContent("ICAO24", value: aircraft.icao24.isEmpty ? "—" : aircraft.icao24.uppercased())
                LabeledContent("Status", value: aircraft.status.label)
                if let lastSeen = aircraft.lastSeen {
                    LabeledContent("Last Seen", value: lastSeen.formatted(.relative(presentation: .named)))
                }
            }

            if aircraft.fuelCapacity != nil || aircraft.fuelBurn != nil {
                Section("Performance") {
                    if let cap = aircraft.fuelCapacity {
                        LabeledContent("Fuel Capacity", value: "\(Int(cap)) gal")
                    }
                    if let burn = aircraft.fuelBurn {
                        LabeledContent("Fuel Burn", value: "\(String(format: "%.1f", burn)) gph")
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle(aircraft.tailNumber)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Add Aircraft Sheet

struct AddAircraftSheet: View {
    @Environment(FlightWatchViewModel.self) private var vm
    @Environment(\.dismiss) private var dismiss

    @State private var tailNumber = ""
    @State private var icao24 = ""
    @State private var nickname = ""
    @State private var aircraftType = ""
    @State private var selectedEmoji = "✈️"

    private let emojiOptions = ["✈️", "🛩️", "🛫", "🛬", "🚁", "🪂"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Aircraft Info") {
                    TextField("Tail Number (e.g. N172SP)", text: $tailNumber)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()

                    TextField("ICAO24 Hex (optional)", text: $icao24)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.body.monospaced())

                    TextField("Nickname (optional)", text: $nickname)

                    TextField("Aircraft Type (optional)", text: $aircraftType)
                }

                Section("Icon") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                        ForEach(emojiOptions, id: \.self) { emoji in
                            Button {
                                selectedEmoji = emoji
                            } label: {
                                Text(emoji)
                                    .font(.title)
                                    .frame(width: 48, height: 48)
                                    .background(
                                        selectedEmoji == emoji
                                            ? Color.accentColor.opacity(0.15)
                                            : Color.clear,
                                        in: .rect(cornerRadius: 10)
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(
                                                selectedEmoji == emoji ? Color.accentColor : .clear,
                                                lineWidth: 2
                                            )
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("Add Aircraft")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        let plane = Aircraft(
                            tailNumber: tailNumber.trimmingCharacters(in: .whitespaces),
                            icao24: icao24.trimmingCharacters(in: .whitespaces).lowercased(),
                            nickname: nickname.trimmingCharacters(in: .whitespaces),
                            emoji: selectedEmoji,
                            aircraftType: aircraftType.trimmingCharacters(in: .whitespaces)
                        )
                        vm.addAircraft(plane)
                        dismiss()
                    }
                    .disabled(tailNumber.trimmingCharacters(in: .whitespaces).isEmpty)
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - Previews

#Preview("Home") {
    HomeView()
        .environment(FlightWatchViewModel.preview)
}

#Preview("Add Aircraft") {
    AddAircraftSheet()
        .environment(FlightWatchViewModel.preview)
}

#Preview("Aircraft Detail") {
    NavigationStack {
        AircraftDetailView(aircraft: FlightWatchViewModel.sampleAircraft[0])
    }
}
