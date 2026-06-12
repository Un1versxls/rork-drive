//
//  OnboardingClaim.swift
//  DRIVE
//
//  The business recommendation, claim (email code) step, the "this is your
//  edge" moment, and the sign-in sheet — all sharing one OTP entry control.
//

import SwiftUI
import UIKit

// MARK: - Recommendations

struct MatchPathStep: View {
    let path: BusinessPath
    let ideas: [BusinessIdea]
    @Binding var picked: BusinessIdea?
    let onNext: () -> Void

    @State private var analyzing = true

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Your top matches")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .tracking(-0.5)
                Text("Hand-picked from your answers. Pick one to claim.")
                    .font(.system(size: 15))
                    .foregroundStyle(DriveColor.textDim)

                if analyzing {
                    AnalyzingCard().padding(.top, 24)
                } else {
                    VStack(spacing: 14) {
                        ForEach(ideas) { biz in
                            RecommendationCard(business: biz, selected: picked?.id == biz.id) {
                                picked = biz
                            }
                        }
                    }
                    .padding(.top, 18)

                    Text("Premium ideas have the highest income ceiling. You can start the free pick on any plan.")
                        .font(.system(size: 12))
                        .foregroundStyle(DriveColor.textMuted)
                        .padding(.top, 10)

                    GradientButton(title: "Claim this business", variant: .gold, disabled: picked == nil) { onNext() }
                        .padding(.top, 10)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                withAnimation(.easeOut(duration: 0.3)) {
                    analyzing = false
                    picked = ideas.first { !$0.premium } ?? ideas.first
                }
            }
        }
    }
}

private struct AnalyzingCard: View {
    @State private var progress: CGFloat = 0
    var body: some View {
        VStack(spacing: 16) {
            ProgressView().controlSize(.large).tint(DriveColor.gold)
            Text("Analyzing your answers…")
                .font(.system(size: 16, weight: .heavy))
                .foregroundStyle(DriveColor.text)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(DriveColor.border).frame(height: 6)
                    Capsule().fill(DriveColor.gold).frame(width: geo.size.width * progress, height: 6)
                }
            }
            .frame(height: 6)
            Text("Matching you to the best-fit ideas")
                .font(.system(size: 13))
                .foregroundStyle(DriveColor.textDim)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .driveCard(fill: DriveColor.bgSoft)
        .onAppear { withAnimation(.easeInOut(duration: 1.3)) { progress = 1 } }
    }
}

struct RecommendationCard: View {
    let business: BusinessIdea
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Text(business.name)
                        .font(.system(size: 19, weight: .black))
                        .foregroundStyle(DriveColor.text)
                    if business.premium {
                        HStack(spacing: 3) {
                            Image(systemName: "crown.fill").font(.system(size: 8))
                            Text("PREMIUM").font(.system(size: 9, weight: .black)).tracking(0.5)
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(DriveColor.gold)
                        .clipShape(Capsule())
                    } else {
                        Text("FREE PICK").font(.system(size: 9, weight: .black)).tracking(0.5)
                            .foregroundStyle(DriveColor.success)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(DriveColor.success.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    Spacer()
                    if selected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 22))
                            .foregroundStyle(DriveColor.gold)
                    }
                }
                Text(business.tagline)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(DriveColor.accentDeep)
                Text(business.description)
                    .font(.system(size: 13))
                    .foregroundStyle(DriveColor.textDim)
                    .lineSpacing(2)
                HStack(spacing: 8) {
                    MiniPill(icon: "dollarsign.circle", text: business.startupCost)
                    MiniPill(icon: "clock", text: business.timeToIncome == "—" ? "Self-paced" : business.timeToIncome)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(DriveColor.bg)
            .clipShape(.rect(cornerRadius: 18))
            .overlay {
                RoundedRectangle(cornerRadius: 18)
                    .stroke(selected ? DriveColor.gold : DriveColor.border, lineWidth: selected ? 2 : 1)
            }
        }
        .buttonStyle(.plain)
    }
}

private struct MiniPill: View {
    let icon: String
    let text: String
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10, weight: .bold))
            Text(text).font(.system(size: 11, weight: .heavy))
        }
        .foregroundStyle(DriveColor.accentDeep)
        .padding(.horizontal, 9).padding(.vertical, 5)
        .background(DriveColor.accentDim)
        .clipShape(Capsule())
    }
}

// MARK: - Claim step (name + email + OTP)

struct ClaimStep: View {
    @Binding var name: String
    @Binding var email: String
    let business: BusinessIdea?
    let onClaimed: () -> Void
    let onSignIn: () -> Void

