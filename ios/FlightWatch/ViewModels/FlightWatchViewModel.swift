import Foundation
import SwiftUI
import Observation

// MARK: - Main ViewModel

@Observable
final class FlightWatchViewModel {

    // MARK: Aircraft

    var aircraft: [Aircraft] = Self.sampleAircraft
    var liveData: [String: LiveState] = [:]

    // MARK: Trips / History

    var flightHistory: [Trip] = Self.sampleTrips

    // MARK: Settings

    var notifications = NotificationSettings()
    var apiKeys = APIKeys()
    var appSettings = AppSettings()

    // MARK: UI State

    var isAddAircraftPresented = false
    var selectedTab: AppTab = .home

    // MARK: Computed

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
        flightHistory.sorted { ($0.startedAt) > ($1.startedAt) }
    }

    // MARK: Actions

    func addAircraft(_ plane: Aircraft) {
        aircraft.append(plane)
    }

    func deleteAircraft(at offsets: IndexSet) {
        let sorted = sortedAircraft
        let idsToRemove = offsets.map { sorted[$0].id }
        aircraft.removeAll { idsToRemove.contains($0.id) }
    }

    func deleteAircraft(_ plane: Aircraft) {
        aircraft.removeAll { $0.id == plane.id }
    }

    func deleteTrips(at offsets: IndexSet) {
        let sorted = sortedHistory
        let idsToRemove = offsets.map { sorted[$0].id }
        flightHistory.removeAll { idsToRemove.contains($0.id) }
    }

    func clearHistory() {
        flightHistory.removeAll()
    }
}

// MARK: - Live State

struct LiveState {
    var latitude: Double
    var longitude: Double
    var altitude: Double   // meters
    var velocity: Double   // m/s
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
        case .home: "Aircraft"
        case .history: "History"
        case .settings: "Settings"
        }
    }

    var icon: String {
        switch self {
        case .home: "airplane"
        case .history: "clock.arrow.circlepath"
        case .settings: "gearshape.fill"
        }
    }
}

// MARK: - Sample Data for Previews

extension FlightWatchViewModel {

    static let sampleAircraft: [Aircraft] = [
        Aircraft(
            tailNumber: "N172SP",
            icao24: "a0b1c2",
            nickname: "SkyHawk",
            color: .blue,
            emoji: "🛩️",
            aircraftType: "Cessna 172",
            addedAt: .now.addingTimeInterval(-86400 * 30),
            lastSeen: .now.addingTimeInterval(-3600),
            status: .airborne
        ),
        Aircraft(
            tailNumber: "N525BA",
            icao24: "a3d4e5",
            nickname: "Citation",
            color: .indigo,
            emoji: "✈️",
            aircraftType: "Cessna Citation CJ4",
            addedAt: .now.addingTimeInterval(-86400 * 60),
            lastSeen: .now.addingTimeInterval(-7200),
            status: .onGround
        ),
        Aircraft(
            tailNumber: "N78GK",
            icao24: "f6a7b8",
            nickname: "Papa Golf",
            color: .teal,
            emoji: "🛫",
            aircraftType: "Piper PA-28",
            addedAt: .now.addingTimeInterval(-86400 * 10),
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
            startedAt: .now.addingTimeInterval(-7200),
            endedAt: .now.addingTimeInterval(-3600),
            duration: 3600,
            departureAirport: "KJFK",
            arrivalAirport: "KBOS",
            maxAltitude: 3048,
            maxSpeed: 62,
            callsign: "N172SP"
        ),
        Trip(
            tailNumber: "N525BA",
            nickname: "Citation",
            emoji: "✈️",
            aircraftType: "Cessna Citation CJ4",
            startedAt: .now.addingTimeInterval(-86400),
            endedAt: .now.addingTimeInterval(-82800),
            duration: 5400,
            departureAirport: "KLAX",
            arrivalAirport: "KSFO",
            maxAltitude: 10668,
            maxSpeed: 206,
            callsign: "N525BA"
        ),
        Trip(
            tailNumber: "N172SP",
            nickname: "SkyHawk",
            emoji: "🛩️",
            aircraftType: "Cessna 172",
            startedAt: .now.addingTimeInterval(-86400 * 3),
            endedAt: .now.addingTimeInterval(-86400 * 3 + 5400),
            duration: 5400,
            departureAirport: "KATL",
            arrivalAirport: "KMCO",
            maxAltitude: 2438,
            maxSpeed: 59
        ),
    ]

    static var preview: FlightWatchViewModel {
        FlightWatchViewModel()
    }
}
