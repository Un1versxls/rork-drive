//
//  AppShowcaseView.swift
//  DRIVE
//
//  Pre-paywall showcase: a phone mockup spins in from a random side and
//  cycles through the app's highlights (daily tasks, the AI Coach, and
//  streak progress). The continue button is gated for 3 seconds.
//

import SwiftUI

struct AppShowcaseView: View {
    var hapticsEnabled: Bool
    let onContinue: () -> Void

    @State private var page = 0
    @State private var spunIn = false
    @State private var startOffset: CGSize = .zero
    @State private var startRotation: Double = 0
    @State private var secondsLeft = 3
    @State private var timer: Timer?
    @State private var pageTimer: Timer?

    private let pages = ["tasks", "coach", "streak"]
    private var gateOpen: Bool { secondsLeft <= 0 }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            // Soft gold atmosphere
            RadialGradient(colors: [DriveColor.accentDim, .clear], center: .top, startRadius: 0, endRadius: 420)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer(minLength: 12)

                Text("This is your edge.")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text("A focused daily system that actually moves you forward.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 36)
                    .padding(.top, 6)

                Spacer(minLength: 8)

                phone
                    .offset(spunIn ? .zero : startOffset)
                    .rotationEffect(.degrees(spunIn ? 0 : startRotation))
                    .rotation3DEffect(.degrees(spunIn ? 0 : 60), axis: (x: 0, y: 1, z: 0.2))
                    .scaleEffect(spunIn ? 1 : 0.5)
                    .opacity(spunIn ? 1 : 0)

                Spacer(minLength: 8)

                HStack(spacing: 6) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        Capsule()
                            .fill(i == page ? DriveColor.gold : DriveColor.border)
                            .frame(width: i == page ? 22 : 7, height: 7)
                    }
                }
                .padding(.bottom, 16)

                Button(action: proceed) {
                    Text(gateOpen ? "Continue" : "\(secondsLeft)")
                        .font(.system(size: 16, weight: .heavy))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(gateOpen ? DriveColor.text : DriveColor.textMuted)
                        .clipShape(.rect(cornerRadius: 16))
                }
                .buttonStyle(.plain)
                .disabled(!gateOpen)
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
            }
        }
        .onAppear(perform: start)
        .onDisappear {
            timer?.invalidate()
            pageTimer?.invalidate()
        }
    }

    // MARK: - Phone mockup

    private var phone: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 38)
                .fill(DriveColor.text)
                .frame(width: 230, height: 470)
                .shadow(color: .black.opacity(0.25), radius: 30, x: 0, y: 18)
            RoundedRectangle(cornerRadius: 32)
                .fill(DriveColor.bg)
                .frame(width: 212, height: 452)
                .overlay { screen.clipShape(.rect(cornerRadius: 32)) }
            Capsule()
                .fill(.black.opacity(0.85))
                .frame(width: 64, height: 18)
                .offset(y: -212)
        }
        .frame(width: 230, height: 470)
    }

    @ViewBuilder
    private var screen: some View {
        switch pages[page] {
        case "tasks": tasksScreen
        case "coach": coachScreen
        default: streakScreen
        }
    }

    private var tasksScreen: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("TODAY").font(.system(size: 10, weight: .black)).tracking(1.2).foregroundStyle(DriveColor.textDim)
            Text("3 small wins").font(.system(size: 20, weight: .black)).foregroundStyle(DriveColor.text)
            ForEach(["Define your offer", "Post one piece of content", "Reach out to 3 leads"], id: \.self) { t in
                HStack(spacing: 8) {
                    Circle().strokeBorder(DriveColor.gold, lineWidth: 2).frame(width: 18, height: 18)
                    Text(t).font(.system(size: 12, weight: .semibold)).foregroundStyle(DriveColor.text).lineLimit(1)
                    Spacer()
                }
                .padding(10)
                .background(DriveColor.bgSoft)
                .clipShape(.rect(cornerRadius: 12))
            }
            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var coachScreen: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "brain.head.profile").font(.system(size: 13)).foregroundStyle(DriveColor.accentDeep)
                Text("Coach").font(.system(size: 14, weight: .black)).foregroundStyle(DriveColor.text)
            }
            Text("Ask about any task").font(.system(size: 11, weight: .semibold)).foregroundStyle(DriveColor.textDim)
            HStack { Spacer(minLength: 30)
                Text("How do I define my offer?")
                    .font(.system(size: 11)).foregroundStyle(.white)
                    .padding(8).background(DriveColor.accentDeep).clipShape(.rect(cornerRadius: 12))
            }
            HStack {
                Text("Start with who it's for and the one result they want. Want me to outline it?")
                    .font(.system(size: 11)).foregroundStyle(DriveColor.text)
                    .padding(8).background(DriveColor.bgSoft).clipShape(.rect(cornerRadius: 12))
                Spacer(minLength: 30)
            }
            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var streakScreen: some View {
        VStack(spacing: 10) {
            Spacer()
            StreakFlame(streak: 12, size: 110, showNumber: true)
            Text("12 day streak").font(.system(size: 16, weight: .black)).foregroundStyle(DriveColor.text)
            Text("BLAZE").font(.system(size: 10, weight: .black)).tracking(2).foregroundStyle(Color(hex: 0xE89B2B))
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Lifecycle

    private func start() {
        let sides: [CGSize] = [
            CGSize(width: -420, height: -160),
            CGSize(width: 420, height: -120),
            CGSize(width: -380, height: 220),
            CGSize(width: 400, height: 200),
        ]
        startOffset = sides.randomElement() ?? CGSize(width: -420, height: -160)
        startRotation = Double.random(in: 0...1) > 0.5 ? 220 : -220
        if hapticsEnabled { Haptics.impact(.medium) }
        withAnimation(.spring(response: 0.85, dampingFraction: 0.72)) { spunIn = true }

        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            Task { @MainActor in
                if secondsLeft > 0 { secondsLeft -= 1 }
                if secondsLeft <= 0 { t.invalidate() }
            }
        }
        pageTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
            Task { @MainActor in
                withAnimation(.easeInOut(duration: 0.35)) { page = (page + 1) % pages.count }
            }
        }
    }

    private func proceed() {
        guard gateOpen else { return }
        if hapticsEnabled { Haptics.selection() }
        timer?.invalidate()
        pageTimer?.invalidate()
        onContinue()
    }
}
