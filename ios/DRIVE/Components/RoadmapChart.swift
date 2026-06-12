//
//  RoadmapChart.swift
//  DRIVE
//
//  A milestone curve showing the journey from today to the final goal.
//

import SwiftUI

struct RoadmapMilestone: Identifiable {
    let id = UUID()
    let day: Int
    let label: String
    let progress: Double   // 0...1 along the curve
}

struct RoadmapChart: View {
    let milestones: [RoadmapMilestone]
    let finalLabel: String
    let youProgress: Double
    let daysOnAccount: Int
    @Binding var selected: Int?

    private let height: CGFloat = 180

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = height

            ZStack(alignment: .topLeading) {
                // The curve
                curvePath(w: w, h: h)
                    .stroke(
                        LinearGradient(colors: [DriveColor.accentSoft, DriveColor.gold], startPoint: .leading, endPoint: .trailing),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )

                // Progress fill up to YOU marker
                curvePath(w: w, h: h)
                    .trim(from: 0, to: youProgress)
                    .stroke(DriveColor.gold, style: StrokeStyle(lineWidth: 4, lineCap: .round))

                // Milestone dots
                ForEach(Array(milestones.enumerated()), id: \.offset) { idx, m in
                    let pt = point(for: m.progress, w: w, h: h)
                    Button {
                        Haptics.selection()
                        selected = (selected == idx) ? nil : idx
                    } label: {
                        ZStack {
                            Circle()
                                .fill(DriveColor.bg)
                                .frame(width: 18, height: 18)
                                .overlay(Circle().stroke(DriveColor.gold, lineWidth: 3))
                            if selected == idx {
                                Circle().fill(DriveColor.gold).frame(width: 8, height: 8)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                    .position(x: pt.x, y: pt.y)

                    Text("Day \(max(1, m.day))")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(DriveColor.textDim)
                        .position(x: pt.x, y: pt.y + 18)
                }

                // YOU marker
                let youPt = point(for: youProgress, w: w, h: h)
                VStack(spacing: 2) {
                    Text("YOU")
                        .font(.system(size: 9, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(DriveColor.text)
                        .clipShape(.rect(cornerRadius: 6))
                    Circle().fill(DriveColor.text).frame(width: 12, height: 12)
                }
                .position(x: youPt.x, y: youPt.y - 18)

                // Final flag
                let endPt = point(for: 1, w: w, h: h)
                Image(systemName: "flag.checkered")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(DriveColor.accentDeep)
                    .position(x: endPt.x - 6, y: endPt.y - 18)
            }
        }
        .frame(height: height + 30)
        .overlay(alignment: .bottomLeading) {
            VStack(alignment: .leading, spacing: 2) {
                if let sel = selected, sel < milestones.count {
                    Text(milestones[sel].label)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(DriveColor.text)
                    Text("~\(max(1, milestones[sel].day)) days in")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(DriveColor.textDim)
                } else {
                    Text("Day \(daysOnAccount) of your journey")
                        .font(.system(size: 12, weight: .heavy))
                        .foregroundStyle(DriveColor.accentDeep)
                }
            }
        }
    }

    private func curvePath(w: CGFloat, h: CGFloat) -> Path {
        var p = Path()
        let start = CGPoint(x: 6, y: h - 16)
        p.move(to: start)
        let c1 = CGPoint(x: w * 0.35, y: h - 8)
        let c2 = CGPoint(x: w * 0.62, y: 28)
        let end = CGPoint(x: w - 10, y: 20)
        p.addCurve(to: end, control1: c1, control2: c2)
        return p
    }

    /// Approximate a point along the cubic curve for parameter t (0...1).
    private func point(for t: Double, w: CGFloat, h: CGFloat) -> CGPoint {
        let p0 = CGPoint(x: 6, y: h - 16)
        let p1 = CGPoint(x: w * 0.35, y: h - 8)
        let p2 = CGPoint(x: w * 0.62, y: 28)
        let p3 = CGPoint(x: w - 10, y: 20)
        let mt = 1 - t
        let x = mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x
        let y = mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y
        return CGPoint(x: x, y: y)
    }
}
