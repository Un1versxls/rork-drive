//
//  TaskDetailSheet.swift
//  DRIVE
//

import SwiftUI

struct TaskDetailSheet: View {
    let task: DriveTask
    let business: BusinessIdea?
    var hapticsEnabled: Bool = true
    let onComplete: () -> Void
    let onSkip: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showCoach = false

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

                coachCard

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
        .sheet(isPresented: $showCoach) {
            TaskCoachSheet(task: task, business: business, hapticsEnabled: hapticsEnabled)
        }
    }

    private var coachCard: some View {
        Button {
            if hapticsEnabled { Haptics.selection() }
            showCoach = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(DriveColor.accentDeep)
                    .frame(width: 38, height: 38)
                    .background(DriveColor.accentDim)
                    .clipShape(.rect(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Ask the Coach")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(DriveColor.text)
                    Text("Questions about this task only — guides, never does the work")
                        .font(.system(size: 11))
                        .foregroundStyle(DriveColor.textDim)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).foregroundStyle(DriveColor.textMuted)
            }
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(DriveColor.bg)
            .clipShape(.rect(cornerRadius: 16))
            .overlay { RoundedRectangle(cornerRadius: 16).stroke(DriveColor.borderStrong, lineWidth: 1) }
        }
        .buttonStyle(.plain)
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

// MARK: - Coach chat sheet

private struct TaskCoachSheet: View {
    let task: DriveTask
    let business: BusinessIdea?
    var hapticsEnabled: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var messages: [CoachMessage] = []
    @State private var input = ""
    @State private var thinking = false
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                banner
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 10) {
                            ForEach(messages) { m in
                                bubble(m).id(m.id)
                            }
                            if thinking {
                                HStack {
                                    Text("…")
                                        .font(.system(size: 15, weight: .bold))
                                        .foregroundStyle(DriveColor.textDim)
                                        .padding(.horizontal, 14).padding(.vertical, 10)
                                        .background(DriveColor.bgSoft)
                                        .clipShape(.rect(cornerRadius: 14))
                                    Spacer()
                                }
                                .id("thinking")
                            }
                        }
                        .padding(16)
                    }
                    .onChange(of: messages.count) { _, _ in
                        withAnimation { proxy.scrollTo(messages.last?.id, anchor: .bottom) }
                    }
                }
                inputBar
            }
            .background(DriveColor.bg)
            .navigationTitle("Coach")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }.foregroundStyle(DriveColor.text)
                }
            }
        }
        .onAppear {
            if messages.isEmpty {
                messages = [CoachMessage(role: .coach, text: "What part of \u{201C}\(task.title)\u{201D} would you like to understand better? I'll explain or outline it — but I won't do the work for you.")]
            }
        }
    }

    private var banner: some View {
        HStack(spacing: 6) {
            Image(systemName: "info.circle.fill").font(.system(size: 11)).foregroundStyle(DriveColor.accentDeep)
            Text("The Coach explains this task and can outline an approach — it never writes the deliverable for you.")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(DriveColor.accentDeep)
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DriveColor.accentDim)
    }

    private func bubble(_ m: CoachMessage) -> some View {
        HStack {
            if m.role == .user { Spacer(minLength: 40) }
            Text(m.text)
                .font(.system(size: 14))
                .foregroundStyle(m.role == .user ? .white : DriveColor.text)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(m.role == .user ? DriveColor.accentDeep : DriveColor.bgSoft)
                .clipShape(.rect(cornerRadius: 16))
                .overlay {
                    if m.role == .coach {
                        RoundedRectangle(cornerRadius: 16).stroke(DriveColor.border, lineWidth: 1)
                    }
                }
            if m.role == .coach { Spacer(minLength: 40) }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Ask about this task…", text: $input, axis: .vertical)
                .font(.system(size: 15))
                .focused($focused)
                .lineLimit(1...4)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(DriveColor.bgSoft)
                .clipShape(.rect(cornerRadius: 18))
                .overlay { RoundedRectangle(cornerRadius: 18).stroke(DriveColor.border, lineWidth: 1) }
            Button(action: send) {
                Image(systemName: "arrow.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(canSend ? DriveColor.text : DriveColor.textMuted)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .disabled(!canSend)
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .background(DriveColor.bg)
    }

    private var canSend: Bool {
        !input.trimmingCharacters(in: .whitespaces).isEmpty && !thinking
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !thinking else { return }
        if hapticsEnabled { Haptics.selection() }
        messages.append(CoachMessage(role: .user, text: text))
        input = ""
        thinking = true
        let history = messages
        Task {
            do {
                let reply = try await TaskCoachService.ask(
                    history: history,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    businessName: business?.name
                )
                messages.append(CoachMessage(role: .coach, text: reply))
            } catch {
                let msg = (error as? CoachServiceError)?.errorDescription ?? "Try asking again in a moment."
                messages.append(CoachMessage(role: .coach, text: msg))
            }
            thinking = false
        }
    }
}
