//
//  FeatureTour.swift
//  DRIVE
//
//  First-run guided tour that introduces the app's core features with a
//  pulsing "tap" cue and soft fade/slide-in cards.
//

import SwiftUI

private struct TourStep: Identifiable {
    let id = UUID()
    let icon: String
    let tint: Color
    let title: String
    let body: String
}

struct FeatureTour: View {
    var hapticsEnabled: Bool
    let onFinish: () -> Void

    @State private var idx = 0
    @State private var appear = false
    @State private var pulse = false

    private let steps: [TourStep] = [
        TourStep(icon: "checkmark.circle.fill", tint: DriveColor.success, title: "Your daily tasks", body: "Every morning you get a fresh set of small wins. Tap a task to open its details and the AI Coach."),
        TourStep(icon: "flame.fill", tint: Color(hex: 0xF26B1A), title: "Build your streak", body: "Finish a task each day to grow your streak. Tap the flame anytime for a reaction that scales with your run."),
        TourStep(icon: "brain.head.profile", tint: DriveColor.accentDeep, title: "Ask the Coach", body: "Stuck on a task? The built-in AI explains it and outlines an approach — it never does the work for you."),
        TourStep(icon: "target", tint: DriveColor.gold, title: "Follow your roadmap", body: "The Progress tab maps your journey. Tap any milestone to see what it takes to get there."),
        TourStep(icon: "rosette", tint: DriveColor.gold, title: "Earn badges", body: "Hit milestones to unlock badges. Unlock 15 in one month and you earn a free month of Premium."),
    ]

    private var step: TourStep { steps[idx] }
    private var isLast: Bool { idx == steps.count - 1 }

    var body: some View {
        ZStack {
            Color.black.opacity(0.82).ignoresSafeArea()
                .transition(.opacity)

            VStack(spacing: 0) {
                Spacer()
                card
                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.35)) { appear = true }
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { pulse = true }
        }
    }

    private var card: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(step.tint.opacity(0.25))
                    .frame(width: 92, height: 92)
                    .scaleEffect(pulse ? 1.15 : 0.95)
                Circle()
                    .fill(step.tint)
                    .frame(width: 64, height: 64)
                Image(systemName: step.icon)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
            }

            HStack(spacing: 6) {
                Image(systemName: "hand.tap.fill").font(.system(size: 11))
                Text("WELCOME · \(idx + 1) OF \(steps.count)").font(.system(size: 10, weight: .black)).tracking(1.2)
            }
            .foregroundStyle(DriveColor.accentDeep)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(DriveColor.accentDim)
            .clipShape(Capsule())

            Text(step.title)
                .font(.system(size: 23, weight: .black))
                .foregroundStyle(DriveColor.text)
                .multilineTextAlignment(.center)
            Text(step.body)
                .font(.system(size: 14))
                .foregroundStyle(DriveColor.textDim)
                .multilineTextAlignment(.center)
                .lineSpacing(2)

            HStack(spacing: 6) {
                ForEach(0..<steps.count, id: \.self) { i in
                    Capsule()
                        .fill(i == idx ? DriveColor.text : (i < idx ? DriveColor.gold : DriveColor.border))
                        .frame(width: i == idx ? 22 : 7, height: 7)
                }
            }
            .padding(.top, 4)

            Button(action: next) {
                HStack(spacing: 6) {
                    Text(isLast ? "Let's go" : "Next").font(.system(size: 15, weight: .heavy))
                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(DriveColor.text)
                .clipShape(.rect(cornerRadius: 16))
            }
            .buttonStyle(.plain)
            .padding(.top, 6)
        }
        .padding(26)
        .background(DriveColor.bg)
        .clipShape(.rect(cornerRadius: 26))
        .shadow(color: .black.opacity(0.3), radius: 28, x: 0, y: 14)
        .scaleEffect(appear ? 1 : 0.9)
        .opacity(appear ? 1 : 0)
        .id(idx)
        .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .opacity))
    }

    private func next() {
        if hapticsEnabled { Haptics.selection() }
        if isLast {
            withAnimation(.easeOut(duration: 0.25)) { appear = false }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { onFinish() }
        } else {
            withAnimation(.easeInOut(duration: 0.28)) { idx += 1 }
        }
    }
}
