import SwiftUI

// MARK: - Flight History

struct HistoryView: View {
    @Environment(FlightWatchViewModel.self) private var vm

    var body: some View {
        @Bindable var vm = vm

        NavigationStack {
            Group {
                if vm.flightHistory.isEmpty {
                    ContentUnavailableView(
                        "No Flights Recorded",
                        systemImage: "clock.arrow.circlepath",
                        description: Text("Completed flights will appear here once your tracked aircraft take off and land.")
                    )
                } else if vm.filteredHistory.isEmpty {
                    ContentUnavailableView.search(text: vm.searchText)
                } else {
                    tripList
                }
            }
            .navigationTitle("Flight Log")
            .searchable(text: $vm.searchText, prompt: "Search flights")
            .toolbar {
                if !vm.flightHistory.isEmpty {
                    ToolbarItem(placement: .primaryAction) {
                        Menu {
                            Button(role: .destructive) {
                                vm.isConfirmingClearHistory = true
                            } label: {
                                Label("Clear All History", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis.circle")
                        }
                    }
                }
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

    // MARK: - Trip List

    private var tripList: some View {
        List {
            // Summary badge
            Section {
                HStack(spacing: 8) {
                    Image(systemName: "point.topleft.down.to.point.bottomright.curvepath")
                        .foregroundStyle(.blue)
                    Text("\(vm.filteredHistory.count) flight\(vm.filteredHistory.count == 1 ? "" : "s") recorded")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .listRowBackground(Color.clear)
            }

            // Grouped by day
            ForEach(vm.groupedHistory, id: \.key) { group in
                Section(group.key) {
                    ForEach(group.trips) { trip in
                        NavigationLink(value: trip) {
                            TripRow(trip: trip)
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                withAnimation { vm.deleteTrip(trip) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationDestination(for: Trip.self) { trip in
            TripDetailView(trip: trip)
        }
    }
}

// MARK: - Trip Row

private struct TripRow: View {
    let trip: Trip

    var body: some View {
        HStack(spacing: 14) {
            Text(trip.emoji)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(.blue.opacity(0.1), in: .rect(cornerRadius: 10))

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

                // Metadata
                HStack(spacing: 8) {
                    Label(trip.nickname, systemImage: "airplane")
                    Text("·").foregroundStyle(.quaternary)
                    Text(trip.formattedDuration)
                    Text("·").foregroundStyle(.quaternary)
                    Text(trip.startedAt, format: .dateTime.hour().minute())
                }
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }

            Spacer()
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(trip.nickname), \(trip.formattedRoute), \(trip.formattedDuration)")
    }
}

// MARK: - Trip Detail

struct TripDetailView: View {
    let trip: Trip

    var body: some View {
        List {
            // Route header
            Section {
                routeHeader
                    .listRowBackground(Color.clear)
            }

            Section("Flight Info") {
                LabeledContent("Aircraft", value: "\(trip.emoji) \(trip.nickname)")
                LabeledContent("Tail Number") {
                    Text(trip.tailNumber)
                        .monospaced()
                }
                if !trip.aircraftType.isEmpty {
                    LabeledContent("Type", value: trip.aircraftType)
                }
                if let callsign = trip.callsign, !callsign.isEmpty {
                    LabeledContent("Callsign") {
                        Text(callsign)
                            .monospaced()
                    }
                }
            }

            Section("Timing") {
                LabeledContent("Departed") {
                    Text(trip.startedAt, format: .dateTime.month().day().hour().minute())
                }
                if let ended = trip.endedAt {
                    LabeledContent("Arrived") {
                        Text(ended, format: .dateTime.month().day().hour().minute())
                    }
                }
                LabeledContent("Duration", value: trip.formattedDuration)
            }

            Section("Performance") {
                LabeledContent("Max Altitude", value: trip.formattedAltitude)
                LabeledContent("Max Speed", value: trip.formattedSpeed)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Trip Details")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: Route Header

    private var routeHeader: some View {
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
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Route: \(trip.formattedRoute)")
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
