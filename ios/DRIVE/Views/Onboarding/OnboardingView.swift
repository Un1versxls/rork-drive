//
//  OnboardingView.swift
//  DRIVE
//
//  Two-path onboarding (online AI business vs. in-person hustle) with
//  branching social proof, a path-aware experience scale, a Cal AI–style
//  roadmap preview, 3 personalized business recommendations, and a
//  claim-your-business step (name + email code) that leads into the
//  "this is your edge" moment and the paywall. Sign-in is available from the
//  path screen and the claim screen.
//

import SwiftUI

enum OBScreen {
    case welcome, reviewRating, path, usedApps, whyApps, whyDrive
    case experience, reviewMaya, time, priority, reviewJordan, obstacle, roadmap, match, claim
}

struct OnboardingView: View {
    @Environment(AppStore.self) private var store
    @State private var idx: Int = 0
    @State private var showEdge = false
    @State private var showPaywall = false
    @State private var showSignIn = false

    // local picks
    @State private var path: BusinessPath?
    @State private var usedApps: Bool?
    @State private var experience: ExperienceLevel?
    @State private var time: TimeCommitment?
    @State private var priority: Priority?
    @State private var obstacle: Obstacle?
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var pickedBusiness: BusinessIdea?

    private let questionScreens: [OBScreen] = [.path, .experience, .time, .priority, .obstacle, .match]

