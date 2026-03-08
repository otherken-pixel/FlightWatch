import Foundation
import SwiftUI
import Observation

// MARK: - Main ViewModel

@Observable
final class FlightWatchViewModel {

    // MARK: - Persisted State

    var aircraft: [Aircraft] {
        didSet { save(aircraft, forKey: .aircraft) }
    }

    var flightHistory: [Trip] {
        didSet { save(flightHistory, forKey: .history) }
    }

    var notifications: NotificationSettings {
        didSet { save(notifications, forKey: .notifications) }
    }

    var apiKeys: APIKeys {
        didSet { save(apiKeys, forKey: .apiKeys) }
    }

    var appSettings: AppSettings {
        didSet { save(appSettings, forKey: .appSettings) }
    }

    // MARK: - Transient State

    var liveData: [String: LiveState] = [:]

    // MARK: - UI State

    var isAddAircraftPresented = false
    var selectedTab: AppTab = .home
    var isConfirmingClearHistory = false
    var searchText = ""

    // MARK: - Init

    init() {
        self.aircraft = Self.load(forKey: .aircraft) ?? Self.sampleAircraft
        self.flightHistory = Self.load(forKey: .history) ?? Self.sampleTrips
        self.notifications = Self.load(forKey: .notifications) ?? NotificationSettings()
        self.apiKeys = Self.load(forKey: .apiKeys) ?? APIKeys()
        self.appSettings = Self.load(forKey: .appSettings) ?? AppSettings()
    }

    // MARK: - Computed

    var airborneCount: Int {
        aircraft.filter { $0.status == .airborne }.count
    }

    var totalTrips: Int {
        flightHistory.count
    }

    var sortedAircraft: [Aircraft] {
        aircraft.sorted { a, b in
            if a.status == .airborne && b.status != .airborne { return true }
            if a.status != .airborne && b.status == .airborne { return false }
            return (a.lastSeen ?? a.addedAt) > (b.lastSeen ?? b.addedAt)
        }
    }

    var sortedHistory: [Trip] {
        flightHistory.sorted { $0.startedAt > $1.startedAt }
    }

    /// History filtered by search text (matches nickname, tail number, airports).
    var filteredHistory: [Trip] {
        guard !searchText.isEmpty else { return sortedHistory }
        let query = searchText.lowercased()
        return sortedHistory.filter { trip in
            trip.nickname.lowercased().contains(query)
            || trip.tailNumber.lowercased().contains(query)
            || (trip.departureAirport?.lowercased().contains(query) ?? false)
            || (trip.arrivalAirport?.lowercased().contains(query) ?? false)
        }
    }

    /// Trips grouped by calendar day for sectioned lists.
    var groupedHistory: [(key: String, date: Date, trips: [Trip])] {
        let grouped = Dictionary(grouping: filteredHistory) { $0.dayKey }
        return grouped
            .map { (key: $0.key, date: $0.value.first!.startedAt, trips: $0.value) }
            .sorted { $0.date > $1.date }
    }

    // MARK: - Actions

    func addAircraft(_ plane: Aircraft) {
        aircraft.append(plane)
    }

    func deleteAircraft(at offsets: IndexSet) {
        let sorted = sortedAircraft
        let ids = Set(offsets.map { sorted[$0].id })
        aircraft.removeAll { ids.contains($0.id) }
    }

    func deleteAircraft(_ plane: Aircraft) {
        aircraft.removeAll { $0.id == plane.id }
    }

    func deleteTrip(_ trip: Trip) {
        flightHistory.removeAll { $0.id == trip.id }
    }

    func deleteTrips(at offsets: IndexSet, from trips: [Trip]) {
        let ids = Set(offsets.map { trips[$0].id })
        flightHistory.removeAll { ids.contains($0.id) }
    }

    func clearHistory() {
        flightHistory.removeAll()
    }

    // MARK: - Persistence (UserDefaults)

