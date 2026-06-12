//
//  StreakFlame.swift
//  DRIVE
//
//  Animated flame that scales its intensity with the streak tier.
//  Tap-triggered "burst" reaction (shockwave rings, sparks, flash) grows
//  with the streak. See `StreakFlameButton` for the tappable wrapper that
//  enforces the 5-second cooldown and shows a motivation line.
//

import SwiftUI

struct StreakFlame: View {
    let streak: Int
    var size: CGFloat = 120
    var showNumber: Bool = false
    /// Increment to fire a burst reaction.
    var burstKey: Int = 0

    @State private var pulse = false
    @State private var rotate = false
    @State private var burst: CGFloat = 0

    private var tier: StreakTier { StreakTiers.tier(for: streak) }

    var body: some View {
        ZStack {
            // Glow rings
            ForEach(0..<max(1, tier.rings), id: \.self) { i in
                Circle()
                    .fill(tier.primary.opacity(0.10 + Double(tier.rings - i) * 0.03))
                    .frame(width: size * (0.7 + CGFloat(i) * 0.18), height: size * (0.7 + CGFloat(i) * 0.18))
                    .scaleEffect(pulse ? 1.08 : 0.94)
                    .blur(radius: 6)
            }

            // Orbiting particles
            if tier.particleCount > 0 {
                ForEach(0..<min(tier.particleCount, 18), id: \.self) { i in
                    Circle()
                        .fill(tier.secondary)
                        .frame(width: size * 0.05, height: size * 0.05)
                        .offset(y: -size * 0.42)
                        .rotationEffect(.degrees(Double(i) / Double(min(tier.particleCount, 18)) * 360 + (rotate ? 360 : 0)))
                        .opacity(0.7)
                }
            }

            // Tap burst — shockwave rings + sparks, scaled by tier.
            if burst > 0.001 {
                let ringCount = min(3, 1 + tier.rings / 2)
                ForEach(0..<ringCount, id: \.self) { i in
                    Circle()
                        .stroke(i == 0 ? tier.primary : tier.secondary, lineWidth: 3 - CGFloat(i))
                        .frame(width: size * 0.6, height: size * 0.6)
                        .scaleEffect(1 + burst * (1.1 + CGFloat(i) * 0.35))
                        .opacity(Double(1 - burst))
                }
                let sparkCount = min(16, 6 + tier.particleCount)
                ForEach(0..<sparkCount, id: \.self) { i in
                    let angle = Double(i) / Double(sparkCount) * 2 * .pi
                    Image(systemName: "sparkle")
                        .font(.system(size: size * 0.09, weight: .bold))
                        .foregroundStyle(tier.secondary)
                        .offset(
                            x: cos(angle) * Double(size) * 0.55 * Double(burst),
                            y: sin(angle) * Double(size) * 0.55 * Double(burst)
                        )
                        .opacity(Double(1 - burst))
                        .scaleEffect(0.4 + burst)
                }
                Circle()
                    .fill(
                        RadialGradient(colors: [tier.secondary.opacity(0.9), tier.primary.opacity(0)], center: .center, startRadius: 0, endRadius: size * 0.5)
                    )
                    .frame(width: size * 0.9, height: size * 0.9)
                    .scaleEffect(0.6 + burst * 0.8)
                    .opacity(Double((1 - burst) * 0.8))
            }

            // Core flame
            Circle()
                .fill(
                    RadialGradient(
                        colors: [tier.secondary, tier.primary],
                        center: .center,
                        startRadius: 0,
                        endRadius: size * 0.32
                    )
                )
                .frame(width: size * 0.6, height: size * 0.6)
                .overlay {
                    if streak <= 0 {
                        Image(systemName: "flame")
                            .font(.system(size: size * 0.26, weight: .regular))
                            .foregroundStyle(.white.opacity(0.9))
                    } else if showNumber {
                        Text("\(streak)")
                            .font(.system(size: size * 0.26, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    } else {
                        Image(systemName: "flame.fill")
                            .font(.system(size: size * 0.28, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .scaleEffect((pulse ? 1.04 : 0.97) + burst * 0.18)
                .shadow(color: tier.primary.opacity(0.5), radius: 18, x: 0, y: 0)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { pulse = true }
            withAnimation(.linear(duration: Double(max(2, 8 - tier.minDays / 10))).repeatForever(autoreverses: false)) { rotate = true }
        }
        .onChange(of: burstKey) { _, _ in
            guard burstKey > 0 else { return }
            burst = 0
            withAnimation(.easeOut(duration: 0.9)) { burst = 1 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.95) { burst = 0 }
        }
    }
}

/// Tappable streak flame with a 5-second cooldown that also surfaces a
/// short, streak-aware motivation line under the flame after each tap.
struct StreakFlameButton: View {
    let streak: Int
    var size: CGFloat = 120
    var showNumber: Bool = false
    var hapticsEnabled: Bool = true

    @State private var burstKey = 0
    @State private var lastTap: Date = .distantPast
    @State private var motivation: String?
    @State private var showMotivation = false

    private var tier: StreakTier { StreakTiers.tier(for: streak) }

    var body: some View {
        VStack(spacing: 8) {
            Button(action: tap) {
                StreakFlame(streak: streak, size: size, showNumber: showNumber, burstKey: burstKey)
            }
            .buttonStyle(.plain)

            if let motivation, showMotivation {
                Text(motivation)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(tier.primary)
                    .multilineTextAlignment(.center)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }

    private func tap() {
        let now = Date()
        guard now.timeIntervalSince(lastTap) >= 5 else { return }
        lastTap = now
        burstKey += 1
        if hapticsEnabled {
            Haptics.impact(streak >= 30 ? .heavy : streak >= 7 ? .medium : .light)
        }
        motivation = StreakMotivation.line(for: streak)
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) { showMotivation = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            withAnimation(.easeOut(duration: 0.4)) { showMotivation = false }
        }
    }
}

enum StreakMotivation {
    static func line(for streak: Int) -> String {
        switch streak {
        case 0: return "Light it today. Day one starts now. 🔥"
        case 1...2: return "The spark is lit — keep it alive."
        case 3...6: return "\(streak) days. You're warming up."
        case 7...13: return "A full week on fire. Don't break the chain."
        case 14...20: return "\(streak) days — this is a real habit now."
        case 21...29: return "Three weeks deep. You're built different."
        case 30...49: return "\(streak)-day inferno. Top 5% of builders."
        case 50...99: return "Nuclear streak. Absolutely relentless. ☢️"
        default: return "\(streak) days — legendary. Phoenix energy. 🦅"
        }
    }
}
