//
//  ProfileView.swift
//  DRIVE
//

import SwiftUI

struct ProfileView: View {
    @Environment(AppStore.self) private var store
    @State private var editingName = false
    @State private var nameDraft = ""
    @State private var planExpanded = false
    @State private var showBadges = false
    @State private var showPaywall = false
    @State private var confirmReset = false
    @State private var confirmDelete = false

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Profile")
                        .font(.system(size: 32, weight: .black))
                        .foregroundStyle(DriveColor.text)
                        .tracking(-0.5)

                    userCard.padding(.top, 18)

                    Text("Subscription").sectionEyebrow().padding(.top, 22)
                    subscriptionCard.padding(.top, 10)

                    if let biz = store.state.profile.business {
                        Text(store.state.profile.goal == .buildSkills ? "Your crash course" : "Your business")
                            .sectionEyebrow().padding(.top, 8)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(biz.name).font(.system(size: 17, weight: .black)).foregroundStyle(DriveColor.text)
                            Text(biz.tagline).font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .driveCard()
                        .padding(.top, 10)
                    }

                    Text("More").sectionEyebrow().padding(.top, 8)
                    menuRow(icon: "rosette", label: "Badges") { showBadges = true }
                    settingsCard.padding(.top, 8)

                    Text("Legal").sectionEyebrow().padding(.top, 14)
                    linkRow(icon: "doc.text", label: "Terms of Use", url: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")
                    linkRow(icon: "checkmark.shield", label: "Privacy Policy", url: "https://rork.app/privacy")

                    HStack(spacing: 10) {
                        Button { confirmReset = true } label: {
                            Text("Reset everything")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(DriveColor.danger)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(DriveColor.bgSoft)
                                .clipShape(.rect(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)

                        Button { confirmDelete = true } label: {
                            Text("Delete account")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 13)
                                .background(DriveColor.danger)
                                .clipShape(.rect(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 18)

                    Text("DRIVE \(AppInfo.versionLabel)")
                        .font(.system(size: 11))
                        .foregroundStyle(DriveColor.textMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 22)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 140)
            }
        }
        .fullScreenCover(isPresented: $showBadges) {
            NavigationStack { BadgesView().environment(store) }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallView(fromUpgrade: true) { showPaywall = false }.environment(store)
        }
        .alert("Reset DRIVE?", isPresented: $confirmReset) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) { store.resetEverything() }
        } message: {
            Text("This clears your progress and restarts onboarding.")
        }
        .alert("Delete account?", isPresented: $confirmDelete) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { store.deleteAccount() }
        } message: {
            Text("This permanently deletes your account and all your data on this device. This can't be undone.")
        }
    }

    // MARK: - Cards

    private var userCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            if editingName {
                TextField("Your name", text: $nameDraft)
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(DriveColor.text)
                    .submitLabel(.done)
                    .onSubmit { saveName() }
            } else {
                Button {
                    nameDraft = store.state.profile.name
                    editingName = true
                } label: {
                    HStack(spacing: 8) {
                        Text(store.state.profile.name.isEmpty ? "Driver" : store.state.profile.name)
                            .font(.system(size: 22, weight: .black)).foregroundStyle(DriveColor.text)
                        Image(systemName: "pencil").font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
                    }
                }
                .buttonStyle(.plain)
            }
            Text("Level \(store.level) · \(store.totalCompleted) tasks done")
                .font(.system(size: 13)).foregroundStyle(DriveColor.textDim)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .driveCard(fill: DriveColor.bgSoft, padding: 18)
    }

    private var subscriptionCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.25)) { planExpanded.toggle() }
            } label: {
                HStack(spacing: 12) {
                    HStack(spacing: 4) {
                        if store.isPremium { Image(systemName: "crown.fill").font(.system(size: 11)).foregroundStyle(.white) }
                        Text(store.plan.name.uppercased())
                            .font(.system(size: 11, weight: .black))
                            .foregroundStyle(store.isPremium ? .white : DriveColor.text)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 6)
                    .background(store.isPremium ? DriveColor.gold : DriveColor.bgSoft)
                    .clipShape(.rect(cornerRadius: 8))
                    .overlay { if !store.isPremium { RoundedRectangle(cornerRadius: 8).stroke(DriveColor.border, lineWidth: 1) } }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(store.hasActiveSubscription ? "\(store.state.profile.subscription.cycle == .yearly ? "Yearly" : "Monthly")\(store.state.profile.subscription.trial ? " — free trial" : "")" : "No active subscription")
                            .font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                        Text(store.plan.incomeRange).font(.system(size: 12)).foregroundStyle(DriveColor.textDim)
                    }
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 16, weight: .bold)).foregroundStyle(DriveColor.textDim)
                        .rotationEffect(.degrees(planExpanded ? 180 : 0))
                }
            }
            .buttonStyle(.plain)

            if planExpanded {
                Divider().padding(.vertical, 12)
                if store.isPremium {
                    Button { store.cancelSubscription() } label: {
                        Text("Cancel subscription")
                            .font(.system(size: 13, weight: .bold)).foregroundStyle(DriveColor.danger)
                    }
                    .buttonStyle(.plain)
                } else {
                    GradientButton(title: "Upgrade to Premium", variant: .gold) { showPaywall = true }
                }
            }
        }
        .padding(16)
        .driveCard()
    }

    private var settingsCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "iphone.radiowaves.left.and.right")
                .font(.system(size: 16)).foregroundStyle(DriveColor.text)
                .frame(width: 32, height: 32).background(DriveColor.bgSoft).clipShape(.rect(cornerRadius: 10))
            Text("Haptics").font(.system(size: 14, weight: .bold)).foregroundStyle(DriveColor.text)
            Spacer()
            Toggle("", isOn: Binding(
                get: { store.state.profile.hapticsEnabled },
                set: { v in store.setProfile { $0.hapticsEnabled = v }; if v { Haptics.notify(.success) } }
            ))
            .labelsHidden()
            .tint(DriveColor.text)
        }
        .padding(16)
        .driveCard()
    }

    private func menuRow(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 16)).foregroundStyle(DriveColor.text)
                    .frame(width: 32, height: 32).background(DriveColor.bgSoft).clipShape(.rect(cornerRadius: 10))
                Text(label).font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 14, weight: .bold)).foregroundStyle(DriveColor.textMuted)
            }
            .padding(14)
            .driveCard()
        }
        .buttonStyle(.plain)
        .padding(.top, 8)
    }

    private func linkRow(icon: String, label: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack(spacing: 12) {
                Image(systemName: icon).font(.system(size: 16)).foregroundStyle(DriveColor.text)
                    .frame(width: 32, height: 32).background(DriveColor.bgSoft).clipShape(.rect(cornerRadius: 10))
                Text(label).font(.system(size: 15, weight: .bold)).foregroundStyle(DriveColor.text)
                Spacer()
                Image(systemName: "arrow.up.right").font(.system(size: 14, weight: .bold)).foregroundStyle(DriveColor.textMuted)
            }
            .padding(14)
            .driveCard()
        }
        .buttonStyle(.plain)
        .padding(.top, 8)
    }

    private func saveName() {
        let n = nameDraft.trimmingCharacters(in: .whitespaces)
        store.setProfile { $0.name = n.isEmpty ? "Driver" : n }
        editingName = false
    }
}