    private enum StorageKey: String {
        case aircraft = "fw_aircraft"
        case history = "fw_history"
        case notifications = "fw_notifications"
        case apiKeys = "fw_apiKeys"
        case appSettings = "fw_appSettings"
    }

    private func save<T: Encodable>(_ value: T, forKey key: StorageKey) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key.rawValue)
        }
    }

    private static func load<T: Decodable>(forKey key: StorageKey) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key.rawValue) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - Live State

struct LiveState {
    var latitude: Double
    var longitude: Double
    var altitude: Double        // meters
    var velocity: Double        // m/s
    var heading: Double
    var verticalRate: Double
    var onGround: Bool
    var callsign: String
    var updatedAt: Date
}

// MARK: - Tab Enum

enum AppTab: String, CaseIterable, Identifiable {
    case home, history, settings

    var id: String { rawValue }

    var label: String {
        switch self {
        case .home:     "Aircraft"
        case .history:  "History"
        case .settings: "Settings"
        }
    }

    var icon: String {
        switch self {
        case .home:     "airplane"
        case .history:  "clock.arrow.circlepath"
        case .settings: "gearshape.fill"
        }
    }
}

// MARK: - Sample Data

extension FlightWatchViewModel {

    static let sampleAircraft: [Aircraft] = [
        Aircraft(
            tailNumber: "N172SP",
            icao24: "a0b1c2",
            nickname: "SkyHawk",
            emoji: "🛩️",
            aircraftType: "Cessna 172",
            addedAt: .now.addingTimeInterval(-86_400 * 30),
            lastSeen: .now.addingTimeInterval(-3_600),
            status: .airborne
        ),
        Aircraft(
            tailNumber: "N525BA",
            icao24: "a3d4e5",
            nickname: "Citation",
            emoji: "✈️",
            aircraftType: "Cessna Citation CJ4",
            addedAt: .now.addingTimeInterval(-86_400 * 60),
            lastSeen: .now.addingTimeInterval(-7_200),
            status: .onGround
        ),
        Aircraft(
            tailNumber: "N78GK",
            icao24: "f6a7b8",
            nickname: "Papa Golf",
            emoji: "🛫",
            aircraftType: "Piper PA-28",
            addedAt: .now.addingTimeInterval(-86_400 * 10),
            lastSeen: nil,
            status: .unknown
        ),
    ]

    static let sampleTrips: [Trip] = [
        Trip(
            tailNumber: "N172SP",
            nickname: "SkyHawk",
            emoji: "🛩️",
            aircraftType: "Cessna 172",
            startedAt: .now.addingTimeInterval(-7_200),
            endedAt: .now.addingTimeInterval(-3_600),
            duration: 3_600,
            departureAirport: "KJFK",
            arrivalAirport: "KBOS",
            maxAltitude: 3_048,
            maxSpeed: 62,
            callsign: "N172SP"
        ),
        Trip(
            tailNumber: "N525BA",
            nickname: "Citation",
            emoji: "✈️",
            aircraftType: "Cessna Citation CJ4",
            startedAt: .now.addingTimeInterval(-86_400),
            endedAt: .now.addingTimeInterval(-82_800),
            duration: 5_400,
            departureAirport: "KLAX",
            arrivalAirport: "KSFO",
            maxAltitude: 10_668,
            maxSpeed: 206,
            callsign: "N525BA"
        ),
        Trip(
            tailNumber: "N172SP",
            nickname: "SkyHawk",
            emoji: "🛩️",
            aircraftType: "Cessna 172",
            startedAt: .now.addingTimeInterval(-86_400 * 3),
            endedAt: .now.addingTimeInterval(-86_400 * 3 + 5_400),
            duration: 5_400,
            departureAirport: "KATL",
            arrivalAirport: "KMCO",
            maxAltitude: 2_438,
            maxSpeed: 59
        ),
    ]

    static var preview: FlightWatchViewModel {
        let vm = FlightWatchViewModel()
        vm.aircraft = sampleAircraft
        vm.flightHistory = sampleTrips
        return vm
    }
}
