//
//  TasksView.swift
//  DRIVE
//
//  The daily dashboard: greeting, streak, today's progress, task list.
//

import SwiftUI

struct TasksView: View {
    @Environment(AppStore.self) private var store
    @State private var selectedTask: DriveTask?
    @State private var celebrate = false
    @State private var celebrateKey: String?
    @State private var logoIn = false

    private var pending: [DriveTask] { store.todayTasks.filter { $0.status == .pending } }
    private var done: [DriveTask] { store.todayTasks.filter { $0.status != .pending } }
    private var progress: Double {
        store.todayTotal > 0 ? Double(store.todayCompleted) / Double(store.todayTotal) : 0
    }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    header
                    heroCard.padding(.top, 18)
                    if let biz = store.state.profile.business {
                        Text(biz.name)
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundStyle(DriveColor.textDim)
                            .padding(.top, 12)
                    }

                    Text("Today's tasks").sectionEyebrow().padding(.top, 20)

                    if pending.isEmpty && done.isEmpty {
                        emptyState.padding(.top, 12)
                    }

                    VStack(spacing: 10) {
                        ForEach(pending) { task in
                            TaskRow(task: task,
                                    multiplier: store.plan.multiplier,
                                    onOpen: { selectedTask = task },
                                    onComplete: { store.completeTask(task.id) },
                                    onSkip: { store.skipTask(task.id) },
                                    onUndo: nil)
                        }
                    }
                    .padding(.top, 12)

                    if !done.isEmpty {
                        Text("Finished").sectionEyebrow().padding(.top, 20)
                        VStack(spacing: 10) {
                            ForEach(done) { task in
                                TaskRow(task: task,
                                        multiplier: store.plan.multiplier,
                                        onOpen: { selectedTask = task },
                                        onComplete: {},
                                        onSkip: {},
                                        onUndo: { store.undoTask(task.id) })
                            }
                        }
                        .padding(.top, 12)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 120)
            }
        }
        .sheet(item: $selectedTask) { task in
            TaskDetailSheet(task: task,
                            business: store.state.profile.business,
                            hapticsEnabled: store.state.profile.hapticsEnabled,
                            onComplete: { store.completeTask(task.id); selectedTask = nil },
                            onSkip: { store.skipTask(task.id); selectedTask = nil })
        }
        .overlay {
            if celebrate {
                CelebrationOverlay(points: todayPoints, streak: store.state.streak) {
                    celebrate = false
                }
            }
        }
        .onChange(of: store.todayCompleted) { _, _ in checkCelebrate() }
    }

    private var todayPoints: Int {
        store.todayTasks.filter { $0.status == .completed }.reduce(0) { $0 + $1.basePoints * store.plan.multiplier }
    }

    private func checkCelebrate() {
        let key = AppStore.todayKey()
        if store.todayTotal > 0, store.todayCompleted == store.todayTotal, celebrateKey != key {
            celebrateKey = key
            celebrate = true
            if store.state.profile.hapticsEnabled { Haptics.notify(.success) }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.black)
                        .frame(width: 44, height: 44)
                        .shadow(color: DriveColor.gold.opacity(0.25), radius: 8, x: 0, y: 4)
                    Image("AppLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 30, height: 30)
                }
                .scaleEffect(logoIn ? 1 : 0.8)
                .opacity(logoIn ? 1 : 0)
                .offset(y: logoIn ? 0 : 8)

                VStack(alignment: .leading, spacing: 2) {
                    Text(greeting)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(DriveColor.textDim)
                    Text(store.state.profile.name.isEmpty ? "Driver" : store.state.profile.name)
                        .font(.system(size: 26, weight: .black))
                        .foregroundStyle(DriveColor.text)
                        .tracking(-0.5)
                }
            }
            Spacer()
            VStack(spacing: 4) {
                StreakFlameButton(streak: store.state.streak, size: 54, showNumber: true, hapticsEnabled: store.state.profile.hapticsEnabled)
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill").font(.system(size: 10))
                    Text(store.tier.label.uppercased()).font(.system(size: 10, weight: .black))
                }
                .foregroundStyle(store.tier.primary)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(store.tier.primary.opacity(0.12))
                .clipShape(Capsule())
            }
        }
        .onAppear { withAnimation(.easeOut(duration: 0.5)) { logoIn = true } }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("TODAY").font(.system(size: 11, weight: .black)).tracking(1.2).foregroundStyle(DriveColor.textDim)
                Spacer()
                Text("\(store.todayCompleted) / \(store.todayTotal)")
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(DriveColor.text)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(DriveColor.border).frame(height: 6)
                    Capsule().fill(DriveColor.gold).frame(width: geo.size.width * progress, height: 6)
                        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: progress)
                }
            }
            .frame(height: 6)
            .padding(.top, 12)
            Text(progress >= 1 ? "All done. Well driven." : progress > 0 ? "You're moving." : "Let's go.")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(DriveColor.text)
                .padding(.top, 12)
        }
        .padding(20)
        .background(DriveColor.bgSoft)
        .clipShape(.rect(cornerRadius: 20))
        .overlay { RoundedRectangle(cornerRadius: 20).stroke(DriveColor.border, lineWidth: 1) }
    }

    private var emptyState: some View {
        VStack(spacing: 6) {
            Text("No tasks yet").font(.system(size: 17, weight: .bold)).foregroundStyle(DriveColor.text)
            Text("Come back tomorrow — your next tasks will be ready.")
                .font(.system(size: 13))
                .foregroundStyle(DriveColor.textDim)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .driveCard(fill: DriveColor.bgSoft)
    }

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        switch h {
        case ..<5: return "Still up,"
        case ..<12: return "Good morning,"
        case ..<17: return "Good afternoon,"
        case ..<22: return "Good evening,"
        default: return "Late night,"
        }
    }
}

