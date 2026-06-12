//
//  Plans.swift
//  DRIVE
//

import Foundation

struct Plan: Identifiable {
    let id: PlanId
    let name: String
    let monthlyPrice: Double
    let yearlyPrice: Double
    let tagline: String
    let incomeRange: String
    let taskLimit: Int
    let multiplier: Int
    let recommended: Bool
    let perks: [String]
}

enum Plans {
    static let all: [Plan] = [
        Plan(
            id: .base,
            name: "Base",
            monthlyPrice: 3.99,
            yearlyPrice: 49.99,
            tagline: "Start your side hustle",
            incomeRange: "$50 – $1,500 / month",
            taskLimit: 6,
            multiplier: 2,
            recommended: false,
            perks: [
                "Hand-picked businesses ($50 – $1,500 range)",
                "Personalized daily tasks",
                "Streak tracking + rewards",
                "3-day free trial",
            ]
        ),
        Plan(
            id: .premium,
            name: "Premium",
            monthlyPrice: 5.99,
            yearlyPrice: 69.99,
            tagline: "For people actually trying to make real money",
            incomeRange: "$1,500 – $10,000 / month",
            taskLimit: 10,
            multiplier: 3,
            recommended: true,
            perks: [
                "High-ticket businesses ($1,500 – $10,000 range)",
                "Build your OWN custom business",
                "Priority matching + premium-only ideas",
                "Everything in Base",
                "3-day free trial",
            ]
        ),
    ]

    static func plan(_ id: PlanId) -> Plan {
        all.first { $0.id == id } ?? all[0]
    }

    static func monthlyEquivalent(_ plan: Plan, cycle: BillingCycle) -> Double {
        cycle == .monthly ? plan.monthlyPrice : (plan.yearlyPrice / 12 * 100).rounded() / 100
    }

    static func yearlySavings(_ plan: Plan) -> Double {
        max(0, ((plan.monthlyPrice * 12 - plan.yearlyPrice) * 100).rounded() / 100)
    }
}
