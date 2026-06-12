//
//  OnboardingStorySteps.swift
//  DRIVE
//
//  Social-proof + explainer screens used in the onboarding flow: review
//  cards (spread through the questionnaire), the branching "have you used a
//  productivity app?" question, the why-apps bar graph, and the premium
//  DRIVE comparison.
//

import SwiftUI

// MARK: - Review / social proof

struct ReviewStep: View {
    enum Kind {
        case rating(score: String, sub: String)
        case person(initial: String, name: String, tint: Color)
    }

    let kind: Kind
    let headline: String
    let message: String
    let onContinue: () -> Void

    @State private var starsIn = false
    @State private var bodyIn = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 12)

            VStack(spacing: 14) {
                HStack(spacing: 7) {
                    ForEach(0..<5, id: \.self) { i in
                        Image(systemName: "star.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(DriveColor.gold)
                            .scaleEffect(starsIn ? 1 : 0.2)
                            .opacity(starsIn ? 1 : 0)
                            .rotationEffect(.degrees(starsIn ? 0 : -25))
                            .animation(.spring(response: 0.4, dampingFraction: 0.55).delay(Double(i) * 0.08), value: starsIn)
                    }
                }

                content
                    .opacity(bodyIn ? 1 : 0)
                    .offset(y: bodyIn ? 0 : 14)
            }
            .padding(.horizontal, 28)

            Spacer()

            GradientButton(title: "Continue") { onContinue() }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
        }
        .onAppear {
            starsIn = true
            withAnimation(.easeOut(duration: 0.34).delay(0.34)) { bodyIn = true }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch kind {
        case let .rating(score, sub):
            Text(score)
                .font(.system(size: 56, weight: .black))
                .foregroundStyle(DriveColor.text)
            Text(sub)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(DriveColor.textDim)
            headlineBlock.padding(.top, 18)
        case let .person(initial, name, tint):
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(tint).frame(width: 40, height: 40)
                    Text(initial).font(.system(size: 16, weight: .black)).foregroundStyle(DriveColor.text)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                    HStack(spacing: 5) {
                        Circle().fill(DriveColor.success).frame(width: 6, height: 6)
                        Text("Verified user").font(.system(size: 12, weight: .bold)).foregroundStyle(DriveColor.textDim)
                    }
                }
            }
            .padding(.vertical, 14).padding(.horizontal, 18)
            .driveCard(fill: DriveColor.bg)
            headlineBlock.padding(.top, 18)
        }
    }

    private var headlineBlock: some View {
        VStack(spacing: 10) {
            Text(headline)
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(DriveColor.text)
                .multilineTextAlignment(.center)
                .tracking(-0.4)
            Text(message)
                .font(.system(size: 15))
                .foregroundStyle(DriveColor.textDim)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
    }
}

// MARK: - Productivity apps question

struct ProductivityStep: View {
    let picked: Bool?
    let onPick: (Bool) -> Void

