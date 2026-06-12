//
//  Badges.swift
//  DRIVE
//

import Foundation

enum BadgeMetric: String {
    case completed, streak, points, businessesTried = "businesses_tried"
    case daysActive = "days_active", earlyBird = "early_bird", fullDay = "full_day"
    case premium
}

struct Badge: Identifiable {
    let id: String
    let title: String
    let description: String
    let icon: String          // SF Symbol name
    let threshold: Int
    let metric: BadgeMetric
    let category: String
    let important: Bool
}

enum Badges {
    static let all: [Badge] = [
        Badge(id: "first_task", title: "First Move", description: "Complete your first task", icon: "sparkles", threshold: 1, metric: .completed, category: "tasks", important: true),
        Badge(id: "ten_tasks", title: "Getting Serious", description: "Complete 10 tasks", icon: "bolt.fill", threshold: 10, metric: .completed, category: "tasks", important: false),
        Badge(id: "twentyfive_tasks", title: "Quarter Hundred", description: "Complete 25 tasks", icon: "target", threshold: 25, metric: .completed, category: "tasks", important: false),
        Badge(id: "fifty_tasks", title: "Half Century", description: "Complete 50 tasks", icon: "medal.fill", threshold: 50, metric: .completed, category: "tasks", important: true),
        Badge(id: "century", title: "Century Club", description: "Complete 75 tasks", icon: "trophy.fill", threshold: 75, metric: .completed, category: "tasks", important: true),

        Badge(id: "streak_3", title: "Warming Up", description: "3 day streak", icon: "flame.fill", threshold: 3, metric: .streak, category: "streak", important: false),
        Badge(id: "streak_7", title: "On Fire", description: "7 day streak", icon: "flame.fill", threshold: 7, metric: .streak, category: "streak", important: true),
        Badge(id: "streak_14", title: "Two Week Warrior", description: "14 day streak", icon: "flame.fill", threshold: 14, metric: .streak, category: "streak", important: false),
        Badge(id: "streak_21", title: "Habit Formed", description: "21 day streak", icon: "flame.fill", threshold: 21, metric: .streak, category: "streak", important: true),

        Badge(id: "points_500", title: "Point Hunter", description: "Earn 500 points", icon: "star.fill", threshold: 500, metric: .points, category: "points", important: false),
        Badge(id: "points_1000", title: "Four Digits", description: "Earn 1,000 points", icon: "star.fill", threshold: 1000, metric: .points, category: "points", important: true),
        Badge(id: "points_2000", title: "Elite Driver", description: "Earn 2,000 points", icon: "crown.fill", threshold: 2000, metric: .points, category: "points", important: false),
        Badge(id: "points_5000", title: "High Roller", description: "Earn 5,000 points", icon: "diamond.fill", threshold: 5000, metric: .points, category: "points", important: true),

        Badge(id: "full_day", title: "Clean Sweep", description: "Finish every task in a single day", icon: "checkmark.seal.fill", threshold: 1, metric: .fullDay, category: "explorer", important: true),
        Badge(id: "early_bird", title: "Early Bird", description: "Complete a task before noon", icon: "sunrise.fill", threshold: 1, metric: .earlyBird, category: "explorer", important: false),
        Badge(id: "explorer_3", title: "Explorer", description: "Try 3 different businesses", icon: "safari.fill", threshold: 3, metric: .businessesTried, category: "explorer", important: false),
        Badge(id: "active_7_days", title: "Regular", description: "Use the app on 7 different days", icon: "calendar.badge.checkmark", threshold: 7, metric: .daysActive, category: "explorer", important: false),

        Badge(id: "premium_member", title: "Premium Driver", description: "Reach Premium status", icon: "crown.fill", threshold: 1, metric: .premium, category: "premium", important: true),
    ]

    static let importantIds: Set<String> = Set(all.filter { $0.important }.map { $0.id })
}
