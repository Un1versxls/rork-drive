//
//  TaskDetailSheet.swift
//  DRIVE
//

import SwiftUI

struct TaskDetailSheet: View {
    let task: DriveTask
    let business: BusinessIdea?
    let onComplete: () -> Void
    let onSkip: () -> Void

    @Environment(\.dismiss) private var dismiss

    private var done: Bool { task.status != .pending }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text(task.category.label.uppercased())
                        .font(.system(size: 11, weight: .black)).tracking(1)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                        .background(Color(hex: task.category.hex))
                        .clipShape(Capsule())
                    Spacer()
                    Text("+\(task.basePoints) base pts")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(DriveColor.textMuted)
                }

                Text(task.title)
                    .font(.system(size: 26, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)

                Text(task.description)
                    .font(.system(size: 16))
                    .foregroundStyle(DriveColor.textDim)
                    .lineSpacing(4)

                difficultyRow

                if let business {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("WHY THIS MOVES \(business.name.uppercased())")
                            .font(.system(size: 10, weight: .black)).tracking(1)
                            .foregroundStyle(DriveColor.gold)
                        Text(business.whyFit.isEmpty ? "Every rep compounds. Small daily progress is how this becomes real." : business.whyFit)
                            .font(.system(size: 14))
                            .foregroundStyle(DriveColor.text)
                            .lineSpacing(3)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .driveCard(fill: DriveColor.bgSoft)
                }

                if !done {
                    VStack(spacing: 10) {
                        GradientButton(title: "Mark complete", variant: .gold, icon: "checkmark") { onComplete() }
                        Button(action: onSkip) {
                            Text("Skip for today")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(DriveColor.textDim)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 8)
                } else {
                    Text(task.status == .completed ? "Completed ✓" : "Skipped")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(task.status == .completed ? DriveColor.success : DriveColor.textDim)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 10)
                }
            }
            .padding(24)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationContentInteraction(.scrolls)
    }

    private var difficultyRow: some View {
        HStack(spacing: 8) {
            Text("Difficulty").font(.system(size: 13, weight: .semibold)).foregroundStyle(DriveColor.textDim)
            HStack(spacing: 3) {
                ForEach(1...3, id: \.self) { i in
                    Circle()
                        .fill(i <= task.difficulty ? DriveColor.gold : DriveColor.border)
                        .frame(width: 8, height: 8)
                }
            }
        }
    }
}
