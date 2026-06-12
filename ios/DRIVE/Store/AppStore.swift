//
//  AppStore.swift
//  DRIVE
//
//  Central observable app state with local persistence (UserDefaults),
//  daily task rollover, streak logic, and badge/achievement evaluation.
//

import SwiftUI
import Observation

@MainActor
@Observable
final class AppStore {
    private(set) var state = AppState()
    var hydrated = false

    /// Badge ids freshly unlocked and waiting to be surfaced as a toast.
    var pendingBadge: Badge? = nil

    private let storageKey = "drive.state.v1"

    init() {
        load()
    }

    // MARK: - Persistence

    private func load() {
        defer { hydrated = true }
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return }
        do {
            state = try JSONDecoder().decode(AppState.self, from: data)
            rolloverTasks()
        } catch {
            print("[AppStore] load failed: \(error)")
        }
    }

    private func persist() {
        do {
            let data = try JSONEncoder().encode(state)
            UserDefaults.standard.set(data, forKey: storageKey)
        } catch {
            print("[AppStore] persist failed: \(error)")
        }
    }

    private func commit() {
        persist()
    }

    // MARK: - Date helpers

    static func todayKey(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    static func daysBetween(_ a: String, _ b: String) -> Int {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let da = f.date(from: a), let db = f.date(from: b) else { return 0 }
        return Calendar.current.dateComponents([.day], from: da, to: db).day ?? 0
    }

    // MARK: - Derived values

    var plan: Plan { Plans.plan(state.profile.subscription.plan) }
    var isPremium: Bool {
        state.profile.subscription.plan == .premium && state.profile.subscription.active
    }
    var hasActiveSubscription: Bool { state.profile.subscription.active }

    var todayTasks: [DriveTask] {
        let key = Self.todayKey()
        return state.tasks.filter { $0.dateKey == key }
    }

    var todayCompleted: Int { todayTasks.filter { $0.status == .completed }.count }
    var todayTotal: Int { todayTasks.count }

    var totalCompleted: Int {
        state.history.values.reduce(0) { $0 + $1.completed } +
            state.tasks.filter { $0.status == .completed }.count
    }

    var totalSkipped: Int {
        state.history.values.reduce(0) { $0 + $1.skipped } +
            state.tasks.filter { $0.status == .skipped }.count
    }

    var level: Int { max(1, state.points / 500 + 1) }

    var tier: StreakTier { StreakTiers.tier(for: state.streak) }

    /// Last 7 days of completed-task counts (oldest → today).
    var weeklyActivity: [(key: String, label: String, completed: Int)] {
        let cal = Calendar.current
        let labels = ["S", "M", "T", "W", "T", "F", "S"]
        var result: [(String, String, Int)] = []
        for offset in stride(from: 6, through: 0, by: -1) {
            guard let date = cal.date(byAdding: .day, value: -offset, to: Date()) else { continue }
            let key = Self.todayKey(date)
            let weekday = cal.component(.weekday, from: date) - 1
            let todayCount = state.tasks.filter { $0.dateKey == key && $0.status == .completed }.count
            let histCount = state.history[key]?.completed ?? 0
            result.append((key, labels[weekday], max(todayCount, histCount)))
        }
        return result
    }

    // MARK: - Task rollover (new day → fresh tasks, archive old)

    func rolloverTasks() {
        guard let goal = state.profile.goal, state.onboarded else { return }
        let key = Self.todayKey()
        if state.tasks.contains(where: { $0.dateKey == key }) { return }

        // Break streak if a day was skipped entirely.
        if let last = state.lastActiveDate, Self.daysBetween(last, key) > 1 {
            state.streak = 0
        }

        // Archive previous days into history.
        let old = state.tasks.filter { $0.dateKey != key }
        for t in old {
            var stat = state.history[t.dateKey] ?? DayStat()
            if t.status == .completed { stat.completed += 1 }
            else if t.status == .skipped { stat.skipped += 1 }
            state.history[t.dateKey] = stat
        }

        state.tasks = TaskPool.generateDailyTasks(
            goal: goal,
            limit: plan.taskLimit,
            dateKey: key,
            businessPool: state.profile.businessTaskPool
        )
        commit()
    }

    // MARK: - Onboarding

    func setProfile(_ transform: (inout Profile) -> Void) {
        transform(&state.profile)
        commit()
    }

    func completeOnboarding() {
        guard let goal = state.profile.goal else { return }
        let key = Self.todayKey()
        state.onboarded = true
        if state.profile.accountStartedAt == nil {
            state.profile.accountStartedAt = Date()
        }
        state.tasks = TaskPool.generateDailyTasks(
            goal: goal,
            limit: plan.taskLimit,
            dateKey: key,
            businessPool: state.profile.businessTaskPool
        )
        state.lastActiveDate = key
        commit()
    }

    // MARK: - Tasks

    func completeTask(_ id: String) {
        guard let idx = state.tasks.firstIndex(where: { $0.id == id }),
              state.tasks[idx].status == .pending else { return }
        let task = state.tasks[idx]
        let key = Self.todayKey()
        let completedTodayBefore = state.tasks.filter { $0.status == .completed && $0.dateKey == key }.count

        state.tasks[idx].status = .completed
        state.points += task.basePoints * plan.multiplier

        if completedTodayBefore == 0 {
            if let last = state.lastActiveDate, Self.daysBetween(last, key) == 1 {
                state.streak += 1
            } else if state.lastActiveDate == key {
                state.streak = max(1, state.streak)
            } else {
                state.streak = 1
            }
            state.bestStreak = max(state.bestStreak, state.streak)
        }
        state.lastActiveDate = key

        // Behavior flags
        let hour = Calendar.current.component(.hour, from: Date())
        if !state.profile.earlyBirdAchieved && hour < 12 {
            state.profile.earlyBirdAchieved = true
        }
        let total = state.tasks.filter { $0.dateKey == key }.count
        let done = state.tasks.filter { $0.dateKey == key && $0.status == .completed }.count
        if !state.profile.fullDayAchieved && total > 0 && done == total {
            state.profile.fullDayAchieved = true
        }

        evaluateBadges()
        if state.profile.hapticsEnabled { Haptics.impact(.medium) }
        commit()
    }

    func skipTask(_ id: String) {
        guard let idx = state.tasks.firstIndex(where: { $0.id == id }),
              state.tasks[idx].status == .pending else { return }
        state.tasks[idx].status = .skipped
        if state.profile.hapticsEnabled { Haptics.impact(.light) }
        commit()
    }

    func undoTask(_ id: String) {
        guard let idx = state.tasks.firstIndex(where: { $0.id == id }) else { return }
        let task = state.tasks[idx]
        if task.status == .completed {
            state.points = max(0, state.points - task.basePoints * plan.multiplier)
        }
        state.tasks[idx].status = .pending
        commit()
    }

    // MARK: - Subscription

    func startSubscription(plan: PlanId, cycle: BillingCycle) {
        var sub = Subscription()
        sub.active = true
        sub.plan = plan
        sub.cycle = cycle
        sub.trial = true
        sub.startedAt = Date()
        sub.expiresAt = Calendar.current.date(byAdding: cycle == .yearly ? .year : .month, value: 1, to: Date())
        state.profile.subscription = sub
        evaluateBadges()
        commit()
    }

    func cancelSubscription() {
        state.profile.subscription.active = false
        state.profile.subscription.trial = false
        commit()
    }

    // MARK: - Business

    @discardableResult
    func setBusiness(_ business: BusinessIdea, taskPool: [TaskSeed]) -> Bool {
        let key = Self.todayKey()
        state.profile.business = business
        state.profile.businessTaskPool = taskPool
        if let goal = state.profile.goal {
            state.tasks = TaskPool.generateDailyTasks(goal: goal, limit: plan.taskLimit, dateKey: key, businessPool: taskPool)
            state.lastActiveDate = key
        }
        evaluateBadges()
        commit()
        return true
    }

    // MARK: - Reset

    func resetEverything() {
        state = AppState()
        commit()
    }

    // MARK: - Badges / Achievements

    func isBadgeUnlocked(_ id: String) -> Bool {
        state.unlockedBadges.contains(id)
    }

    private func evaluateBadges() {
        let completed = totalCompleted
        let businessesTried = (state.profile.business != nil ? 1 : 0)
        let daysActive = Set(state.history.keys).union(
            state.tasks.contains { $0.dateKey == Self.todayKey() && $0.status != .pending } ? [Self.todayKey()] : []
        ).count
        var unlocked = Set(state.unlockedBadges)

        for b in Badges.all where !unlocked.contains(b.id) {
            let value: Int
            switch b.metric {
            case .completed: value = completed
            case .streak: value = state.streak
            case .points: value = state.points
            case .businessesTried: value = businessesTried
            case .daysActive: value = daysActive
            case .earlyBird: value = state.profile.earlyBirdAchieved ? 1 : 0
            case .fullDay: value = state.profile.fullDayAchieved ? 1 : 0
            case .premium: value = isPremium ? 1 : 0
            }
            if value >= b.threshold {
                unlocked.insert(b.id)
                if b.important && pendingBadge == nil {
                    pendingBadge = b
                }
            }
        }
        state.unlockedBadges = Array(unlocked)
    }
}

// MARK: - Haptics helper

import UIKit

enum Haptics {
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let gen = UIImpactFeedbackGenerator(style: style)
        gen.impactOccurred()
    }
    static func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
