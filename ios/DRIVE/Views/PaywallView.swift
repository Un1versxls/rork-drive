//
//  PaywallView.swift
//  DRIVE
//
//  Subscription paywall with plan + billing-cycle selection.
//

import SwiftUI

struct PaywallView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var fromUpgrade: Bool
    var onComplete: () -> Void

    @State private var selectedPlan: PlanId = .premium
    @State private var cycle: BillingCycle = .yearly

    private var plan: Plan { Plans.plan(selectedPlan) }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    cycleToggle
                    VStack(spacing: 12) {
                        ForEach(Plans.all) { p in
                            PlanRow(plan: p, cycle: cycle, selected: selectedPlan == p.id) {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                    selectedPlan = p.id
                                }
                            }
                        }
                    }
                    perks
                    legalLine
                }
                .padding(.horizontal, 20)
                .padding(.top, 56)
                .padding(.bottom, 180)
            }

            VStack(spacing: 10) {
                Spacer()
                VStack(spacing: 8) {
                    GradientButton(title: "Start 3-day free trial", variant: .gold) {
                        store.startSubscription(plan: selectedPlan, cycle: cycle)
                        if fromUpgrade { dismiss() } else { onComplete() }
                    }
                    Text(trialCopy)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(DriveColor.textMuted)
                        .multilineTextAlignment(.center)
                    HStack(spacing: 16) {
                        Link("Terms of Use", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                        Link("Privacy Policy", destination: URL(string: "https://rork.app/privacy")!)
                    }
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(DriveColor.textDim)
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 22)
                .background(
                    DriveColor.bg
                        .shadow(color: .black.opacity(0.06), radius: 14, x: 0, y: -6)
                        .ignoresSafeArea(edges: .bottom)
                )
            }
        }
        .overlay(alignment: .topTrailing) {
            if fromUpgrade {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(DriveColor.textDim)
                        .frame(width: 36, height: 36)
                        .background(DriveColor.bgSoft)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .padding(.top, 12)
                .padding(.trailing, 16)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "crown.fill").foregroundStyle(DriveColor.gold)
                Text("UNLOCK YOUR PLAN").sectionEyebrow()
            }
            Text("People who commit win.")
                .font(.system(size: 30, weight: .black))
                .foregroundStyle(DriveColor.text)
                .tracking(-0.6)
            Text("Get a personalized daily plan that turns your goal into real momentum.")
                .font(.system(size: 15))
                .foregroundStyle(DriveColor.textDim)
                .lineSpacing(2)
        }
    }

    private var cycleToggle: some View {
        HStack(spacing: 0) {
            ForEach([BillingCycle.yearly, BillingCycle.monthly], id: \.self) { c in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { cycle = c }
                } label: {
                    VStack(spacing: 2) {
                        Text(c == .yearly ? "Yearly" : "Monthly")
                            .font(.system(size: 14, weight: .bold))
                        if c == .yearly {
                            Text("Save \(Int(Plans.yearlySavings(plan)))")
                                .font(.system(size: 10, weight: .heavy))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .foregroundStyle(cycle == c ? .white : DriveColor.textDim)
                    .background(cycle == c ? DriveColor.text : Color.clear)
                    .clipShape(.rect(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(DriveColor.bgSoft)
        .clipShape(.rect(cornerRadius: 14))
    }

    private var perks: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(plan.perks, id: \.self) { perk in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(DriveColor.gold)
                    Text(perk)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(DriveColor.text)
                }
            }
        }
        .padding(.top, 4)
    }

    private var legalLine: some View {
        Text("\(plan.name) — \(cycle == .yearly ? "yearly" : "monthly"), $\(String(format: "%.2f", cycle == .yearly ? plan.yearlyPrice : plan.monthlyPrice))/\(cycle == .yearly ? "yr" : "mo"). Auto-renews until cancelled.")
            .font(.system(size: 11))
            .foregroundStyle(DriveColor.textMuted)
            .padding(.top, 4)
    }

    private var trialCopy: String {
        let price = cycle == .yearly ? plan.yearlyPrice : plan.monthlyPrice
        return "3 days free, then $\(String(format: "%.2f", price))/\(cycle == .yearly ? "year" : "month"). Cancel anytime."
    }
}

private struct PlanRow: View {
    let plan: Plan
    let cycle: BillingCycle
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: plan.id == .premium ? "sparkles" : "crown")
                        .font(.system(size: 14))
                        .foregroundStyle(plan.id == .premium ? DriveColor.gold : DriveColor.textDim)
                    Text(plan.name)
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(DriveColor.text)
                    if plan.recommended {
                        Text("POPULAR")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7).padding(.vertical, 3)
                            .background(DriveColor.gold)
                            .clipShape(Capsule())
                    }
                    Spacer()
                    ZStack {
                        Circle().strokeBorder(selected ? DriveColor.gold : DriveColor.border, lineWidth: 2).frame(width: 22, height: 22)
                        if selected { Circle().fill(DriveColor.gold).frame(width: 12, height: 12) }
                    }
                }
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("$\(String(format: "%.2f", Plans.monthlyEquivalent(plan, cycle: cycle)))")
                        .font(.system(size: 24, weight: .black))
                        .foregroundStyle(DriveColor.text)
                    Text("/mo")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(DriveColor.textDim)
                }
                Text(plan.incomeRange)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(DriveColor.textDim)
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
