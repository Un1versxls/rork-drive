//
//  OnboardingView.swift
//  DRIVE
//
//  Multi-step onboarding questionnaire that builds the user's profile,
//  matches a business, and leads into the paywall.
//

import SwiftUI

struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @State private var step: Int = 0
    @State private var showPaywall = false

    // local picks
    @State private var goal: PrimaryGoal?
    @State private var experience: ExperienceLevel?
    @State private var time: TimeCommitment?
    @State private var priority: Priority?
    @State private var obstacle: Obstacle?
    @State private var name: String = ""
    @State private var pickedBusiness: BusinessIdea?

    private let totalSteps = 8

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                if step > 0 && step <= totalSteps {
                    OnboardingHeader(step: step, total: totalSteps) { back() }
                }
                content
            }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallView(fromUpgrade: false) {
                showPaywall = false
                store.completeOnboarding()
            }
            .environment(store)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch step {
        case 0:
            WelcomeStep { advance() }
        case 1:
            QuestionStep(title: "What's your main goal?", subtitle: "We'll tailor your daily plan to this.") {
                VStack(spacing: 12) {
                    ForEach(PrimaryGoal.allCases) { g in
                        OptionCard(title: g.title, subtitle: g.subtitle, emoji: g.emoji, selected: goal == g) {
                            goal = g; advanceSoon()
                        }
                    }
                }
            }
        case 2:
            QuestionStep(title: "How experienced are you?", subtitle: "Be honest — we meet you where you are.") {
                VStack(spacing: 12) {
                    ForEach(ExperienceLevel.allCases) { e in
                        OptionCard(title: e.title, subtitle: e.subtitle, selected: experience == e) {
                            experience = e; advanceSoon()
                        }
                    }
                }
            }
        case 3:
            QuestionStep(title: "How much time can you give?", subtitle: "Every day counts — even 15 minutes.") {
                VStack(spacing: 12) {
                    ForEach(TimeCommitment.allCases) { t in
                        OptionCard(title: t.title, subtitle: t.subtitle, selected: time == t) {
                            time = t; advanceSoon()
                        }
                    }
                }
            }
        case 4:
            QuestionStep(title: "What matters most to you?", subtitle: nil) {
                VStack(spacing: 12) {
                    ForEach(Priority.allCases) { p in
                        OptionCard(title: p.title, subtitle: p.subtitle, selected: priority == p) {
                            priority = p; advanceSoon()
                        }
                    }
                }
            }
        case 5:
            QuestionStep(title: "What's held you back?", subtitle: "Knowing this helps us keep you moving.") {
                VStack(spacing: 12) {
                    ForEach(Obstacle.allCases) { o in
                        OptionCard(title: o.title, selected: obstacle == o) {
                            obstacle = o; advanceSoon()
                        }
                    }
                }
            }
        case 6:
            NameStep(name: $name) { advance() }
        case 7:
            MatchStep(goal: goal ?? .earnIncome, picked: $pickedBusiness) { advance() }
        default:
            EmptyView()
        }
    }

    // MARK: - Navigation

    private func advance() {
        commitPartial()
        if step >= totalSteps - 1 {
            // Last questionnaire step done → paywall.
            commitPartial()
            showPaywall = true
            return
        }
        withAnimation(.easeInOut(duration: 0.25)) { step += 1 }
    }

    private func advanceSoon() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { advance() }
    }

    private func back() {
        withAnimation(.easeInOut(duration: 0.2)) { step = max(0, step - 1) }
    }

    private func commitPartial() {
        store.setProfile { p in
            if let goal { p.goal = goal }
            if let experience { p.experience = experience }
            if let time { p.time = time }
            if let priority { p.priority = priority }
            if let obstacle { p.obstacle = obstacle }
            if !name.trimmingCharacters(in: .whitespaces).isEmpty {
                p.name = name.trimmingCharacters(in: .whitespaces)
            }
            if let pickedBusiness {
                p.business = pickedBusiness
            }
        }
    }
}

// MARK: - Header

private struct OnboardingHeader: View {
    let step: Int
    let total: Int
    let onBack: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(DriveColor.text)
                    .frame(width: 40, height: 40)
                    .background(DriveColor.bgSoft)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(DriveColor.border).frame(height: 6)
                    Capsule().fill(DriveColor.gold)
                        .frame(width: geo.size.width * CGFloat(step) / CGFloat(total), height: 6)
                }
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }
}

// MARK: - Generic question scaffold

private struct QuestionStep<Content: View>: View {
    let title: String
    let subtitle: String?
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 15))
                        .foregroundStyle(DriveColor.textDim)
                }
                content()
                    .padding(.top, 18)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
    }
}

// MARK: - Welcome

private struct WelcomeStep: View {
    let onStart: () -> Void
    @State private var appear = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                        .frame(width: 96, height: 96)
                        .shadow(color: DriveColor.gold.opacity(0.4), radius: 24, x: 0, y: 12)
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 42, weight: .bold))
                        .foregroundStyle(.white)
                }
                .scaleEffect(appear ? 1 : 0.7)
                .opacity(appear ? 1 : 0)

                Text("DRIVE")
                    .font(.system(size: 44, weight: .black))
                    .tracking(2)
                    .foregroundStyle(DriveColor.text)
                Text("Turn your ambition into\na daily habit that pays off.")
                    .font(.system(size: 17, weight: .medium))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(DriveColor.textDim)
                    .lineSpacing(3)
            }
            Spacer()
            VStack(spacing: 12) {
                GradientButton(title: "Get started", variant: .gold) { onStart() }
                Text("Small wins. Every day.")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(DriveColor.textMuted)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) { appear = true }
        }
    }
}

// MARK: - Name

private struct NameStep: View {
    @Binding var name: String
    let onNext: () -> Void
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("What should we call you?")
                .font(.system(size: 28, weight: .black))
                .foregroundStyle(DriveColor.text)
                .tracking(-0.5)
            Text("This shows up on your dashboard.")
                .font(.system(size: 15))
                .foregroundStyle(DriveColor.textDim)

            TextField("Your name", text: $name)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(DriveColor.text)
                .focused($focused)
                .submitLabel(.done)
                .onSubmit { if canContinue { onNext() } }
                .padding(.vertical, 14)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(DriveColor.text).frame(height: 2)
                }
                .padding(.top, 18)

            Spacer()
            GradientButton(title: "Continue", disabled: !canContinue) { onNext() }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 24)
        .onAppear { focused = true }
    }

    private var canContinue: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
    }
}