    @State private var codeSent = false
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CLAIM IT").sectionEyebrow().foregroundStyle(DriveColor.accentDeep)
                        Text(codeSent ? "Check your email" : "Claim your business")
                            .font(.system(size: 28, weight: .black))
                            .foregroundStyle(DriveColor.text)
                            .tracking(-0.5)
                        Text(codeSent
                             ? "Enter the 6-digit code we sent to \(email)."
                             : "Create your free account to lock in \(business?.name ?? "your business") and save your progress.")
                            .font(.system(size: 15))
                            .foregroundStyle(DriveColor.textDim)
                    }

                    if let business, business.premium {
                        HStack(spacing: 8) {
                            Image(systemName: "crown.fill").font(.system(size: 12)).foregroundStyle(DriveColor.gold)
                            Text("\(business.name) is a Premium business — you'll unlock it on the next step.")
                                .font(.system(size: 12.5, weight: .semibold))
                                .foregroundStyle(DriveColor.text)
                        }
                        .padding(12)
                        .background(Color(hex: 0xFFFAEB))
                        .clipShape(.rect(cornerRadius: 12))
                        .overlay { RoundedRectangle(cornerRadius: 12).stroke(Color(hex: 0xF1E2A4), lineWidth: 1) }
                    }

                    if codeSent {
                        OTPEntryView(email: email) { onClaimed() } onChangeEmail: {
                            withAnimation { codeSent = false }
                        }
                    } else {
                        claimForm
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 30)
                .opacity(appear ? 1 : 0)
                .offset(y: appear ? 0 : 12)
            }

            if !codeSent {
                Button(action: onSignIn) {
                    HStack(spacing: 5) {
                        Text("Already have an account?").foregroundStyle(DriveColor.textDim)
                        Text("Sign in").foregroundStyle(DriveColor.accentDeep).fontWeight(.bold)
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
                .padding(.bottom, 18)
            }
        }
        .onAppear { withAnimation(.easeOut(duration: 0.32)) { appear = true } }
    }

    private var claimForm: some View {
        VStack(spacing: 14) {
            ClaimField(placeholder: "Your name", text: $name, keyboard: .default, content: .name)
            ClaimField(placeholder: "Your email", text: $email, keyboard: .emailAddress, content: .emailAddress)
            SendCodeButton(email: email, name: name) {
                withAnimation { codeSent = true }
            }
        }
        .padding(.top, 4)
    }
}

private struct ClaimField: View {
    let placeholder: String
    @Binding var text: String
    let keyboard: UIKeyboardType
    let content: UITextContentType

    var body: some View {
        TextField(placeholder, text: $text)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(DriveColor.text)
            .keyboardType(keyboard)
            .textContentType(content)
            .autocorrectionDisabled()
            .textInputAutocapitalization(content == .emailAddress ? .never : .words)
            .padding(16)
            .background(DriveColor.bgSoft)
            .clipShape(.rect(cornerRadius: 14))
            .overlay { RoundedRectangle(cornerRadius: 14).stroke(DriveColor.border, lineWidth: 1) }
    }
}

private struct SendCodeButton: View {
    let email: String
    let name: String
    let onSent: () -> Void
    @State private var loading = false
    @State private var error: String?

    private var valid: Bool {
        name.trimmingCharacters(in: .whitespaces).count >= 1 &&
        email.contains("@") && email.contains(".")
    }

    var body: some View {
        VStack(spacing: 8) {
            GradientButton(title: "Send my code", variant: .gold, disabled: !valid, loading: loading) {
                Task { await send() }
            }
            if let error {
                Text(error).font(.system(size: 12, weight: .semibold)).foregroundStyle(DriveColor.danger)
            }
        }
    }

    private func send() async {
        loading = true
        error = nil
        do {
            try await SupabaseService.sendOTP(email: email)
            loading = false
            onSent()
        } catch {
            loading = false
            self.error = (error as? SupabaseError)?.errorDescription ?? "Couldn't send the code. Try again."
        }
    }
}

// MARK: - OTP entry (shared)

struct OTPEntryView: View {
    let email: String
    let onVerified: () -> Void
    let onChangeEmail: () -> Void

    @State private var code = ""
    @State private var loading = false
    @State private var error: String?
    @FocusState private var focused: Bool

    var body: some View {
        VStack(spacing: 14) {
            TextField("000000", text: $code)
                .font(.system(size: 30, weight: .black))
                .tracking(8)
                .multilineTextAlignment(.center)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($focused)
                .foregroundStyle(DriveColor.text)
                .padding(.vertical, 18)
                .frame(maxWidth: .infinity)
                .background(DriveColor.bgSoft)
                .clipShape(.rect(cornerRadius: 16))
                .overlay { RoundedRectangle(cornerRadius: 16).stroke(DriveColor.border, lineWidth: 1) }
                .onChange(of: code) { _, new in
                    code = String(new.filter(\.isNumber).prefix(6))
                    if code.count == 6 { Task { await verify() } }
                }

            if let error {
                Text(error).font(.system(size: 12, weight: .semibold)).foregroundStyle(DriveColor.danger)
            }

            GradientButton(title: "Verify", variant: .gold, disabled: code.count != 6, loading: loading) {
                Task { await verify() }
            }

            Button(action: onChangeEmail) {
                Text("Use a different email")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(DriveColor.textDim)
            }
            .buttonStyle(.plain)
        }
        .onAppear { focused = true }
    }