    @State private var sel: Bool?
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: 10) {
                Text("QUICK QUESTION").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                Text("Have you used a\nproductivity app before?")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text("Be honest — it helps us show you the right thing next.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
            }
            .padding(.top, 12)

            VStack(spacing: 12) {
                choice(title: "No, this is new to me", sub: "I've mostly tried to stay on track on my own.", value: false, icon: "xmark")
                choice(title: "Yes, I've used some", sub: "Notion, Todoist, Habitica, calendars… you name it.", value: true, icon: "checkmark")
            }
            .padding(.top, 24)

            Spacer()

            GradientButton(title: "Continue", disabled: sel == nil) {
                if let s = sel { onPick(s) }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 24)
        .opacity(appear ? 1 : 0)
        .offset(y: appear ? 0 : 12)
        .onAppear {
            sel = picked
            withAnimation(.easeOut(duration: 0.32)) { appear = true }
        }
    }

    private func choice(title: String, sub: String, value: Bool, icon: String) -> some View {
        let selected = sel == value
        return Button {
            Haptics.selection()
            sel = value
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 13)
                        .fill(selected ? DriveColor.text : DriveColor.accentDim)
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(selected ? .white : DriveColor.gold)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.system(size: 16, weight: .black)).foregroundStyle(DriveColor.text)
                    Text(sub).font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
                }
                Spacer(minLength: 4)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? DriveColor.bgSoft : DriveColor.bg)
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(selected ? DriveColor.text : DriveColor.border, lineWidth: selected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Why apps (bar graph)

struct WhyAppsStep: View {
    let onContinue: () -> Void
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("WHY IT MATTERS").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                        Text("People who track their\ngoals go further.")
                            .font(.system(size: 28, weight: .black))
                            .foregroundStyle(DriveColor.text)
                            .tracking(-0.5)
                        Text("A system beats willpower. Here's what consistency actually looks like.")
                            .font(.system(size: 15))
                            .foregroundStyle(DriveColor.textDim)
                    }

                    BarCompareChart(bars: [
                        BarDatum(label: "On your own", value: 0.28, caption: "Low"),
                        BarDatum(label: "Other apps", value: 0.6, caption: "Better"),
                        BarDatum(label: "With DRIVE", value: 1.0, caption: "Best", highlight: true),
                    ])
                    .padding(20)
                    .driveCard(fill: DriveColor.bgSoft, padding: 20)

                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.system(size: 15)).foregroundStyle(DriveColor.accentDeep)
                            .frame(width: 32, height: 32)
                            .background(DriveColor.accentDim).clipShape(.rect(cornerRadius: 10))
                        Text("People who follow a daily plan are 3x more likely to actually finish what they start.")
                            .font(.system(size: 13.5, weight: .semibold))
                            .foregroundStyle(DriveColor.text)
                    }
                    .padding(14)
                    .background(Color(hex: 0xFFFAEB))
                    .clipShape(.rect(cornerRadius: 16))
                    .overlay { RoundedRectangle(cornerRadius: 16).stroke(Color(hex: 0xF1E2A4), lineWidth: 1) }
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 20)
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 12)
            }

            GradientButton(title: "Makes sense") { onContinue() }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
        }
        .onAppear { withAnimation(.easeOut(duration: 0.32)) { appear = true } }
    }
}

// MARK: - Why DRIVE (comparison)

struct WhyDriveStep: View {
    let onContinue: () -> Void
    @State private var appear = false

    private struct RowData: Identifiable {
        let id = UUID()
        let label: String
        let drive: Bool
        let others: Bool
    }

    private let rows: [RowData] = [
        .init(label: "Tells you exactly what to do today", drive: true, others: false),
        .init(label: "Built around your goal & schedule", drive: true, others: false),
        .init(label: "A coach when you get stuck", drive: true, others: false),
        .init(label: "Streaks that keep you showing up", drive: true, others: true),
        .init(label: "Endless setup before you start", drive: false, others: true),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("WHY DRIVE").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                        Text("Other apps organize.\nDRIVE moves you.")
                            .font(.system(size: 28, weight: .black))
                            .foregroundStyle(DriveColor.text)
                            .tracking(-0.5)
                        Text("Most apps hand you an empty page. DRIVE hands you the next step.")
                            .font(.system(size: 15))
                            .foregroundStyle(DriveColor.textDim)
                    }

                    VStack(spacing: 0) {
                        HStack {
                            Spacer()
                            Text("DRIVE").font(.system(size: 12, weight: .black)).tracking(0.6)
                                .foregroundStyle(DriveColor.accentDeep).frame(width: 60)
                            Text("Others").font(.system(size: 12, weight: .bold)).tracking(0.4)
                                .foregroundStyle(DriveColor.textMuted).frame(width: 60)
                        }
                        .padding(.vertical, 12)

                        ForEach(Array(rows.enumerated()), id: \.element.id) { idx, r in
                            VStack(spacing: 0) {
                                if idx > 0 { Divider().background(DriveColor.border) }
                                HStack {
                                    Text(r.label)
                                        .font(.system(size: 13.5, weight: .bold))
                                        .foregroundStyle(DriveColor.text)
                                    Spacer(minLength: 8)
                                    mark(on: r.drive, gold: true).frame(width: 60)
                                    mark(on: r.others, gold: false).frame(width: 60)
                                }
                                .padding(.vertical, 14)
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .driveCard(fill: DriveColor.bg, padding: 0)
                    .padding(.horizontal, 0)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 20)
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 12)
            }

            GradientButton(title: "Let's set it up", variant: .gold) { onContinue() }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
        }
        .onAppear { withAnimation(.easeOut(duration: 0.32)) { appear = true } }
    }

    private func mark(on: Bool, gold: Bool) -> some View {
        ZStack {
            Circle()
                .fill(on ? (gold ? DriveColor.gold : Color(hex: 0xCFCFCF)) : Color(hex: 0xF3F3F3))
                .frame(width: 26, height: 26)
            Image(systemName: on ? "checkmark" : "minus")
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(on ? .white : DriveColor.textMuted)
        }
    }
}
