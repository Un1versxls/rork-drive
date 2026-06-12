//
//  MatchStep.swift
//  DRIVE
//
//  Presents matched business ideas for the user to choose from.
//

import SwiftUI

struct MatchStep: View {
    let goal: PrimaryGoal
    @Binding var picked: BusinessIdea?
    let onNext: () -> Void

    @State private var analyzing = true

    private var matches: [BusinessIdea] {
        Businesses.matches(for: goal, premium: false)
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 8) {
                Text(goal == .buildSkills ? "Your crash course" : "Your matches")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text(goal == .buildSkills ? "Pick what you want to master." : "Hand-picked for your answers. Pick one to start.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)

                if analyzing {
                    AnalyzingCard()
                        .padding(.top, 24)
                } else {
                    VStack(spacing: 14) {
                        ForEach(matches) { biz in
                            BusinessCard(business: biz, selected: picked?.id == biz.id) {
                                picked = biz
                            }
                        }
                    }
                    .padding(.top, 18)

                    GradientButton(title: "Start with this", variant: .gold, disabled: picked == nil) { onNext() }
                        .padding(.top, 8)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                withAnimation(.easeOut(duration: 0.3)) {
                    analyzing = false
                    picked = matches.first
                }
            }
        }
    }
}

private struct AnalyzingCard: View {
    @State private var progress: CGFloat = 0
    var body: some View {
        VStack(spacing: 16) {
            ProgressView().controlSize(.large).tint(DriveColor.gold)
            Text("Analyzing your answers…")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(DriveColor.text)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(DriveColor.border).frame(height: 6)
                    Capsule().fill(DriveColor.gold).frame(width: geo.size.width * progress, height: 6)
                }
            }
            .frame(height: 6)
            Text("Matching you to the best-fit ideas")
                .font(.system(size: 13))
                .foregroundStyle(DriveColor.textDim)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .driveCard(fill: DriveColor.bgSoft)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.3)) { progress = 1 }
        }
    }
}

struct BusinessCard: View {
    let business: BusinessIdea
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(business.name)
                        .font(.system(size: 19, weight: .black))
                        .foregroundStyle(DriveColor.text)
                    Spacer()
                    if selected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(DriveColor.gold)
                    }
                }
                Text(business.tagline)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(DriveColor.accentDeep)
                Text(business.description)
                    .font(.system(size: 13))
                    .foregroundStyle(DriveColor.textDim)
                    .lineSpacing(2)
                HStack(spacing: 8) {
                    Pill(icon: "dollarsign.circle", text: business.startupCost)
                    Pill(icon: "clock", text: business.timeToIncome == "—" ? "Self-paced" : business.timeToIncome)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(DriveColor.bg)
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(selected ? DriveColor.gold : DriveColor.border, lineWidth: selected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct Pill: View {
    let icon: String
    let text: String
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10, weight: .bold))
            Text(text).font(.system(size: 11, weight: .heavy))
        }
        .foregroundStyle(DriveColor.accentDeep)
        .padding(.horizontal, 9).padding(.vertical, 5)
        .background(DriveColor.accentDim)
        .clipShape(Capsule())
    }
}
