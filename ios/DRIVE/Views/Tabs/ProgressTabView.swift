//
//  ProgressTabView.swift
//  DRIVE
//
//  Streak hero, motivation insight, weekly chart, roadmap, advanced stats.
//

import SwiftUI

struct ProgressTabView: View {
    @Environment(AppStore.self) private var store
    @State private var showAdvanced = false
    @State private var factIndex = 0
    @State private var roadmapSelected: Int?

    private var maxWeek: Int { max(1, store.weeklyActivity.map { $0.completed }.max() ?? 1) }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Progress")
                        .font(.system(size: 32, weight: .black))
                        .foregroundStyle(DriveColor.text)
                        .tracking(-0.5)
                    Text("Small wins. Every day.")
                        .font(.system(size: 14))
                        .foregroundStyle(DriveColor.textDim)
                        .padding(.top, 4)

                    streakHero.padding(.top, 18)
                    insightCard.padding(.top, 4)
                    weekChart.padding(.top, 22)
                    roadmapCard.padding(.top, 22)
                    advancedToggle.padding(.top, 8)
                    if showAdvanced { advancedStats.padding(.top, 8) }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 140)
            }
        }
    }

    private var streakHero: some View {
        VStack(spacing: 6) {
            StreakFlameButton(streak: store.state.streak, size: 160, hapticsEnabled: store.state.profile.hapticsEnabled)
            HStack(spacing: 6) {
                Image(systemName: "flame.fill").font(.system(size: 16)).foregroundStyle(store.tier.primary)
                Text(store.tier.label.uppercased())
                    .font(.system(size: 12, weight: .black)).tracking(2)
                    .foregroundStyle(store.tier.primary)
            }
            .padding(.top, 6)
            (Text("\(store.state.streak)").font(.system(size: 48, weight: .black))
                + Text(" days").font(.system(size: 18, weight: .bold)).foregroundColor(DriveColor.textDim))
                .foregroundStyle(DriveColor.text)
            Text(store.tier.description)
                .font(.system(size: 11, weight: .heavy)).tracking(1)
                .foregroundStyle(DriveColor.textMuted)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
    }

    private var insightCard: some View {
        let fact = motivationFacts[factIndex % motivationFacts.count]
        return Button {
            Haptics.selection()
            withAnimation(.easeInOut(duration: 0.2)) { factIndex += 1 }
        } label: {
            HStack(spacing: 14) {
                Text(fact.emoji).font(.system(size: 28))
                VStack(alignment: .leading, spacing: 2) {
                    Text(fact.title).font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                        .multilineTextAlignment(.leading)
                    Text(fact.sub).font(.system(size: 12, weight: .semibold)).foregroundStyle(DriveColor.textDim)
                }
                Spacer(minLength: 0)
            }
            .padding(16)
            .frame(maxWidth: .infinity)
            .driveCard(fill: DriveColor.bgSoft)
        }
        .buttonStyle(.plain)
    }

    private var weekChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("LAST 7 DAYS").font(.system(size: 11, weight: .black)).tracking(1.2).foregroundStyle(DriveColor.textDim)
            HStack(alignment: .bottom, spacing: 0) {
                ForEach(Array(store.weeklyActivity.enumerated()), id: \.offset) { idx, day in
                    let isToday = idx == store.weeklyActivity.count - 1
                    VStack(spacing: 6) {
                        Spacer(minLength: 0)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(isToday ? DriveColor.gold : Color(hex: 0xE5E5E5))
                            .frame(width: 22, height: max(4, CGFloat(day.completed) / CGFloat(maxWeek) * 80))
                        Text(day.label)
                            .font(.system(size: 11, weight: isToday ? .black : .bold))
                            .foregroundStyle(isToday ? DriveColor.text : DriveColor.textMuted)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 100)
                }
            }
        }
    }

    private var roadmapCard: some View {
        let (milestones, finalLabel) = roadmap(for: store.state.profile.goal ?? .earnIncome, time: store.state.profile.time)
        let completionRatio = min(0.92, Double(store.totalCompleted) / 80.0)
        let nextIdx = milestones.firstIndex(where: { $0.progress > completionRatio })
        let days = daysOnAccount
        return VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: "target")
                    .font(.system(size: 16)).foregroundStyle(DriveColor.accentDeep)
                    .frame(width: 32, height: 32)
                    .background(DriveColor.accentDim).clipShape(.rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text("YOUR ROADMAP").font(.system(size: 10, weight: .black)).tracking(1.4).foregroundStyle(DriveColor.textDim)
                    Text(store.state.profile.business.map { "Building \($0.name)" } ?? "Where your daily tasks lead")
                        .font(.system(size: 15, weight: .black)).foregroundStyle(DriveColor.text)
                }
                Spacer()
            }
            RoadmapChart(milestones: milestones, finalLabel: finalLabel, youProgress: completionRatio, daysOnAccount: days, autoSelectIndex: nextIdx, selected: $roadmapSelected)
                .padding(.top, 8)
            Text(roadmapSelected != nil ? "Milestones are estimated timeframes based on consistent effort." : "Tap a milestone to see details. Timeframes are estimates.")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(DriveColor.textDim)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)
        }
    }

    private var advancedToggle: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.25)) { showAdvanced.toggle() }
        } label: {
            HStack {
                Text("Advanced stats").font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                Spacer()
                Image(systemName: "chevron.down")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(DriveColor.textDim)
                    .rotationEffect(.degrees(showAdvanced ? 180 : 0))
            }
            .padding(16)
            .driveCard()
        }
        .buttonStyle(.plain)
    }

    private var advancedStats: some View {
        let completed = store.totalCompleted
        let skipped = store.totalSkipped
        let skipRate = completed + skipped == 0 ? 0 : Int(Double(skipped) / Double(completed + skipped) * 100)
        return VStack(spacing: 0) {
            statRow("Total tasks completed", "\(completed)")
            statRow("Completion rate", "\(100 - skipRate)%")
            statRow("Avg skip rate", "\(skipRate)%")
            statRow("Best streak", "\(store.state.bestStreak) days")
            statRow("Total points", store.state.points.formatted())
            statRow("Level", "\(store.level)")
        }
        .padding(6)
        .driveCard(fill: DriveColor.bgSoft, padding: 6)
    }

    private func statRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 13, weight: .medium)).foregroundStyle(DriveColor.textDim)
            Spacer()
            Text(value).font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
        }
        .padding(.horizontal, 14).padding(.vertical, 13)
    }

    // MARK: - helpers

    private var daysOnAccount: Int {
        guard let start = store.state.profile.accountStartedAt else { return 1 }
        let days = Calendar.current.dateComponents([.day], from: Calendar.current.startOfDay(for: start), to: Calendar.current.startOfDay(for: Date())).day ?? 0
        return max(1, days + 1)
    }

    private func roadmap(for goal: PrimaryGoal, time: TimeCommitment?) -> ([RoadmapMilestone], String) {
        let m: Double = {
            switch time {
            case .h2: return 0.78
            case .h1: return 0.9
            case .m30: return 1.0
            case .m15: return 1.2
            default: return 1.0
            }
        }()
        func d(_ x: Double) -> Int { Int((x * m).rounded()) }
        switch goal {
        case .buildSkills:
            return ([
                .init(day: d(7), label: "First public win", progress: 0.10),
                .init(day: d(34), label: "Skill clicks", progress: 0.34),
                .init(day: d(120), label: "Portfolio piece", progress: 0.58),
                .init(day: d(210), label: "First paid use", progress: 0.80),
            ], "Teaching others")
        case .dayTrading:
            return ([
                .init(day: d(9), label: "Paper trading", progress: 0.10),
                .init(day: d(35), label: "First green week", progress: 0.34),
                .init(day: d(110), label: "Live strategy", progress: 0.58),
                .init(day: d(200), label: "Consistent month", progress: 0.80),
            ], "Scaling capital")
        default:
            return ([
                .init(day: d(7), label: "Foundation set", progress: 0.10),
                .init(day: d(26), label: "First client", progress: 0.34),
                .init(day: d(90), label: "First $500 month", progress: 0.58),
                .init(day: d(189), label: "Repeat customer", progress: 0.80),
            ], "$2k month")
        }
    }

    private var motivationFacts: [(emoji: String, title: String, sub: String)] {
        let streak = max(1, store.state.streak)
        let completed = store.totalCompleted
        return [
            ("🚀", "At this rate you'll have real momentum in about \(max(30, 95 - streak * 2)) days", "compounding daily wins"),
            ("💸", "You're roughly \(max(21, 120 - streak * 3)) days from your first profitable win", "keep stacking small bets"),
            ("🧠", "On track for \(max(8, completed * 8))+ deep-work hours this quarter", "that's how mastery is built"),
            ("🔥", "\(streak)-day streak energy → top 5% of builders this month", "don't break the chain"),
            ("📈", "Project \(max(50, completed * 12 + streak * 10)) finished tasks over the next year", "future you will thank you"),
            ("⚡️", "You ship more before noon than most ship in a week", "this is your unfair advantage"),
        ]
    }
}
