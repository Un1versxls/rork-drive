//
//  AppInfo.swift
//  DRIVE
//
//  App version metadata + the "What's New" content shown after an update.
//

import SwiftUI

enum AppInfo {
    /// Bump this whenever you ship a new round of features. The What's New
    /// popup shows when `profile.lastSeenBuild` is below this number.
    static let build = 3
    static let versionLabel = "v3.3"


    /// Number of badges to unlock in one calendar month to earn a free month.
    static let badgeBlitzGoal = 15
}


/// One feature card in the What's New flow.
struct WhatsNewFeature: Identifiable {
    let id = UUID()
    let icon: String
    let tint: Color
    let eyebrow: String
    let title: String
    let body: String
    /// Marks the celebratory event card (special animation).
    let isEvent: Bool

    init(icon: String, tint: Color, eyebrow: String, title: String, body: String, isEvent: Bool = false) {
        self.icon = icon
        self.tint = tint
        self.eyebrow = eyebrow
        self.title = title
        self.body = body
        self.isEvent = isEvent
    }
}

enum WhatsNew {
    static let features: [WhatsNewFeature] = [
        WhatsNewFeature(
            icon: "point.topleft.down.to.point.bottomright.curvepath",
            tint: DriveColor.accentDeep,
            eyebrow: "NEW",
            title: "Pick your path",
            body: "Choose an online AI business or an in-person hustle, then get 3 ideas matched to your answers — claim one to begin."
        ),
        WhatsNewFeature(
            icon: "icloud.fill",
            tint: DriveColor.accent,
            eyebrow: "NEW",
            title: "Your progress, everywhere",
            body: "Claim your business with your email and your tasks, streak and plan sync to the cloud — sign back in anytime."
        ),
        WhatsNewFeature(
            icon: "brain.head.profile",
            tint: DriveColor.accentDeep,
            eyebrow: "NEW",
            title: "Ask the Coach",
            body: "Open any task and ask the built-in AI questions about it. It explains and guides — but never does the work for you."
        ),
        WhatsNewFeature(
            icon: "flame.fill",
            tint: Color(hex: 0xF26B1A),
            eyebrow: "NEW",
            title: "Tap your streak",
            body: "Tap the flame on your dashboard or progress page for a reaction that grows with your streak."
        ),
        WhatsNewFeature(
            icon: "rosette",
            tint: DriveColor.gold,
            eyebrow: "EVENT",
            title: "Badge Blitz",
            body: "Unlock \(AppInfo.badgeBlitzGoal) badges in a single month and we'll gift you a free month of Premium. The clock resets every month.",
            isEvent: true
        ),
        WhatsNewFeature(
            icon: "sparkles",
            tint: DriveColor.accent,
            eyebrow: "POLISH",
            title: "Smoother & faster",
            body: "Refined animations, new badges, haptics, and a fresh roadmap with tappable milestones. Plus the usual bug fixes."
        ),
    ]
}