// MARK: - Task row

struct TaskRow: View {
    let task: DriveTask
    let multiplier: Int
    let onOpen: () -> Void
    let onComplete: () -> Void
    let onSkip: () -> Void
    let onUndo: (() -> Void)?

    private var done: Bool { task.status != .pending }

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 12) {
                Button {
                    if task.status == .pending { onComplete() }
                } label: {
                    ZStack {
                        Circle()
                            .strokeBorder(task.status == .completed ? DriveColor.gold : DriveColor.border, lineWidth: 1.5)
                            .background(Circle().fill(task.status == .completed ? DriveColor.gold : Color.clear))
                            .frame(width: 28, height: 28)
                        if task.status == .completed {
                            Image(systemName: "checkmark").font(.system(size: 14, weight: .black)).foregroundStyle(.white)
                        } else if task.status == .skipped {
                            Image(systemName: "xmark").font(.system(size: 12, weight: .black)).foregroundStyle(DriveColor.textMuted)
                        }
                    }
                }
                .buttonStyle(.plain)
                .disabled(done)

                Button(action: onOpen) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(task.category.label.uppercased())
                                .font(.system(size: 10, weight: .black)).tracking(0.8)
                                .foregroundStyle(Color(hex: task.category.hex))
                            Spacer()
                            Text("+\(task.basePoints * multiplier) pts")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundStyle(DriveColor.textMuted)
                        }
                        Text(task.title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(task.status == .completed ? DriveColor.textDim : DriveColor.text)
                            .strikethrough(task.status == .completed)
                            .multilineTextAlignment(.leading)
                        Text(task.description)
                            .font(.system(size: 13))
                            .foregroundStyle(DriveColor.textDim)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                }
                .buttonStyle(.plain)
            }

            HStack {
                Spacer()
                if !done {
                    Button(action: onSkip) {
                        Label("Skip", systemImage: "xmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(DriveColor.textDim)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(DriveColor.bgSoft)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                } else if let onUndo {
                    Button(action: onUndo) {
                        Label("Undo", systemImage: "arrow.uturn.backward")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(DriveColor.textDim)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(DriveColor.bgSoft)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 10)
        }
        .padding(16)
        .background(DriveColor.bg)
        .clipShape(.rect(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).stroke(DriveColor.border, lineWidth: 1) }
        .opacity(done ? 0.6 : 1)
    }
}
