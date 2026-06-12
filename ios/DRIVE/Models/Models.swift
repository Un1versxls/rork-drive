//
//  Models.swift
//  DRIVE
//
//  Core data models for the DRIVE experience.
//

import Foundation

// MARK: - Onboarding answer enums

/// The two top-level routes a user picks at the start of onboarding.
enum BusinessPath: String, Codable, CaseIterable, Identifiable {
    case onlineAI = "online_ai"
    case hustle = "in_person"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .onlineAI: return "Online AI business"
        case .hustle: return "In-person hustle"
        }
    }

    var subtitle: String {
        switch self {
        case .onlineAI: return "Build income from your laptop or phone"
        case .hustle: return "Make money with your hands, locally"
        }
    }

    var emoji: String {
        switch self {
        case .onlineAI: return "🤖"
        case .hustle: return "🛠️"
        }
    }
}

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

    /// Path-specific, relatable framing for the experience scale.
    func title(for path: BusinessPath) -> String {
        switch (path, self) {
        case (.onlineAI, .beginner): return "Total beginner"
        case (.onlineAI, .intermediate): return "Dabbled a bit"
        case (.onlineAI, .advanced): return "Made some money online"
        case (.onlineAI, .expert): return "Built businesses myself"
        case (.hustle, .beginner): return "Just chores so far"
        case (.hustle, .intermediate): return "Odd jobs for cash"
        case (.hustle, .advanced): return "Run a side gig already"
        case (.hustle, .expert): return "Run my own operation"
        }
    }

    func subtitle(for path: BusinessPath) -> String {
        switch (path, self) {
        case (.onlineAI, .beginner): return "I mostly use ChatGPT for homework"
        case (.onlineAI, .intermediate): return "I've tried a few tools and ideas"
        case (.onlineAI, .advanced): return "I've earned a bit with online stuff"
        case (.onlineAI, .expert): return "I've built one or more online businesses"
        case (.hustle, .beginner): return "I help around the house for money"
        case (.hustle, .intermediate): return "I've done yardwork, babysitting, etc."
        case (.hustle, .advanced): return "I already make money on the side"
        case (.hustle, .expert): return "e.g. my own pressure-washing company"
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
    /// Premium-only ideas require an active Premium plan to start.
    var premium: Bool
    /// Which onboarding route this idea belongs to.
    var path: BusinessPath?

    init(
        id: String,
        name: String,
        tagline: String,
        description: String,
        whyFit: String,
        startupCost: String,
        timeToIncome: String,
        firstMilestones: [String],
        premium: Bool = false,
        path: BusinessPath? = nil
    ) {
        self.id = id
        self.name = name
        self.tagline = tagline
        self.description = description
        self.whyFit = whyFit
        self.startupCost = startupCost
        self.timeToIncome = timeToIncome
        self.firstMilestones = firstMilestones
        self.premium = premium
        self.path = path
    }

    // Lenient decoding so business records persisted before these fields
    // existed still load cleanly from local storage / the cloud blob.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        tagline = try c.decode(String.self, forKey: .tagline)
        description = try c.decode(String.self, forKey: .description)
        whyFit = try c.decode(String.self, forKey: .whyFit)
        startupCost = try c.decode(String.self, forKey: .startupCost)
        timeToIncome = try c.decode(String.self, forKey: .timeToIncome)
        firstMilestones = try c.decode([String].self, forKey: .firstMilestones)
        premium = ((try? c.decodeIfPresent(Bool.self, forKey: .premium)) ?? nil) ?? false
        path = ((try? c.decodeIfPresent(BusinessPath.self, forKey: .path)) ?? nil)
    }
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
    var email: String? = nil
    var goal: PrimaryGoal? = nil
    var path: BusinessPath? = nil
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

    /// Set once the user has claimed their business with a verified email.
    var claimedAt: Date? = nil
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
