import SwiftUI

// MARK: - Flight History

struct HistoryView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        NavigationStack {
            Group {
                if vm.sortedHistory.isEmpty {
                    ContentUnavailableView(
                        "No Flights Recorded",
                        systemImage: "clock.arrow.circlepath",
                        description: Text("Completed flights will appear here once your tracked aircraft take off and land.")
                    )
                } else {
                    tripList
                }
            }
            .navigationTitle("Flight Log")
            .toolbar {
                if !vm.flightHistory.isEmpty {
                    ToolbarItem(placement: .primaryAction) {
                        Menu {
                            Button(role: .destructive) {
                                vm.clearHistory()
                            } label: {
                                Label("Clear All History", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
            }
        }
    }

    private var tripList: some View {
        List {
            // Summary badge
            Section {
                HStack(spacing: 8) {
                    Image(systemName: "point.topleft.down.to.point.bottomright.curvepath")
                        .foregroundStyle(.blue)
                    Text("\(vm.flightHistory.count) flight\(vm.flightHistory.count == 1 ? "" : "s") recorded")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .listRowBackground(Color.clear)
            }

            // Trips grouped by date
            ForEach(groupedTrips, id: \.key) { date, trips in
                Section {
                    ForEach(trips) { trip in
                        NavigationLink(value: trip) {
                            TripRow(trip: trip)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                if let idx = vm.flightHistory.firstIndex(where: { $0.id == trip.id }) {
                                    vm.flightHistory.remove(at: idx)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                } header: {
                    Text(date)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationDestination(for: Trip.self) { trip in
            TripDetailView(trip: trip)
        }
    }

    // Group trips by calendar day
    private var groupedTrips: [(key: String, value: [Trip])] {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none

        let grouped = Dictionary(grouping: vm.sortedHistory) { trip in
            formatter.string(from: trip.startedAt)
        }

        return grouped
            .sorted { a, b in
                guard let dateA = vm.sortedHistory.first(where: { formatter.string(from: $0.startedAt) == a.key })?.startedAt,
                      let dateB = vm.sortedHistory.first(where: { formatter.string(from: $0.startedAt) == b.key })?.startedAt
                else { return false }
                return dateA > dateB
            }
    }
}

// MARK: - Trip Row

private struct TripRow: View {
    let trip: Trip

    var body: some View {
        HStack(spacing: 14) {
            // Emoji
            Text(trip.emoji)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(.blue.opacity(0.1), in: .rect(cornerRadius: 10))

            // Route & info
            VStack(alignment: .leading, spacing: 4) {
                // Route
                HStack(spacing: 6) {
                    Text(trip.departureAirport ?? "????")
                        .font(.headline.monospaced())
                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                    Text(trip.arrivalAirport ?? "????")
                        .font(.headline.monospaced())
                }

                // Meta
                HStack(spacing: 10) {
                    Label(trip.nickname, systemImage: "airplane")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text("·")
                        .foregroundStyle(.quaternary)

                    Text(trip.formattedDuration)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text("·")
                        .foregroundStyle(.quaternary)

                    Text(trip.startedAt, format: .dateTime.hour().minute())
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Trip Detail

struct TripDetailView: View {
    let trip: Trip

    var body: some View {
        List {
            // Route header
            Section {
                VStack(spacing: 16) {
                    // Large route display
                    HStack(spacing: 20) {
                        VStack(spacing: 4) {
                            Text(trip.departureAirport ?? "????")
                                .font(.system(.largeTitle, design: .monospaced, weight: .bold))
                            Text("Departure")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        VStack(spacing: 4) {
                            Image(systemName: "airplane")
                                .font(.title2)
                                .foregroundStyle(.blue)
                                .rotationEffect(.degrees(90))
                            Image(systemName: "line.diagonal")
                                .font(.caption2)
                                .foregroundStyle(.quaternary)
                                .rotationEffect(.degrees(-25))
                        }

                        VStack(spacing: 4) {
                            Text(trip.arrivalAirport ?? "????")
                                .font(.system(.largeTitle, design: .monospaced, weight: .bold))
                            Text("Arrival")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .listRowBackground(Color.clear)
            }

            // Flight info
            Section("Flight Info") {
                LabeledContent("Aircraft", value: "\(trip.emoji) \(trip.nickname)")
                LabeledContent("Tail Number", value: trip.tailNumber)
                if !trip.aircraftType.isEmpty {
                    LabeledContent("Type", value: trip.aircraftType)
                }
                if let callsign = trip.callsign, !callsign.isEmpty {
                    LabeledContent("Callsign", value: callsign)
                }
            }

            // Timing
            Section("Timing") {
                LabeledContent("Departed", value: trip.startedAt.formatted(.dateTime.month().day().hour().minute()))
                if let ended = trip.endedAt {
                    LabeledContent("Arrived", value: ended.formatted(.dateTime.month().day().hour().minute()))
                }
                LabeledContent("Duration", value: trip.formattedDuration)
            }

            // Performance
            Section("Performance") {
                LabeledContent("Max Altitude", value: trip.formattedAltitude)
                LabeledContent("Max Speed", value: trip.formattedSpeed)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Trip Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Previews

#Preview("History - Populated") {
    HistoryView()
        .environment(FlightWatchViewModel.preview)
}

#Preview("History - Empty") {
    let vm = FlightWatchViewModel()
    vm.flightHistory = []
    return HistoryView()
        .environment(vm)
}

#Preview("Trip Detail") {
    NavigationStack {
        TripDetailView(trip: FlightWatchViewModel.sampleTrips[0])
    }
}