    private func verify() async {
        guard !loading else { return }
        loading = true
        error = nil
        do {
            try await SupabaseService.verifyOTP(email: email, code: code)
            loading = false
            Haptics.notify(.success)
            onVerified()
        } catch {
            loading = false
            self.error = (error as? SupabaseError)?.errorDescription ?? "Invalid code. Try again."
            code = ""
        }
    }
}

// MARK: - "This is your edge" moment

struct EdgeStep: View {
    let business: BusinessIdea?
    let hapticsEnabled: Bool
    let onContinue: () -> Void

    @State private var ringIn = false
    @State private var textIn = false
    @State private var cooldown = 3

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            VStack(spacing: 0) {
                Spacer()
                ZStack {
                    Circle()
                        .stroke(LinearGradient(colors: [DriveColor.gold, DriveColor.accentSoft], startPoint: .top, endPoint: .bottom), lineWidth: 3)
                        .frame(width: 150, height: 150)
                        .scaleEffect(ringIn ? 1 : 0.6)
                        .opacity(ringIn ? 1 : 0)
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 56, weight: .bold))
                        .foregroundStyle(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom))
                        .scaleEffect(ringIn ? 1 : 0.4)
                        .opacity(ringIn ? 1 : 0)
                }

                VStack(spacing: 12) {
                    Text("THIS IS YOUR EDGE")
                        .font(.system(size: 13, weight: .black)).tracking(2)
                        .foregroundStyle(DriveColor.accentDeep)
                    Text(business?.name ?? "Your business")
                        .font(.system(size: 30, weight: .black))
                        .foregroundStyle(DriveColor.text)
                        .multilineTextAlignment(.center)
                        .tracking(-0.5)
                    Text("Most people never start. You just claimed a plan and a system that tells you exactly what to do next.")
                        .font(.system(size: 15))
                        .foregroundStyle(DriveColor.textDim)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .padding(.horizontal, 12)
                }
                .padding(.top, 36)
                .opacity(textIn ? 1 : 0)
                .offset(y: textIn ? 0 : 16)

                Spacer()

                GradientButton(title: cooldown > 0 ? "Continue in \(cooldown)" : "See my plan", variant: .gold, disabled: cooldown > 0) {
                    onContinue()
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.6)) { ringIn = true }
            withAnimation(.easeOut(duration: 0.5).delay(0.3)) { textIn = true }
            if hapticsEnabled { Haptics.notify(.success) }
            tickCooldown()
        }
    }

    private func tickCooldown() {
        guard cooldown > 0 else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            cooldown -= 1
            tickCooldown()
        }
    }
}

// MARK: - Sign-in sheet

struct SignInSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let onResult: (AppStore.SignInResult) -> Void

    @State private var email = ""
    @State private var codeSent = false
    @State private var message: String?
    @State private var working = false

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text(codeSent ? "Enter your code" : "Welcome back")
                    .font(.system(size: 26, weight: .black))
                    .foregroundStyle(DriveColor.text)
                Text(codeSent
                     ? "We sent a 6-digit code to \(email)."
                     : "Sign in with the email you used. You'll need an active plan to sign back in.")
                    .font(.system(size: 14))
                    .foregroundStyle(DriveColor.textDim)

                if codeSent {
                    OTPEntryView(email: email) {
                        Task { await finishSignIn() }
                    } onChangeEmail: {
                        withAnimation { codeSent = false }
                    }
                } else {
                    TextField("Your email", text: $email)
                        .font(.system(size: 17, weight: .semibold))
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .padding(16)
                        .background(DriveColor.bgSoft)
                        .clipShape(.rect(cornerRadius: 14))
                        .overlay { RoundedRectangle(cornerRadius: 14).stroke(DriveColor.border, lineWidth: 1) }

                    GradientButton(title: "Send code", variant: .gold, disabled: !(email.contains("@") && email.contains(".")), loading: working) {
                        Task { await sendCode() }
                    }
                }

                if let message {
                    Text(message)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(DriveColor.danger)
                }

                Spacer()
            }
            .padding(20)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func sendCode() async {
        working = true
        message = nil
        do {
            try await SupabaseService.sendOTP(email: email)
            working = false
            withAnimation { codeSent = true }
        } catch {
            working = false
            message = (error as? SupabaseError)?.errorDescription ?? "Couldn't send the code."
        }
    }

    private func finishSignIn() async {
        let result = await store.signIn(email: email)
        switch result {
        case .restored:
            onResult(.restored)
        case .expired:
            message = "Your plan has expired. Resubscribe to sign back in."
        case .notFound:
            message = "No account found for that email."
        }
    }
}
