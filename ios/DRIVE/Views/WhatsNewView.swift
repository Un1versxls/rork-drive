//
//  WhatsNewView.swift
//  DRIVE
//
//  Shown after an update (or right after subscribing). Walks through the new
//  features one card at a time. Each card animates in, and the advance button
//  is gated for 3 seconds so the animation can play before moving on. The
//  "Badge Blitz" event card gets an extra celebratory burst.
//

import SwiftUI

struct WhatsNewView: View {
    var hapticsEnabled: Bool
    let onFinish: () -> Void

    @State private var idx = 0
    @State private var cardIn = false
    @State private var iconPulse = false
    @State private var ringBurst = false
    @State private var secondsLeft = 3
    @State private var timer: Timer?

    private let features = WhatsNew.features

    private var feature: WhatsNewFeature { features[idx] }
    private var isLast: Bool { idx == features.count - 1 }
    private var gateOpen: Bool { secondsLeft <= 0 }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack {
                    Text("WHAT'S NEW").font(.system(size: 12, weight: .black)).tracking(1.5).foregroundStyle(DriveColor.textDim)
                    Spacer()
                    Text(AppInfo.versionLabel).font(.system(size: 12, weight: .bold)).foregroundStyle(DriveColor.textMuted)
                }
                .padding(.horizontal, 24).padding(.top, 18)

                Spacer()
                card
                Spacer()

                HStack(spacing: 6) {
                    ForEach(0..<features.count, id: \.self) { i in
                        Capsule()
                            .fill(i == idx ? DriveColor.text : (i < idx ? DriveColor.gold : DriveColor.border))
                            .frame(width: i == idx ? 22 : 7, height: 7)
                    }
                }

                Button(action: advance) {
                    Text(gateOpen ? (isLast ? "Start driving" : "Next") : "\(secondsLeft)")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(gateOpen ? DriveColor.text : DriveColor.textMuted)
                        .clipShape(.rect(cornerRadius: 16))
                }
                .buttonStyle(.plain)
                .disabled(!gateOpen)
                .padding(.horizontal, 24)
                .padding(.top, 16)
                .padding(.bottom, 28)
            }
        }
        .onAppear { startCard() }
        .onDisappear { timer?.invalidate() }
    }

    private var card: some View {
        VStack(spacing: 18) {
            ZStack {
                if feature.isEvent {
                    // Celebratory rings for the Badge Blitz event.
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .stroke(DriveColor.gold.opacity(0.5), lineWidth: 2)
                            .frame(width: 120, height: 120)
                            .scaleEffect(ringBurst ? 1.6 + CGFloat(i) * 0.3 : 0.8)
                            .opacity(ringBurst ? 0 : 0.8)
                    }
                }
                Circle()
                    .fill(feature.tint.opacity(0.18))
                    .frame(width: 120, height: 120)
                    .scaleEffect(iconPulse ? 1.08 : 0.92)
                Circle()
                    .fill(LinearGradient(colors: [feature.tint, feature.tint.opacity(0.7)], startPoint: .top, endPoint: .bottom))
                    .frame(width: 84, height: 84)
                    .shadow(color: feature.tint.opacity(0.4), radius: 16, x: 0, y: 8)
                Image(systemName: feature.icon)
                    .font(.system(size: 38, weight: .bold))
                    .foregroundStyle(.white)
                    .rotationEffect(.degrees(cardIn ? 0 : -25))
            }
            .scaleEffect(cardIn ? 1 : 0.5)
            .opacity(cardIn ? 1 : 0)

            VStack(spacing: 10) {
                Text(feature.eyebrow)
                    .font(.system(size: 11, weight: .black)).tracking(1.4)
                    .foregroundStyle(feature.isEvent ? DriveColor.gold : DriveColor.accentDeep)
                    .padding(.horizontal, 12).padding(.vertical, 5)
                    .background((feature.isEvent ? DriveColor.gold : DriveColor.accentDeep).opacity(0.12))
                    .clipShape(Capsule())
                Text(feature.title)
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .multilineTextAlignment(.center)
                    .tracking(-0.5)
                Text(feature.body)
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 12)
            }
            .offset(y: cardIn ? 0 : 18)
            .opacity(cardIn ? 1 : 0)
        }
        .padding(.horizontal, 28)
        .id(idx)
    }

    private func startCard() {
        cardIn = false
        ringBurst = false
        secondsLeft = 3
        withAnimation(.spring(response: 0.55, dampingFraction: 0.6)) { cardIn = true }
        if !iconPulse {
            withAnimation(.easeInOut(duration: 1.3).repeatForever(autoreverses: true)) { iconPulse = true }
        }
        if feature.isEvent {
            if hapticsEnabled { Haptics.notify(.success) }
            withAnimation(.easeOut(duration: 1.1)) { ringBurst = true }
        } else if hapticsEnabled {
            Haptics.impact(.light)
        }
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            Task { @MainActor in
                if secondsLeft > 0 { secondsLeft -= 1 }
                if secondsLeft <= 0 { t.invalidate() }
            }
        }
    }

    private func advance() {
        guard gateOpen else { return }
        if hapticsEnabled { Haptics.selection() }
        if isLast {
            onFinish()
        } else {
            withAnimation(.easeInOut(duration: 0.25)) { idx += 1 }
            startCard()
        }
    }
}
