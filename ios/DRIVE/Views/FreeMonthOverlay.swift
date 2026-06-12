//
//  FreeMonthOverlay.swift
//  DRIVE
//
//  Celebration shown when the user unlocks the Badge Blitz reward
//  (15 badges in one month → a free month of Premium).
//

import SwiftUI

struct FreeMonthOverlay: View {
    let onClose: () -> Void

    @State private var appear = false
    @State private var ring = false
    @State private var confetti: [ConfettiPiece] = []

    var body: some View {
        ZStack {
            Color.black.opacity(0.55).ignoresSafeArea()
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
                ZStack {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .stroke(DriveColor.gold.opacity(0.5), lineWidth: 2)
                            .frame(width: 110, height: 110)
                            .scaleEffect(ring ? 1.5 + CGFloat(i) * 0.3 : 0.8)
                            .opacity(ring ? 0 : 0.8)
                    }
                    Circle()
                        .fill(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                        .frame(width: 92, height: 92)
                    Image(systemName: "gift.fill")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundStyle(.white)
                }

                Text("BADGE BLITZ").font(.system(size: 12, weight: .black)).tracking(2).foregroundStyle(DriveColor.gold)
                Text("Free month unlocked!")
                    .font(.system(size: 26, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .multilineTextAlignment(.center)
                Text("You unlocked \(AppInfo.badgeBlitzGoal) badges this month, so Premium is on us for the next 30 days. Keep driving.")
                    .font(.system(size: 14))
                    .foregroundStyle(DriveColor.textDim)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)

                GradientButton(title: "Claim it", variant: .gold) { onClose() }
                    .padding(.top, 6)
            }
            .padding(28)
            .background(DriveColor.bg)
            .clipShape(.rect(cornerRadius: 28))
            .padding(.horizontal, 32)
            .scaleEffect(appear ? 1 : 0.8)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            confetti = (0..<48).map { _ in ConfettiPiece.random() }
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) { appear = true }
            withAnimation(.easeOut(duration: 1.2).repeatForever(autoreverses: false)) { ring = true }
        }
    }
}
