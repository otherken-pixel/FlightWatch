import Foundation
import SwiftUI

// MARK: - Aircraft

struct Aircraft: Identifiable, Hashable, Codable {
    let id: UUID
    var tailNumber: String
    var icao24: String
    var nickname: String
    var emoji: String
    var aircraftType: String
    var fuelCapacity: Double?   // gallons
    var fuelBurn: Double?       // gph
    var addedAt: Date
    var lastSeen: Date?
    var status: FlightStatus

    init(
        id: UUID = UUID(),
        tailNumber: String,
        icao24: String = "",
        nickname: String = "",
        emoji: String = "✈️",
        aircraftType: String = "",
        fuelCapacity: Double? = nil,
        fuelBurn: Double? = nil,
        addedAt: Date = .now,
        lastSeen: Date? = nil,
        status: FlightStatus = .unknown
    ) {
        self.id = id
        self.tailNumber = tailNumber
        self.icao24 = icao24
        self.nickname = nickname.isEmpty ? tailNumber : nickname
        self.emoji = emoji
        self.aircraftType = aircraftType
        self.fuelCapacity = fuelCapacity
        self.fuelBurn = fuelBurn
        self.addedAt = addedAt
        self.lastSeen = lastSeen
        self.status = status
    }

    /// Semantic tint derived from status for use across views.
    var statusTint: Color { status.tint }
}

// MARK: - Flight Status

enum FlightStatus: String, CaseIterable, Hashable, Codable {
    case unknown
    case onGround = "on_ground"
    case taxiing
    case airborne
    case landed

    var label: String {
        switch self {
        case .unknown:  "Unknown"
        case .onGround: "On Ground"
        case .taxiing:  "Taxiing"
        case .airborne: "Airborne"
        case .landed:   "Landed"
        }
    }

    var icon: String {
        switch self {
        case .unknown:  "questionmark.circle"
        case .onGround: "parkingsign.circle.fill"
        case .taxiing:  "arrow.right.circle.fill"
        case .airborne: "airplane"
        case .landed:   "airplane.arrival"
        }
    }

    var tint: Color {
        switch self {
        case .unknown:  .secondary
        case .onGround: .orange
        case .taxiing:  .yellow
        case .airborne: .green
        case .landed:   .blue
        }
    }
}

// MARK: - Trip

struct Trip: Identifiable, Hashable, Codable {
    let id: UUID
    var tailNumber: String
    var nickname: String
    var icao24: String
    var emoji: String
    var aircraftType: String
    var startedAt: Date
    var endedAt: Date?
    var duration: TimeInterval?     // seconds
    var departureAirport: String?   // ICAO code
    var arrivalAirport: String?     // ICAO code
    var maxAltitude: Double?        // meters
    var maxSpeed: Double?           // m/s
    var callsign: String?

    init(
        id: UUID = UUID(),
        tailNumber: String,
        nickname: String = "",
        icao24: String = "",
        emoji: String = "✈️",
        aircraftType: String = "",
        startedAt: Date = .now,
        endedAt: Date? = nil,
        duration: TimeInterval? = nil,
        departureAirport: String? = nil,
        arrivalAirport: String? = nil,
        maxAltitude: Double? = nil,
        maxSpeed: Double? = nil,
        callsign: String? = nil
    ) {
        self.id = id
        self.tailNumber = tailNumber
        self.nickname = nickname
        self.icao24 = icao24
        self.emoji = emoji
        self.aircraftType = aircraftType
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.duration = duration
        self.departureAirport = departureAirport
        self.arrivalAirport = arrivalAirport
        self.maxAltitude = maxAltitude
        self.maxSpeed = maxSpeed
        self.callsign = callsign
    }

    // MARK: Formatted Helpers

    var formattedDuration: String {
        guard let duration else { return "—" }
        let hours = Int(duration) / 3600
        let minutes = (Int(duration) % 3600) / 60
        if hours > 0 { return "\(hours)h \(minutes)m" }
        return "\(minutes)m"
    }

    var formattedRoute: String {
        let dep = departureAirport ?? "????"
        let arr = arrivalAirport ?? "????"
        return "\(dep) → \(arr)"
    }

    var formattedAltitude: String {
        guard let alt = maxAltitude else { return "—" }
        return "\(Int(alt * 3.28084).formatted()) ft MSL"
    }

    var formattedSpeed: String {
        guard let spd = maxSpeed else { return "—" }
        return "\(Int(spd * 1.94384)) kts"
    }

    /// Calendar day key for grouping.
    var dayKey: String {
        startedAt.formatted(.dateTime.year().month(.wide).day())
    }
}

// MARK: - Notification Settings

struct NotificationSettings: Codable {
    var takeoff: Bool = true
    var landing: Bool = true
    var lostSignal: Bool = false
    var sound: Bool = true
}

// MARK: - API Keys

struct APIKeys: Codable {
    var openSky: String = ""
    var openWeather: String = ""
    var adsbExchange: String = ""
}

// MARK: - App Settings

struct AppSettings: Codable {
    var mapStyle: MapStyle = .dark
    var pollInterval: PollInterval = .tenSeconds
    var units: Units = .aviation

    enum Units: String, CaseIterable, Identifiable, Codable {
        case aviation   // knots, feet
        case metric     // km/h, meters
        case imperial   // mph, feet

        var id: String { rawValue }
        var label: String { rawValue.capitalized }
    }
}

enum MapStyle: String, CaseIterable, Identifiable, Codable {
    case dark, light, satellite

    var id: String { rawValue }

    var label: String {
        switch self {
        case .dark:      "Dark"
        case .light:     "Light"
        case .satellite: "Satellite"
        }
    }

    var icon: String {
        switch self {
        case .dark:      "moon.fill"
        case .light:     "sun.max.fill"
        case .satellite: "globe.americas.fill"
        }
    }
}

enum PollInterval: Int, CaseIterable, Identifiable, Codable {
    case fiveSeconds = 5
    case tenSeconds = 10
    case thirtySeconds = 30
    case oneMinute = 60

    var id: Int { rawValue }

    var label: String {
        switch self {
        case .fiveSeconds:   "5 seconds"
        case .tenSeconds:    "10 seconds"
        case .thirtySeconds: "30 seconds"
        case .oneMinute:     "1 minute"
        }
    }
}
