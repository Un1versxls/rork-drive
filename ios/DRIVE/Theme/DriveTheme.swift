//
//  DriveTheme.swift
//  DRIVE
//
//  Central color palette + reusable style helpers matching the
//  clean white + warm gold DRIVE aesthetic.
//

import SwiftUI

enum DriveColor {
    static let bg = Color(hex: 0xFFFFFF)
    static let bgSoft = Color(hex: 0xFAFAFA)
    static let bgAlt = Color(hex: 0xF5F4F0)

    static let text = Color(hex: 0x1A1A1A)
    static let textDim = Color(hex: 0x6B6B6B)
    static let textMuted = Color(hex: 0x9A9A9A)

    static let accent = Color(hex: 0xC9A87C)
    static let gold = Color(hex: 0xD4AF37)
    static let accentDark = Color(hex: 0xB8956A)
    static let accentDeep = Color(hex: 0x8B7355)
    static let accentSoft = Color(hex: 0xE8D5B7)
    static let accentDim = Color(red: 201/255, green: 168/255, blue: 124/255, opacity: 0.12)

    static let border = Color(hex: 0xEEEEEE)
    static let borderStrong = Color(red: 201/255, green: 168/255, blue: 124/255, opacity: 0.45)

    static let danger = Color(hex: 0xC44545)
    static let success = Color(hex: 0x6B8E4E)
    static let dangerBg = Color(hex: 0xFDECEC)
    static let dangerBorder = Color(hex: 0xF3C6C6)
}

extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

/// A soft white card matching the DRIVE surface look.
struct DriveCard: ViewModifier {
    var fill: Color = DriveColor.bg
    var padding: CGFloat = 16
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(fill)
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(DriveColor.border, lineWidth: 1)
            }
    }
}

extension View {
    func driveCard(fill: Color = DriveColor.bg, padding: CGFloat = 16) -> some View {
        modifier(DriveCard(fill: fill, padding: padding))
    }

    /// Section eyebrow label used across screens.
    func sectionEyebrow() -> some View {
        self
            .font(.system(size: 11, weight: .heavy))
            .tracking(1.2)
            .foregroundStyle(DriveColor.textDim)
            .textCase(.uppercase)
    }
}
