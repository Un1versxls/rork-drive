//
//  StreakTier.swift
//  DRIVE
//

import SwiftUI

struct StreakTier {
    let id: String
    let label: String
    let minDays: Int
    let primary: Color
    let secondary: Color
    let rings: Int
    let particleCount: Int
    let description: String
}

enum StreakTiers {
    static let all: [StreakTier] = [
        StreakTier(id: "none", label: "Begin", minDays: 0, primary: Color(hex: 0xC9A87C), secondary: Color(hex: 0xE8D5B7), rings: 0, particleCount: 0, description: "Start today."),
        StreakTier(id: "spark", label: "Spark", minDays: 1, primary: Color(hex: 0xD4AF37), secondary: Color(hex: 0xE8D5B7), rings: 1, particleCount: 6, description: "The first flame."),
        StreakTier(id: "flame", label: "Flame", minDays: 3, primary: Color(hex: 0xD4A027), secondary: Color(hex: 0xF0C55A), rings: 2, particleCount: 10, description: "Warming up."),
        StreakTier(id: "blaze", label: "Blaze", minDays: 7, primary: Color(hex: 0xE89B2B), secondary: Color(hex: 0xFFD97A), rings: 3, particleCount: 14, description: "Full momentum."),
        StreakTier(id: "ember", label: "Ember Storm", minDays: 10, primary: Color(hex: 0xF08A1E), secondary: Color(hex: 0xFFCE6A), rings: 3, particleCount: 16, description: "Flames orbit you."),
        StreakTier(id: "inferno", label: "Inferno", minDays: 30, primary: Color(hex: 0xF26B1A), secondary: Color(hex: 0xFFB74D), rings: 4, particleCount: 20, description: "Unstoppable."),
        StreakTier(id: "nuclear", label: "Nuclear", minDays: 50, primary: Color(hex: 0xB4E03A), secondary: Color(hex: 0x8BFF4D), rings: 5, particleCount: 26, description: "Critical mass."),
        StreakTier(id: "phoenix", label: "Phoenix", minDays: 100, primary: Color(hex: 0xFFE08A), secondary: Color(hex: 0xFFD66B), rings: 6, particleCount: 30, description: "Legendary."),
    ]

    static func tier(for days: Int) -> StreakTier {
        if days >= 100 { return all[7] }
        if days >= 50 { return all[6] }
        if days >= 30 { return all[5] }
        if days >= 10 { return all[4] }
        if days >= 7 { return all[3] }
        if days >= 3 { return all[2] }
        if days >= 1 { return all[1] }
        return all[0]
    }
}
