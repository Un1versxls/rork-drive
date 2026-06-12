//
//  OnboardingView.swift
//  DRIVE
//
//  Multi-step onboarding questionnaire that builds the user's profile,
//  matches a business, and leads into the paywall. Cal AI–style flow:
//  social proof, a branching "have you used a productivity app?" question
//  with a why-it-helps graph, a premium DRIVE comparison, and reviews
//  spread across the questionnaire.
//

import SwiftUI

enum OBScreen {
    case welcome, reviewRating, usedApps, whyApps, whyDrive
    case goal, experience, reviewMaya, time, motivation, priority, reviewJordan, obstacle, name, match
}

struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @State private var idx: Int = 0
    @State private var showShowcase = false
    @State private var showPaywall = false

    // local picks
    @State private var usedApps: Bool?
    @State private var goal: PrimaryGoal?
    @State private var experience: ExperienceLevel?
    @State private var time: TimeCommitment?
    @State private var priority: Priority?
    @State private var motivation: Int?
    @State private var obstacle: Obstacle?
    @State private var name: String = ""
    @State private var pickedBusiness: BusinessIdea?

    private let questionScreens: [OBScreen] = [.goal, .experience, .time, .motivation, .priority, .obstacle, .name, .match]

    private var flow: [OBScreen] {
        var f: [OBScreen] = [.welcome, .reviewRating, .usedApps]
        if usedApps == false { f.append(.whyApps) }
        if usedApps != nil { f.append(.whyDrive) }
        f += [.goal, .experience, .reviewMaya, .time, .motivation, .priority, .reviewJordan, .obstacle, .name, .match]
        return f
    }

    private var current: OBScreen {
        let f = flow
        return idx >= 0 && idx < f.count ? f[idx] : .match
    }

    private var isQuestion: Bool { questionScreens.contains(current) }

    private var questionProgress: (step: Int, total: Int) {
        let f = flow
        let answered = f.prefix(idx + 1).filter { questionScreens.contains($0) }.count
        return (answered, questionScreens.count)
    }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                if isQuestion {
                    OnboardingHeader(step: questionProgress.step, total: questionProgress.total) { back() }
                }
                content
                    .id(idx)
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .opacity
                    ))
            }
        }
        .fullScreenCover(isPresented: $showShowcase) {
            AppShowcaseView(hapticsEnabled: store.state.profile.hapticsEnabled) {
                showShowcase = false
                showPaywall = true
            }
            .environment(store)
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
        switch current {
        case .welcome:
            WelcomeStep { advance() }
        case .reviewRating:
            ReviewStep(
                kind: .rating(score: "4.9", sub: "Based on 12,400+ reviews"),
                headline: "Loved by 42,000+ people building something real.",
                message: "DRIVE turns big goals into the right daily tasks — so you stop scrolling and start shipping."
            ) { advance() }
        case .usedApps:
            ProductivityStep(picked: usedApps) { ans in
                usedApps = ans
                advance()
            }
        case .whyApps:
            WhyAppsStep { advance() }
        case .whyDrive:
            WhyDriveStep { advance() }
        case .goal:
            QuestionStep(title: "What's your main goal?", subtitle: "We'll tailor your daily plan to this.") {
                VStack(spacing: 12) {
                    ForEach(PrimaryGoal.allCases) { g in
                        OptionCard(title: g.title, subtitle: g.subtitle, emoji: g.emoji, selected: goal == g) {
                            goal = g; advanceSoon()
                        }
                    }
                }
            }
        case .experience:
            QuestionStep(title: "How experienced are you?", subtitle: "Be honest — we meet you where you are.") {
                VStack(spacing: 12) {
                    ForEach(ExperienceLevel.allCases) { e in
                        OptionCard(title: e.title, subtitle: e.subtitle, selected: experience == e) {
                            experience = e; advanceSoon()
                        }
                    }
                }
            }
        case .reviewMaya:
            ReviewStep(
                kind: .person(initial: "M", name: "Maya, 22", tint: Color(hex: 0xFECACA)),
                headline: "\u{201C}Made $1.4k in a month\u{201D}",
                message: "DRIVE replaced hours of TikTok scrolling with the right next step."
            ) { advance() }
        case .time:
            QuestionStep(title: "How much time can you give?", subtitle: "Every day counts — even 15 minutes.") {
                VStack(spacing: 12) {
                    ForEach(TimeCommitment.allCases) { t in
                        OptionCard(title: t.title, subtitle: t.subtitle, selected: time == t) {
                            time = t; advanceSoon()
                        }
                    }
                }
            }
        case .motivation:
            QuestionStep(title: "How fired up are you right now?", subtitle: "Slide to set your starting energy.") {
                MotivationScaleStep(value: $motivation) { advanceSoon() }
            }
        case .priority:
            QuestionStep(title: "What matters most to you?", subtitle: nil) {
                VStack(spacing: 12) {
                    ForEach(Priority.allCases) { p in
                        OptionCard(title: p.title, subtitle: p.subtitle, selected: priority == p) {
                            priority = p; advanceSoon()
                        }
                    }
                }
            }
        case .reviewJordan:
            ReviewStep(
                kind: .person(initial: "J", name: "Jordan, 19", tint: Color(hex: 0xFDE68A)),
                headline: "\u{201C}First $500 month in 3 weeks\u{201D}",
                message: "The daily task system pushed me past every excuse I used to make."
            ) { advance() }
        case .obstacle:
            QuestionStep(title: "What's held you back?", subtitle: "Knowing this helps us keep you moving.") {
                VStack(spacing: 12) {
                    ForEach(Obstacle.allCases) { o in
                        OptionCard(title: o.title, selected: obstacle == o) {
                            obstacle = o; advanceSoon()
                        }
                    }
                }
            }
        case .name:
            NameStep(name: $name) { advance() }
        case .match:
            MatchStep(goal: goal ?? .earnIncome, picked: $pickedBusiness) { advance() }
        }
    }

    // MARK: - Navigation

    private func advance() {
        commitPartial()
        if current == .match {
            commitPartial()
            showShowcase = true
            return
        }
        withAnimation(.easeInOut(duration: 0.22)) { idx = min(flow.count - 1, idx + 1) }
    }

    private func advanceSoon() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) { advance() }
    }

    private func back() {
        withAnimation(.easeInOut(duration: 0.2)) { idx = max(0, idx - 1) }
    }

    private func commitPartial() {
        store.setProfile { p in
            if let goal { p.goal = goal }
            if let experience { p.experience = experience }
            if let time { p.time = time }
            if let priority { p.priority = priority }
            if let motivation { p.confidence = motivation }
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
                        .animation(.easeInOut(duration: 0.4), value: step)
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
    @State private var appear = false

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
            .opacity(appear ? 1 : 0)
            .offset(y: appear ? 0 : 12)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.32)) { appear = true }
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
            withAnimation(.spring(response: 0.5, dampingFraction: 0.65)) { appear = true }
        }
    }
}

