//
//  Models.swift
//  DRIVE
//
//  Core data models for the DRIVE experience.
//

import Foundation

// MARK: - Onboarding answer enums

enum PrimaryGoal: String, Codable, CaseIterable, Identifiable {
    case earnIncome = "earn_income"
    case buildSkills = "build_skills"
    case growBusiness = "grow_business"
    case stayProductive = "stay_productive"
    case dayTrading = "day_trading"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .earnIncome: return "Earn extra income"
        case .buildSkills: return "Learn a new skill"
        case .growBusiness: return "Grow my business"
        case .stayProductive: return "Stay productive"
        case .dayTrading: return "Learn day trading"
        }
    }

    var subtitle: String {
        switch self {
        case .earnIncome: return "Start a side hustle that pays"
        case .buildSkills: return "Get great at something new"
        case .growBusiness: return "Scale what you already run"
        case .stayProductive: return "Win every single day"
        case .dayTrading: return "Build an edge in the markets"
        }
    }

    var emoji: String {
        switch self {
        case .earnIncome: return "💸"
        case .buildSkills: return "🧠"
        case .growBusiness: return "📈"
        case .stayProductive: return "⚡️"
        case .dayTrading: return "📊"
        }
    }
}

enum ExperienceLevel: String, Codable, CaseIterable, Identifiable {
    case beginner, intermediate, advanced, expert
    var id: String { rawValue }
    var title: String { rawValue.capitalized }
    var subtitle: String {
        switch self {
        case .beginner: return "Just getting started"
        case .intermediate: return "I know the basics"
        case .advanced: return "I've done this before"
        case .expert: return "I do this professionally"
        }
    }
}

enum TimeCommitment: String, Codable, CaseIterable, Identifiable {
    case m15 = "15m"
    case m30 = "30m"
    case h1 = "1h"
    case h2 = "2h"
    var id: String { rawValue }
    var title: String {
        switch self {
        case .m15: return "15 minutes"
        case .m30: return "30 minutes"
        case .h1: return "1 hour"
        case .h2: return "2+ hours"
        }
    }
    var subtitle: String { "per day" }
}

enum Priority: String, Codable, CaseIterable, Identifiable {
    case flexibility, earning, learning, speed
    var id: String { rawValue }
    var title: String {
        switch self {
        case .flexibility: return "Flexibility"
        case .earning: return "Earning fast"
        case .learning: return "Learning deeply"
        case .speed: return "Moving fast"
        }
    }
    var subtitle: String {
        switch self {
        case .flexibility: return "Work on my own terms"
        case .earning: return "Money is the goal"
        case .learning: return "Mastery over money"
        case .speed: return "Ship now, refine later"
        }
    }
}

enum Obstacle: String, Codable, CaseIterable, Identifiable {
    case time, money, confidence, direction, accountability
    var id: String { rawValue }
    var title: String {
        switch self {
        case .time: return "Not enough time"
        case .money: return "Not enough money"
        case .confidence: return "Self-doubt"
        case .direction: return "No clear direction"
        case .accountability: return "Staying consistent"
        }
    }
}

enum PlanId: String, Codable {
    case base, premium
}

enum BillingCycle: String, Codable {
    case monthly, yearly
}

// MARK: - Tasks

enum TaskCategory: String, Codable, CaseIterable {
    case focus, skill, health, growth, mindset, hustle

    var label: String { rawValue.capitalized }
    var hex: UInt {
        switch self {
        case .focus: return 0x8B7355
        case .skill: return 0xC9A87C
        case .health: return 0x6B8E4E
        case .growth: return 0xD4AF37
        case .mindset: return 0xA68A5B
        case .hustle: return 0xB8956A
        }
    }
}

enum TaskStatus: String, Codable {
    case pending, completed, skipped
}

struct TaskSeed: Codable, Hashable {
    let title: String
    let description: String
    let category: TaskCategory
    let difficulty: Int
}

struct DriveTask: Codable, Identifiable, Hashable {
    var id: String
    var title: String
    var description: String
    var category: TaskCategory
    var difficulty: Int
    var basePoints: Int
    var status: TaskStatus
    var dateKey: String
}

// MARK: - Business

struct BusinessIdea: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var tagline: String
    var description: String
    var whyFit: String
    var startupCost: String
    var timeToIncome: String
    var firstMilestones: [String]
}

// MARK: - Subscription

struct Subscription: Codable {
    var active: Bool = false
    var plan: PlanId = .base
    var cycle: BillingCycle = .yearly
    var trial: Bool = false
    var startedAt: Date? = nil
    var expiresAt: Date? = nil
}

// MARK: - Profile

struct Profile: Codable {
    var name: String = ""
    var goal: PrimaryGoal? = nil
    var experience: ExperienceLevel? = nil
    var time: TimeCommitment? = nil
    var priority: Priority? = nil
    var obstacle: Obstacle? = nil
    var age: Int? = nil
    var confidence: Int? = nil

    var subscription = Subscription()
    var business: BusinessIdea? = nil
    var businessTaskPool: [TaskSeed] = []

    var hapticsEnabled: Bool = true
    var equippedEffect: String = "none"
    var unlockedEffects: [String] = ["none"]

    var firstTourSeen: Bool = false
    var earlyBirdAchieved: Bool = false
    var fullDayAchieved: Bool = false
    var accountStartedAt: Date? = nil

    /// Highest "What's New" build the user has already seen.
    var lastSeenBuild: Int = 0

    var customBuildMonth: String? = nil
    var customBuildCount: Int = 0
    var businessSwitchMonth: String? = nil
    var businessSwitchCount: Int = 0
}

// MARK: - App state

struct AppState: Codable {
    var onboarded: Bool = false
    var profile = Profile()
    var tasks: [DriveTask] = []
    var points: Int = 0
    var streak: Int = 0
    var bestStreak: Int = 0
    var lastActiveDate: String? = nil
    var history: [String: DayStat] = [:]
    var unlockedBadges: [String] = []
    var unlockedAchievements: [String] = []

    // Monthly badge-blitz event (15 badges in a month → 1 free month).
    var badgeMonthKey: String? = nil      // "yyyy-MM" the count belongs to
    var monthlyBadgeCount: Int = 0
    var freeMonthGrantedMonth: String? = nil
}

struct DayStat: Codable {
    var completed: Int = 0
    var skipped: Int = 0
}
