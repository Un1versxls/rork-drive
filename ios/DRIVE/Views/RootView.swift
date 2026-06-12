//
//  RootView.swift
//  DRIVE
//
//  Top-level router: onboarding vs. the main tabbed app.
//

import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if !store.hydrated {
                SplashView()
            } else if !store.state.onboarded {
                OnboardingView()
                    .transition(.opacity)
            } else {
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: store.state.onboarded)
        .onAppear { store.rolloverTasks() }
    }
}

// MARK: - Main tabs

private enum DriveTab: Int, CaseIterable {
    case tasks, progress, build, profile

    var icon: String {
        switch self {
        case .tasks: return "checkmark.circle"
        case .progress: return "chart.bar"
        case .build: return "sparkles"
        case .profile: return "person"
        }
    }
}

struct MainTabView: View {
    @Environment(AppStore.self) private var store
    @State private var tab: DriveTab = .tasks
    @State private var toastBadge: Badge?

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch tab {
                case .tasks: TasksView()
                case .progress: ProgressTabView()
                case .build: BuildView()
                case .profile: ProfileView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            tabBar
        }
        .ignoresSafeArea(.keyboard)
        .overlay(alignment: .top) {
            if let badge = toastBadge {
                BadgeToast(badge: badge)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .padding(.top, 8)
            }
        }
        .onChange(of: store.pendingBadge?.id) { _, _ in
            if let badge = store.pendingBadge {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) { toastBadge = badge }
                if store.state.profile.hapticsEnabled { Haptics.notify(.success) }
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    withAnimation(.easeOut(duration: 0.3)) { toastBadge = nil }
                    store.pendingBadge = nil
                }
            }
        }
    }

    private var tabBar: some View {
        HStack(spacing: 8) {
            ForEach(DriveTab.allCases, id: \.rawValue) { t in
                Button {
                    if store.state.profile.hapticsEnabled { Haptics.selection() }
                    tab = t
                } label: {
                    Image(systemName: t.icon)
                        .font(.system(size: 22, weight: tab == t ? .bold : .regular))
                        .foregroundStyle(tab == t ? DriveColor.text : DriveColor.textMuted)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .frame(height: 64)
        .background(DriveColor.bg)
        .clipShape(.rect(cornerRadius: 22))
        .overlay { RoundedRectangle(cornerRadius: 22).stroke(DriveColor.border, lineWidth: 1) }
        .shadow(color: .black.opacity(0.06), radius: 14, x: 0, y: 6)
        .padding(.horizontal, 16)
        .padding(.bottom, 4)
    }
}

// MARK: - Splash

struct SplashView: View {
    @State private var pulse = false
    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                        .frame(width: 80, height: 80)
                        .scaleEffect(pulse ? 1.05 : 0.95)
                    Image(systemName: "bolt.fill").font(.system(size: 34, weight: .bold)).foregroundStyle(.white)
                }
                Text("DRIVE").font(.system(size: 22, weight: .black)).tracking(3).foregroundStyle(DriveColor.text)
            }
        }
        .onAppear { withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) { pulse = true } }
    }
}

// MARK: - Badge toast

struct BadgeToast: View {
    let badge: Badge
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                    .frame(width: 40, height: 40)
                Image(systemName: badge.icon).font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("Badge unlocked").font(.system(size: 10, weight: .black)).tracking(0.8).foregroundStyle(DriveColor.gold)
                Text(badge.title).font(.system(size: 15, weight: .black)).foregroundStyle(DriveColor.text)
            }
            Spacer()
        }
        .padding(12)
        .background(DriveColor.bg)
        .clipShape(.rect(cornerRadius: 16))
        .overlay { RoundedRectangle(cornerRadius: 16).stroke(DriveColor.borderStrong, lineWidth: 1) }
        .shadow(color: .black.opacity(0.12), radius: 16, x: 0, y: 8)
        .padding(.horizontal, 16)
    }
}