// MARK: - Motivation scale (emoji + slider variety)

private struct MotivationScaleStep: View {
    @Binding var value: Int?
    let onPick: () -> Void

    @State private var raw: Double = 3
    @State private var committed = false

    private let emojis = ["😴", "🙂", "😃", "🔥", "🚀"]
    private let labels = ["Low", "Okay", "Good", "Fired up", "Unstoppable"]
    private var step: Int { min(4, max(0, Int(raw.rounded()))) }

    var body: some View {
        VStack(spacing: 22) {
            Text(emojis[step])
                .font(.system(size: 72))
                .scaleEffect(committed ? 1.1 : 1)
                .animation(.spring(response: 0.3, dampingFraction: 0.5), value: step)

            Text(labels[step])
                .font(.system(size: 20, weight: .black))
                .foregroundStyle(DriveColor.text)

            HStack(spacing: 8) {
                ForEach(0..<5, id: \.self) { i in
                    Capsule()
                        .fill(i <= step ? DriveColor.gold : DriveColor.border)
                        .frame(height: 10)
                }
            }

            Slider(value: $raw, in: 0...4, step: 1)
                .tint(DriveColor.gold)
                .onChange(of: step) { _, _ in Haptics.selection() }

            GradientButton(title: "That's me", variant: .gold) {
                committed = true
                value = step + 1
                onPick()
            }
        }
        .padding(.top, 6)
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
