//
//  StreakFlame.swift
//  DRIVE
//
//  Animated flame that scales its intensity with the streak tier.
//

import SwiftUI

struct StreakFlame: View {
    let streak: Int
    var size: CGFloat = 120
    var showNumber: Bool = false

    @State private var pulse = false
    @State private var rotate = false

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
                .scaleEffect(pulse ? 1.04 : 0.97)
                .shadow(color: tier.primary.opacity(0.5), radius: 18, x: 0, y: 0)
        }
        .frame(width: size, height: size)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { pulse = true }
            withAnimation(.linear(duration: Double(max(2, 8 - tier.minDays / 10))).repeatForever(autoreverses: false)) { rotate = true }
        }
    }
}
