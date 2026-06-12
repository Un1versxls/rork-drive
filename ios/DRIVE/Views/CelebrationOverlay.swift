//
//  CelebrationOverlay.swift
//  DRIVE
//
//  Full-screen celebration shown when every task for the day is done.
//

import SwiftUI

struct CelebrationOverlay: View {
    let points: Int
    let streak: Int
    let onClose: () -> Void

    @State private var appear = false
    @State private var confetti: [ConfettiPiece] = []

    var body: some View {
        ZStack {
            Color.black.opacity(0.45).ignoresSafeArea()
                .onTapGesture { onClose() }

            ForEach(confetti) { piece in
                RoundedRectangle(cornerRadius: 2)
                    .fill(piece.color)
                    .frame(width: 8, height: 14)
                    .rotationEffect(.degrees(piece.rotation))
                    .position(x: piece.x, y: appear ? piece.endY : -40)
                    .opacity(appear ? 0 : 1)
                    .animation(.easeIn(duration: piece.duration), value: appear)
            }

            VStack(spacing: 16) {
                StreakFlame(streak: streak, size: 120)
                Text("Day complete!")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                Text("+\(points) points earned today")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(DriveColor.accentDeep)
                HStack(spacing: 6) {
                    Image(systemName: "flame.fill").foregroundStyle(StreakTiers.tier(for: streak).primary)
                    Text("\(streak) day streak")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(DriveColor.text)
                }
                GradientButton(title: "Keep driving", variant: .gold) { onClose() }
                    .padding(.top, 8)
            }
            .padding(28)
            .background(DriveColor.bg)
            .clipShape(.rect(cornerRadius: 28))
            .padding(.horizontal, 32)
            .scaleEffect(appear ? 1 : 0.8)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            confetti = (0..<40).map { _ in ConfettiPiece.random() }
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) { appear = true }
        }
    }
}

struct ConfettiPiece: Identifiable {
    let id = UUID()
    let x: CGFloat
    let endY: CGFloat
    let rotation: Double
    let duration: Double
    let color: Color

    static func random() -> ConfettiPiece {
        let w = UIScreen.main.bounds.width
        let h = UIScreen.main.bounds.height
        let colors = [DriveColor.gold, DriveColor.accent, DriveColor.accentDeep, DriveColor.accentSoft]
        return ConfettiPiece(
            x: CGFloat.random(in: 0...w),
            endY: CGFloat.random(in: h * 0.5...h),
            rotation: Double.random(in: 0...360),
            duration: Double.random(in: 1.2...2.4),
            color: colors.randomElement()!
        )
    }
}