    private var flow: [OBScreen] {
        var f: [OBScreen] = [.welcome, .reviewRating, .path, .usedApps]
        if usedApps == false { f.append(.whyApps) }
        if usedApps != nil { f.append(.whyDrive) }
        f += [.experience, .reviewMaya, .time, .priority, .reviewJordan, .obstacle, .roadmap, .match, .claim]
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

    private var recommendations: [BusinessIdea] {
        guard let path else { return [] }
        return BusinessCatalog.recommend(
            path: path, experience: experience, time: time, priority: priority, obstacle: obstacle
        )
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
        .fullScreenCover(isPresented: $showEdge) {
            EdgeStep(business: pickedBusiness, hapticsEnabled: store.state.profile.hapticsEnabled) {
                showEdge = false
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
        .sheet(isPresented: $showSignIn) {
            SignInSheet { result in
                showSignIn = false
                handleSignIn(result)
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
                message: "DRIVE turns a big goal into the right daily tasks — so you stop scrolling and start shipping."
            ) { advance() }
        case .path:
            PathStep(picked: path, onPick: { p in path = p; advanceSoon() }, onSignIn: { showSignIn = true })
        case .usedApps:
            ProductivityStep(picked: usedApps) { ans in usedApps = ans; advance() }
        case .whyApps:
            WhyAppsStep { advance() }
        case .whyDrive:
            WhyDriveStep { advance() }
        case .experience:
            QuestionStep(title: "How experienced are you?", subtitle: "Be honest — we meet you where you are.") {
                VStack(spacing: 12) {
                    ForEach(ExperienceLevel.allCases) { e in
                        OptionCard(title: e.title(for: path ?? .onlineAI), subtitle: e.subtitle(for: path ?? .onlineAI), selected: experience == e) {
                            experience = e; advanceSoon()
                        }
                    }
                }
            }
        case .reviewMaya:
            ReviewStep(
                kind: .person(initial: "M", name: "Maya, 22", tint: Color(hex: 0xFECACA)),
                headline: "\u{201C}Made $1.4k in a month\u{201D}",
                message: "DRIVE replaced hours of scrolling with the right next step."
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
        case .priority:
            QuestionStep(title: "What matters most to you?", subtitle: "This shapes what we recommend.") {
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
        case .roadmap:
            RoadmapPreviewStep(path: path ?? .onlineAI) { advance() }
        case .match:
            MatchPathStep(
                path: path ?? .onlineAI,
                ideas: recommendations,
                picked: $pickedBusiness
            ) { advance() }
        case .claim:
            ClaimStep(
                name: $name,
                email: $email,
                business: pickedBusiness,
                onClaimed: {
                    commitPartial()
                    store.claim(email: email, name: name)
                    showEdge = true
                },
                onSignIn: { showSignIn = true }
            )
        }
    }

    // MARK: - Navigation

    private func advance() {
        commitPartial()
        if current == .match {
            commitPartial()
        }
        withAnimation(.easeInOut(duration: 0.22)) { idx = min(flow.count - 1, idx + 1) }
    }

    private func advanceSoon() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) { advance() }
    }

    private func back() {
        withAnimation(.easeInOut(duration: 0.2)) { idx = max(0, idx - 1) }
    }

    private func handleSignIn(_ result: AppStore.SignInResult) {
        switch result {
        case .restored:
            // RootView switches to the dashboard automatically (onboarded = true).
            break
        case .expired, .notFound:
            // Stay in onboarding; the sheet already explained the outcome.
            break
        }
    }

    private func commitPartial() {
        store.setProfile { p in
            if let path {
                p.path = path
                p.goal = .earnIncome
            }
            if let experience { p.experience = experience }
            if let time { p.time = time }
            if let priority { p.priority = priority }
            if let obstacle { p.obstacle = obstacle }
            if !name.trimmingCharacters(in: .whitespaces).isEmpty {
                p.name = name.trimmingCharacters(in: .whitespaces)
            }
        }
        if let pickedBusiness {
            store.setBusiness(pickedBusiness, taskPool: OnboardingBusiness.taskPool(for: pickedBusiness))
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

struct QuestionStep<Content: View>: View {
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

// MARK: - Welcome (logo on a soft black square, fade in + up)

private struct WelcomeStep: View {
    let onStart: () -> Void
    @State private var logoIn = false
    @State private var textIn = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: 22) {
                ZStack {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .fill(Color.black)
                        .frame(width: 132, height: 132)
                        .shadow(color: DriveColor.gold.opacity(0.30), radius: 26, x: 0, y: 14)
                    Image("AppLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 96, height: 96)
                }
                .scaleEffect(logoIn ? 1 : 0.85)
                .opacity(logoIn ? 1 : 0)
                .offset(y: logoIn ? 0 : 24)

                VStack(spacing: 12) {
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
                .opacity(textIn ? 1 : 0)
                .offset(y: textIn ? 0 : 16)
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
            .opacity(textIn ? 1 : 0)
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) { logoIn = true }
            withAnimation(.easeOut(duration: 0.5).delay(0.25)) { textIn = true }
        }
    }
}

// MARK: - Path selection

private struct PathStep: View {
    let picked: BusinessPath?
    let onPick: (BusinessPath) -> Void
    let onSignIn: () -> Void
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 10) {
                Text("YOUR PATH").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                Text("How do you want\nto make money?")
                    .font(.system(size: 30, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.6)
                Text("Pick a lane — we'll tailor everything from here.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
            }
            .padding(.top, 8)

            VStack(spacing: 14) {
                ForEach(BusinessPath.allCases) { p in
                    PathCard(path: p, selected: picked == p) { onPick(p) }
                }
            }
            .padding(.top, 26)

            Spacer()

            Button(action: onSignIn) {
                HStack(spacing: 5) {
                    Text("Already have an account?").foregroundStyle(DriveColor.textDim)
                    Text("Sign in").foregroundStyle(DriveColor.accentDeep).fontWeight(.bold)
                }
                .font(.system(size: 14, weight: .semibold))
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plain)
            .padding(.bottom, 18)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .opacity(appear ? 1 : 0)
        .offset(y: appear ? 0 : 12)
        .onAppear { withAnimation(.easeOut(duration: 0.32)) { appear = true } }
    }
}

private struct PathCard: View {
    let path: BusinessPath
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(selected ? DriveColor.text : DriveColor.accentDim)
                        .frame(width: 56, height: 56)
                    Text(path.emoji).font(.system(size: 28))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text(path.title).font(.system(size: 18, weight: .black)).foregroundStyle(DriveColor.text)
                    Text(path.subtitle).font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right").font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.textMuted)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? DriveColor.bg : DriveColor.bgSoft)
            .clipShape(.rect(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20)
                    .stroke(selected ? DriveColor.gold : DriveColor.border, lineWidth: selected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Roadmap preview (Cal AI–style entrance)

private struct RoadmapPreviewStep: View {
    let path: BusinessPath
    let onContinue: () -> Void
    @State private var selected: Int? = nil
    @State private var appear = false

    private var milestones: [RoadmapMilestone] {
        [
            .init(day: 1, label: "Start your first task", progress: 0.0),
            .init(day: 7, label: "Land your first win", progress: 0.32),
            .init(day: 21, label: "First real income", progress: 0.6),
            .init(day: 45, label: "Consistent momentum", progress: 0.82),
        ]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 10) {
                Text("YOUR ROADMAP").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                Text("Here's the journey\nahead of you.")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text("Small daily steps compound into real results. Tap a milestone to peek ahead.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
            }
            .padding(.top, 8)
            .opacity(appear ? 1 : 0)
            .offset(y: appear ? 0 : 12)

            RoadmapChart(
                milestones: milestones,
                finalLabel: "Your goal",
                youProgress: 0.0,
                daysOnAccount: 0,
                autoSelectIndex: 1,
                selected: $selected
            )
            .padding(20)
            .driveCard(fill: DriveColor.bgSoft, padding: 20)
            .padding(.top, 22)

            Spacer()

            GradientButton(title: "Looks good", variant: .gold) { onContinue() }
                .padding(.bottom, 20)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .onAppear { withAnimation(.easeOut(duration: 0.32)) { appear = true } }
    }
}

// MARK: - Helpers shared with the store

enum OnboardingBusiness {
    /// Builds a focused daily task pool from a business's first milestones.
    static func taskPool(for business: BusinessIdea) -> [TaskSeed] {
        let cats: [TaskCategory] = [.focus, .growth, .hustle, .skill, .mindset]
        var seeds: [TaskSeed] = business.firstMilestones.enumerated().map { i, m in
            TaskSeed(
                title: m,
                description: "A concrete step toward launching \(business.name).",
                category: cats[i % cats.count],
                difficulty: (i % 3) + 1
            )
        }
        seeds.append(TaskSeed(title: "Tell one person about \(business.name)", description: "Share what you're building and ask for honest feedback.", category: .growth, difficulty: 1))
        seeds.append(TaskSeed(title: "Define today's one move", description: "Write the single most important step for \(business.name) today.", category: .focus, difficulty: 2))
        return seeds
    }
}
