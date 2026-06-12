//
//  GradientButton.swift
//  DRIVE
//

import SwiftUI

struct GradientButton: View {
    enum Variant { case dark, gold }
    let title: String
    var variant: Variant = .dark
    var icon: String? = nil
    var disabled: Bool = false
    var loading: Bool = false
    let action: () -> Void

    @State private var pressed = false

    private var background: LinearGradient {
        switch variant {
        case .dark:
            return LinearGradient(colors: [Color(hex: 0x2A2A2A), Color(hex: 0x1A1A1A)], startPoint: .top, endPoint: .bottom)
        case .gold:
            return LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    var body: some View {
        Button {
            if !disabled && !loading {
                if true { Haptics.impact(.light) }
                action()
            }
        } label: {
            HStack(spacing: 8) {
                if loading {
                    ProgressView().tint(.white)
                } else if let icon {
                    Image(systemName: icon).font(.system(size: 15, weight: .bold))
                }
                Text(title)
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(background)
            .clipShape(.rect(cornerRadius: 999))
            .shadow(color: (variant == .gold ? DriveColor.gold : .black).opacity(0.25), radius: 14, x: 0, y: 8)
        }
        .buttonStyle(.plain)
        .opacity(disabled ? 0.45 : (pressed ? 0.9 : 1))
        .scaleEffect(pressed ? 0.98 : 1)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: pressed)
        .disabled(disabled || loading)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in pressed = true }
                .onEnded { _ in pressed = false }
        )
    }
}
