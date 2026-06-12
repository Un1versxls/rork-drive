//
//  Businesses.swift
//  DRIVE
//
//  Curated starter business ideas matched during onboarding.
//

import Foundation

enum Businesses {
    static func matches(for goal: PrimaryGoal, premium: Bool) -> [BusinessIdea] {
        switch goal {
        case .earnIncome, .stayProductive:
            return premium ? premiumService : starterService
        case .growBusiness:
            return premium ? premiumService : starterService
        case .buildSkills:
            return skillTracks
        case .dayTrading:
            return tradingTracks
        }
    }

    static let starterService: [BusinessIdea] = [
        BusinessIdea(id: "biz-ugc", name: "UGC Creator", tagline: "Get paid to make short brand videos", description: "Brands pay creators to film authentic phone videos of their products. No big following needed — just a phone and good lighting.", whyFit: "Low startup cost and you can land your first paid deal in weeks.", startupCost: "$0 – $100", timeToIncome: "2 – 4 weeks", firstMilestones: ["Film 3 sample videos", "Make a simple rate card", "Pitch 10 brands", "Land first paid deal"]),
        BusinessIdea(id: "biz-cleaning", name: "Local Cleaning", tagline: "Recurring income from neighborhood clients", description: "Residential cleaning is in constant demand with near-zero barrier to entry. Recurring weekly clients build predictable income fast.", whyFit: "Cash flow starts almost immediately and clients rebook.", startupCost: "$50 – $200", timeToIncome: "1 – 2 weeks", firstMilestones: ["Buy basic supplies", "Post in 3 local groups", "Book first 2 clients", "Set a weekly schedule"]),
        BusinessIdea(id: "biz-resell", name: "Flip & Resell", tagline: "Buy low, sell high online", description: "Source undervalued items from thrift stores and marketplaces, then resell them online for a margin. A real skill you compound over time.", whyFit: "You learn pricing and sales with tiny risk per flip.", startupCost: "$100 – $300", timeToIncome: "1 – 3 weeks", firstMilestones: ["Pick a niche", "Source 5 items", "List with great photos", "Make first profitable sale"]),
    ]

    static let premiumService: [BusinessIdea] = [
        BusinessIdea(id: "biz-agency", name: "Lead-Gen Agency", tagline: "Book meetings for B2B clients", description: "Run cold outreach that fills your clients' calendars with qualified meetings. High-ticket retainers once you prove results.", whyFit: "Premium clients pay $1.5k–$5k/mo retainers for results.", startupCost: "$100 – $500", timeToIncome: "3 – 6 weeks", firstMilestones: ["Pick a niche", "Build an outreach list", "Send 100 cold emails", "Close first retainer"]),
        BusinessIdea(id: "biz-saas", name: "Micro-SaaS Tool", tagline: "Build a small tool people pay for monthly", description: "Solve one narrow problem with a simple subscription tool. Recurring revenue that compounds with every new user.", whyFit: "High margins and recurring income that scales.", startupCost: "$200 – $800", timeToIncome: "6 – 12 weeks", firstMilestones: ["Validate the problem", "Build an MVP", "Get 10 beta users", "Charge your first $99/mo"]),
        BusinessIdea(id: "biz-consult", name: "Niche Consulting", tagline: "Package your expertise into offers", description: "Turn what you already know into a premium advisory offer. Few clients, high value, low overhead.", whyFit: "Leverage existing skills for $2k+ engagements.", startupCost: "$0 – $300", timeToIncome: "2 – 5 weeks", firstMilestones: ["Define your offer", "Set premium pricing", "Reach 20 prospects", "Land first $2k client"]),
    ]

    static let skillTracks: [BusinessIdea] = [
        BusinessIdea(id: "skill-code", name: "Learn to Code", tagline: "From zero to your first project", description: "A daily practice plan that takes you from basics to a real, shippable project. Consistency over cramming.", whyFit: "Daily reps are how coding actually clicks.", startupCost: "$0", timeToIncome: "—", firstMilestones: ["Set up your tools", "Finish basics", "Build a tiny project", "Ship it publicly"]),
        BusinessIdea(id: "skill-design", name: "Master Design", tagline: "Build an eye for great work", description: "Train your design taste and tools with focused daily practice and copywork from the best.", whyFit: "Design is a muscle — daily reps build it.", startupCost: "$0", timeToIncome: "—", firstMilestones: ["Pick a tool", "Recreate 3 designs", "Start a portfolio", "Share your work"]),
    ]

    static let tradingTracks: [BusinessIdea] = [
        BusinessIdea(id: "trade-foundations", name: "Trading Foundations", tagline: "Build a disciplined edge — risk first", description: "A structured plan that drills risk management, journaling, and paper trading before you ever risk real capital.", whyFit: "Discipline and reps beat luck. This protects you while you learn.", startupCost: "$0", timeToIncome: "—", firstMilestones: ["Open a paper account", "Define risk rules", "Journal 10 trades", "Backtest a strategy"]),
    ]
}
