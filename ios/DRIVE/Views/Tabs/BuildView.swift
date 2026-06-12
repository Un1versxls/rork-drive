//
//  BuildView.swift
//  DRIVE
//
//  Premium-only "build your own business" generator. Locked behind a
//  paywall preview for non-premium users.
//

import SwiftUI

struct BuildView: View {
    @Environment(AppStore.self) private var store
    @State private var idea = ""
    @State private var generating = false
    @State private var showPaywall = false
    @State private var doneMessage = false
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            if store.isPremium {
                builder
            } else {
                locked
            }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallView(fromUpgrade: true) { showPaywall = false }
                .environment(store)
        }
        .alert("Your custom business is live", isPresented: $doneMessage) {
            Button("OK") {}
        } message: {
            Text("Check the Tasks tab — your new daily plan is ready.")
        }
    }

    // MARK: - Premium builder

    private var builder: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Build your own")
                    .font(.system(size: 30, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text("Tell us what you want to build. We'll handle the daily tasks.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
                    .lineSpacing(2)

                ZStack(alignment: .topLeading) {
                    if idea.isEmpty {
                        Text("e.g. I want to build an app that helps Gen Z budget money")
                            .font(.system(size: 16))
                            .foregroundStyle(DriveColor.textMuted)
                            .padding(18)
                    }
                    TextEditor(text: $idea)
                        .font(.system(size: 16))
                        .foregroundStyle(DriveColor.text)
                        .scrollContentBackground(.hidden)
                        .focused($focused)
                        .frame(minHeight: 150)
                        .padding(10)
                }
                .background(DriveColor.bgSoft)
                .clipShape(.rect(cornerRadius: 16))
                .overlay { RoundedRectangle(cornerRadius: 16).stroke(DriveColor.border, lineWidth: 1) }

                if let biz = store.state.profile.business, biz.id.hasPrefix("custom-") {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("CURRENT CUSTOM BUSINESS")
                            .font(.system(size: 10, weight: .black)).tracking(1.2).foregroundStyle(DriveColor.gold)
                        Text(biz.name).font(.system(size: 16, weight: .black)).foregroundStyle(DriveColor.text)
                        Text(biz.tagline).font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .driveCard(fill: DriveColor.bgSoft)
                }

                GradientButton(title: generating ? "Generating your plan…" : "Generate my plan",
                               variant: .gold,
                               disabled: idea.trimmingCharacters(in: .whitespaces).isEmpty,
                               loading: generating) {
                    generatePlan()
                }
                Text("This replaces your current business. Your streak is kept.")
                    .font(.system(size: 12))
                    .foregroundStyle(DriveColor.textMuted)
                    .frame(maxWidth: .infinity)
            }
            .padding(20)
            .padding(.bottom, 120)
        }
        .onTapGesture { focused = false }
    }

    private func generatePlan() {
        focused = false
        generating = true
        // Build a structured local plan from the user's idea (no network).
        let trimmed = idea.trimmingCharacters(in: .whitespacesAndNewlines)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
            let name = customName(from: trimmed)
            let business = BusinessIdea(
                id: "custom-\(Int(Date().timeIntervalSince1970))",
                name: name,
                tagline: "Your custom build",
                description: trimmed,
                whyFit: "You picked this yourself — that's the strongest motivation there is.",
                startupCost: "$0 – $300",
                timeToIncome: "2 – 6 weeks",
                firstMilestones: ["Define your first offer", "Tell 10 people", "Get first feedback", "Make first sale"]
            )
            let pool: [TaskSeed] = [
                TaskSeed(title: "Define today's one move", description: "Write the single most important step for \(name) today.", category: .focus, difficulty: 2),
                TaskSeed(title: "Tell someone about it", description: "Share \(name) with one person and ask what they think.", category: .growth, difficulty: 1),
                TaskSeed(title: "Ship something visible", description: "Make one concrete piece of progress others can see.", category: .hustle, difficulty: 3),
                TaskSeed(title: "Talk to a potential user", description: "Ask what problem \(name) should solve for them.", category: .growth, difficulty: 2),
                TaskSeed(title: "Review and reflect", description: "What worked today? What to change tomorrow?", category: .mindset, difficulty: 1),
                TaskSeed(title: "Sharpen your offer", description: "Tighten the pitch for \(name) in one sentence.", category: .skill, difficulty: 2),
            ]
            store.setBusiness(business, taskPool: pool)
            generating = false
            idea = ""
            doneMessage = true
        }
    }

    private func customName(from idea: String) -> String {
        let words = idea.split(separator: " ").prefix(3).map { $0.capitalized }
        return words.isEmpty ? "My Build" : words.joined(separator: " ")
    }

    // MARK: - Locked preview

    private var locked: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 14) {
                    Image(systemName: "crown.fill")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 48, height: 48)
                        .background(DriveColor.gold)
                        .clipShape(.rect(cornerRadius: 14))
                    Text("Build your own business.")
                        .font(.system(size: 27, weight: .black))
                        .foregroundStyle(DriveColor.text)
                        .tracking(-0.5)
                    Text("Type your idea. DRIVE generates a custom daily task plan that actually moves it forward.")
                        .font(.system(size: 15))
                        .foregroundStyle(DriveColor.textDim)
                        .lineSpacing(3)

                    HStack(spacing: 8) {
                        Image(systemName: "lock.fill").font(.system(size: 14)).foregroundStyle(DriveColor.textMuted)
                        Text("Locked — upgrade to Premium")
                            .font(.system(size: 13, weight: .bold)).foregroundStyle(DriveColor.textMuted)
                    }
                    .padding(.horizontal, 14).padding(.vertical, 12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(DriveColor.bg).clipShape(.rect(cornerRadius: 12))
                    .overlay { RoundedRectangle(cornerRadius: 12).stroke(DriveColor.border, lineWidth: 1) }

                    VStack(alignment: .leading, spacing: 10) {
                        bullet("Turn ANY idea into a roadmap")
                        bullet("Daily tasks that fit your life")
                        bullet("Included with Premium")
                    }
                    .padding(.vertical, 4)

                    GradientButton(title: "Upgrade to Premium", variant: .gold) { showPaywall = true }
                }
                .padding(24)
                .driveCard(fill: DriveColor.bgSoft, padding: 24)
            }
            .padding(20)
            .padding(.bottom, 120)
        }
    }

    private func bullet(_ text: String) -> some View {
        HStack(spacing: 10) {
            Circle().fill(DriveColor.gold).frame(width: 6, height: 6)
            Text(text).font(.system(size: 14, weight: .semibold)).foregroundStyle(DriveColor.text)
        }
    }
}
