//
//  RootView.swift
//  DRIVE
//
//  Top-level router: onboarding vs. the main tabbed app.
//

import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.scenePhase) private var scenePhase

    @State private var showLoader = true
    @State private var wasBackgrounded = false

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
        .overlay {
            if showLoader {
                LaunchLoadingView()
                    .transition(.opacity)
                    .zIndex(100)
            }
        }
        .onAppear {
            store.rolloverTasks()
            store.maybeSyncOnForeground()
            startLoader()
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                store.rolloverTasks()
                store.maybeSyncOnForeground()
                // Returning from the background re-shows the brief loading screen.
                if wasBackgrounded {
                    wasBackgrounded = false
                    startLoader()
                }
            case .background:
                wasBackgrounded = true
            default:
                break
            }
        }
    }

    /// Shows the branded loading screen for ~2s, then fades it out.
    private func startLoader() {
        showLoader = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation(.easeInOut(duration: 0.6)) { showLoader = false }
        }
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
    @State private var showTour = false
    @State private var showWhatsNew = false

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
        .overlay {
            if showTour {
                FeatureTour(hapticsEnabled: store.state.profile.hapticsEnabled) {
                    store.markTourSeen()
                    withAnimation(.easeOut(duration: 0.2)) { showTour = false }
                    evaluateWhatsNew()
                }
                .transition(.opacity)
                .zIndex(50)
            }
            if store.pendingFreeMonth {
                FreeMonthOverlay { store.pendingFreeMonth = false }
                    .zIndex(60)
            }
        }
        .fullScreenCover(isPresented: $showWhatsNew) {
            WhatsNewView(hapticsEnabled: store.state.profile.hapticsEnabled) {
                store.markWhatsNewSeen()
                showWhatsNew = false
            }
        }
        .onAppear(perform: evaluateIntros)
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

    /// First-run tour takes priority; otherwise check the What's New popup.
    private func evaluateIntros() {
        if !store.hasSeenTour {
            withAnimation(.easeIn(duration: 0.3)) { showTour = true }
        } else {
            evaluateWhatsNew()
        }
    }

    private func evaluateWhatsNew() {
        if store.shouldShowWhatsNew {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { showWhatsNew = true }
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

// MARK: - Launch / foreground loading screen

/// Branded loading screen shown briefly on cold launch and when returning from
/// the background. No buttons — it simply fades out after a short beat.
struct LaunchLoadingView: View {
    @State private var appear = false
    @State private var pulse = false
    @State private var glow = false

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()

            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .fill(DriveColor.gold.opacity(0.16))
                        .frame(width: 132, height: 132)
                        .scaleEffect(glow ? 1.12 : 0.9)
                        .opacity(glow ? 0 : 0.9)
                    Circle()
                        .fill(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                        .frame(width: 84, height: 84)
                        .scaleEffect(pulse ? 1.05 : 0.96)
                        .shadow(color: DriveColor.gold.opacity(0.35), radius: 18, x: 0, y: 10)
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: 8) {
                    Text("DRIVE")
                        .font(.system(size: 26, weight: .black))
                        .tracking(4)
                        .foregroundStyle(DriveColor.text)
                    Text("Build something real, one day at a time.")
                        .font(.system(size: 13, weight: .semibold))
                        .tracking(0.3)
                        .foregroundStyle(DriveColor.textMuted)
                        .multilineTextAlignment(.center)
                }
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 8)
            }
            .scaleEffect(appear ? 1 : 0.94)
            .opacity(appear ? 1 : 0)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.4)) { appear = true }
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) { pulse = true }
            withAnimation(.easeOut(duration: 1.6).repeatForever(autoreverses: false)) { glow = true }
        }
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
