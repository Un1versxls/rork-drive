//
//  BadgesView.swift
//  DRIVE
//

import SwiftUI

struct BadgesView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    private var unlockedCount: Int { Badges.all.filter { store.isBadgeUnlocked($0.id) }.count }

    var body: some View {
        ZStack {
            DriveColor.bg.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(unlockedCount) of \(Badges.all.count) unlocked")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(DriveColor.textDim)
                        .padding(.top, 4)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(DriveColor.border).frame(height: 8)
                            Capsule().fill(DriveColor.gold)
                                .frame(width: geo.size.width * CGFloat(unlockedCount) / CGFloat(Badges.all.count), height: 8)
                        }
                    }
                    .frame(height: 8)
                    .padding(.top, 10)

                    LazyVGrid(columns: columns, spacing: 12) {
                        ForEach(Badges.all) { badge in
                            BadgeTile(badge: badge, unlocked: store.isBadgeUnlocked(badge.id))
                        }
                    }
                    .padding(.top, 20)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Badges")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Done") { dismiss() }
                    .foregroundStyle(DriveColor.text)
            }
        }
    }
}

private struct BadgeTile: View {
    let badge: Badge
    let unlocked: Bool

    var body: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(unlocked ? AnyShapeStyle(LinearGradient(colors: [DriveColor.gold, DriveColor.accentDark], startPoint: .top, endPoint: .bottom)) : AnyShapeStyle(DriveColor.bgSoft))
                    .frame(width: 60, height: 60)
                Image(systemName: unlocked ? badge.icon : "lock.fill")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(unlocked ? .white : DriveColor.textMuted)
            }
            Text(badge.title)
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(unlocked ? DriveColor.text : DriveColor.textMuted)
                .multilineTextAlignment(.center)
            Text(badge.description)
                .font(.system(size: 11))
                .foregroundStyle(DriveColor.textDim)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .padding(.horizontal, 8)
        .background(unlocked ? DriveColor.bg : DriveColor.bgSoft)
        .clipShape(.rect(cornerRadius: 18))
        .overlay {
            RoundedRectangle(cornerRadius: 18)
                .stroke(unlocked ? DriveColor.borderStrong : DriveColor.border, lineWidth: 1)
        }
    }
}
