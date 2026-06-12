//
//  OptionCard.swift
//  DRIVE
//
//  Selectable card used across the onboarding questionnaire.
//

import SwiftUI

struct OptionCard: View {
    let title: String
    var subtitle: String? = nil
    var emoji: String? = nil
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            HStack(spacing: 14) {
                if let emoji {
                    Text(emoji).font(.system(size: 26))
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(DriveColor.text)
                    if let subtitle {
                        Text(subtitle)
                            .font(.system(size: 13))
                            .foregroundStyle(DriveColor.textDim)
                    }
                }
                Spacer(minLength: 8)
                ZStack {
                    Circle()
                        .strokeBorder(selected ? DriveColor.gold : DriveColor.border, lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if selected {
                        Circle().fill(DriveColor.gold).frame(width: 24, height: 24)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? DriveColor.bg : DriveColor.bgSoft)
            .clipShape(.rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(selected ? DriveColor.gold : DriveColor.border, lineWidth: selected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
    }
}
