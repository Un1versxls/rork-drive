//
//  TaskPool.swift
//  DRIVE
//
//  Deterministic daily task generation mirroring the RN app.
//

import Foundation

enum TaskPool {
    static let earn: [TaskSeed] = [
        TaskSeed(title: "Pitch one new client", description: "Send a personalized outreach message to a potential client.", category: .hustle, difficulty: 2),
        TaskSeed(title: "Post a value piece", description: "Share a tip or insight publicly to grow your audience.", category: .growth, difficulty: 1),
        TaskSeed(title: "Review your offers", description: "Audit pricing, copy or positioning for 15 minutes.", category: .hustle, difficulty: 2),
        TaskSeed(title: "Follow up with 3 leads", description: "Send a short, warm follow-up to recent conversations.", category: .hustle, difficulty: 1),
        TaskSeed(title: "Ship one small improvement", description: "Make a visible change to your product or service.", category: .focus, difficulty: 3),
    ]

    static let skills: [TaskSeed] = [
        TaskSeed(title: "Deep work block", description: "25 minutes, one tab, no phone.", category: .focus, difficulty: 2),
        TaskSeed(title: "Learn something new", description: "Watch a lesson or read a chapter — then write one takeaway.", category: .skill, difficulty: 1),
        TaskSeed(title: "Practice deliberately", description: "Work on the one thing you're weakest at.", category: .skill, difficulty: 3),
        TaskSeed(title: "Teach it back", description: "Explain today's lesson out loud or in writing.", category: .skill, difficulty: 2),
        TaskSeed(title: "Review yesterday's notes", description: "Spaced repetition beats cramming.", category: .mindset, difficulty: 1),
    ]

    static let business: [TaskSeed] = [
        TaskSeed(title: "Talk to one customer", description: "Ask what they love and what's missing.", category: .growth, difficulty: 2),
        TaskSeed(title: "Review your numbers", description: "Check revenue, churn, or pipeline for 10 minutes.", category: .hustle, difficulty: 2),
        TaskSeed(title: "Cut one distraction", description: "Remove a meeting, tool, or task that isn't moving things.", category: .focus, difficulty: 1),
        TaskSeed(title: "Draft one campaign idea", description: "Sketch a promo, launch, or partnership.", category: .growth, difficulty: 2),
        TaskSeed(title: "Recognize a teammate", description: "A 30 second message can change someone's week.", category: .mindset, difficulty: 1),
    ]

    static let productive: [TaskSeed] = [
        TaskSeed(title: "Plan your top 3", description: "Write down the three things that would make today a win.", category: .focus, difficulty: 1),
        TaskSeed(title: "Move your body", description: "Walk, stretch or train for at least 10 minutes.", category: .health, difficulty: 1),
        TaskSeed(title: "Inbox zero sprint", description: "15 minutes clearing inbox or notifications.", category: .focus, difficulty: 2),
        TaskSeed(title: "Mindful reset", description: "Five slow breaths or a short meditation.", category: .mindset, difficulty: 1),
        TaskSeed(title: "Evening review", description: "Reflect: what worked, what to change tomorrow.", category: .mindset, difficulty: 2),
    ]

    static let dayTrading: [TaskSeed] = [
        TaskSeed(title: "Paper trade 30 minutes", description: "Practice your strategy on a simulator — no real money risk.", category: .skill, difficulty: 2),
        TaskSeed(title: "Journal yesterday's trade", description: "Note the setup, entry, exit, and what you'd do differently.", category: .mindset, difficulty: 1),
        TaskSeed(title: "Watch one market open", description: "Observe the first 30 minutes — the most volatile window of the day.", category: .focus, difficulty: 1),
        TaskSeed(title: "Study one chart pattern", description: "Pick a pattern (flag, double-top, breakout) and find 3 examples.", category: .skill, difficulty: 2),
        TaskSeed(title: "Review your risk rules", description: "Read your risk-management rules out loud before market open.", category: .mindset, difficulty: 1),
        TaskSeed(title: "Set a daily loss limit", description: "Decide the max you'll lose today — stop trading when you hit it.", category: .focus, difficulty: 1),
        TaskSeed(title: "Backtest one strategy", description: "Test your edge on 20 historical setups before risking capital.", category: .skill, difficulty: 3),
        TaskSeed(title: "Track your stats", description: "Log win rate, average win, average loss for this week.", category: .hustle, difficulty: 2),
        TaskSeed(title: "Read trading psychology", description: "Trading is 80% mental — work the muscle for 10 minutes.", category: .skill, difficulty: 1),
    ]

    static func pool(for goal: PrimaryGoal) -> [TaskSeed] {
        switch goal {
        case .earnIncome: return earn
        case .buildSkills: return skills
        case .growBusiness: return business
        case .stayProductive: return productive
        case .dayTrading: return dayTrading
        }
    }

    static func seedOffset(_ dateKey: String) -> Int {
        var h: UInt32 = 0
        for scalar in dateKey.unicodeScalars {
            h = (h &* 31 &+ scalar.value)
        }
        return Int(h % 7)
    }

    static func generateDailyTasks(goal: PrimaryGoal, limit: Int, dateKey: String, businessPool: [TaskSeed]) -> [DriveTask] {
        let primary = pool(for: goal)
        let all = businessPool + primary + productive
        guard !all.isEmpty else { return [] }
        var picked: [TaskSeed] = []
        var used = Set<String>()
        let offset = seedOffset(dateKey)
        var i = 0
        let target = min(limit, all.count)
        while picked.count < target && i < all.count * 3 {
            let seed = all[(i + offset) % all.count]
            if !used.contains(seed.title) {
                used.insert(seed.title)
                picked.append(seed)
            }
            i += 1
        }
        return picked.enumerated().map { idx, seed in
            DriveTask(
                id: "\(dateKey)-\(idx)",
                title: seed.title,
                description: seed.description,
                category: seed.category,
                difficulty: seed.difficulty,
                basePoints: seed.difficulty * 15,
                status: .pending,
                dateKey: dateKey
            )
        }
    }
}
