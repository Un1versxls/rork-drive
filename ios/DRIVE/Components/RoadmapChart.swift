//
//  RoadmapChart.swift
//  DRIVE
//
//  A milestone curve showing the journey from today to the final goal.
//  Cal AI–style entrance: the panel slides in from the side, the golden
//  line draws left → right, then the dots pop in one-by-one and the next
//  uncompleted milestone auto-expands. Tapping anywhere off a dot dismisses.
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
    /// Milestone to auto-expand once the entrance finishes (next uncompleted).
    var autoSelectIndex: Int? = nil
    @Binding var selected: Int?

    private let height: CGFloat = 180

    // Entrance animation state
    @State private var enterX: CGFloat = -34
    @State private var enterOpacity: Double = 0
    @State private var drawTo: CGFloat = 0
    @State private var dotsVisible = false
    @State private var finalVisible = false
    @State private var userTapped = false

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = height

            ZStack(alignment: .topLeading) {
                // Tap-off layer — dismisses the selected callout.
                Rectangle()
                    .fill(Color.clear)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        userTapped = true
                        withAnimation(.easeOut(duration: 0.18)) { selected = nil }
                    }

                // Faint baseline guide
                curvePath(w: w, h: h)
                    .stroke(DriveColor.border, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .opacity(0.5)

                // The golden curve, drawing left → right
                curvePath(w: w, h: h)
                    .trim(from: 0, to: drawTo)
                    .stroke(
                        LinearGradient(colors: [DriveColor.accentSoft, DriveColor.gold], startPoint: .leading, endPoint: .trailing),
                        style: StrokeStyle(lineWidth: 3, lineCap: .round)
                    )

                // Progress fill up to YOU marker (revealed with the draw)
                curvePath(w: w, h: h)
                    .trim(from: 0, to: min(drawTo, youProgress))
                    .stroke(DriveColor.gold, style: StrokeStyle(lineWidth: 4, lineCap: .round))

                // Milestone dots
                ForEach(Array(milestones.enumerated()), id: \.offset) { idx, m in
                    let pt = point(for: m.progress, w: w, h: h)
                    Button {
                        Haptics.selection()
                        userTapped = true
                        withAnimation(.spring(response: 0.32, dampingFraction: 0.7)) {
                            selected = (selected == idx) ? nil : idx
                        }
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
                        .shadow(color: DriveColor.gold.opacity(0.5), radius: selected == idx ? 6 : 0)
                    }
                    .buttonStyle(.plain)
                    .scaleEffect(dotsVisible ? 1 : 0.1)
                    .opacity(dotsVisible ? 1 : 0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.6).delay(Double(idx) * 0.12), value: dotsVisible)
                    .position(x: pt.x, y: pt.y)

                    Text("Day \(max(1, m.day))")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(DriveColor.textDim)
                        .opacity(dotsVisible ? 1 : 0)
                        .animation(.easeOut(duration: 0.3).delay(Double(idx) * 0.12 + 0.1), value: dotsVisible)
                        .position(x: pt.x, y: pt.y + 18)
                }

                // "More info" soft callout near the selected dot, nudged
                // toward the middle of the roadmap.
                if let sel = selected, sel < milestones.count, dotsVisible {
                    let dotPt = point(for: milestones[sel].progress, w: w, h: h)
                    let mid = CGPoint(x: w / 2, y: h / 2)
                    let dx = mid.x - dotPt.x
                    let dy = mid.y - dotPt.y
                    let len = max(1, sqrt(dx*dx + dy*dy))
                    let calloutPt = CGPoint(x: dotPt.x + dx / len * 44, y: dotPt.y + dy / len * 40)
                    VStack(spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "info.circle.fill").font(.system(size: 9, weight: .bold))
                            Text("MORE INFO").font(.system(size: 9, weight: .black)).tracking(0.8)
                        }
                        .foregroundStyle(DriveColor.accentDeep)
                        Text(milestones[sel].label)
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(DriveColor.text)
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(DriveColor.bg)
                    .clipShape(.rect(cornerRadius: 10))
                    .overlay { RoundedRectangle(cornerRadius: 10).stroke(DriveColor.borderStrong, lineWidth: 1) }
                    .shadow(color: DriveColor.gold.opacity(0.25), radius: 8, x: 0, y: 3)
                    .fixedSize()
                    .position(x: calloutPt.x, y: calloutPt.y)
                    .transition(.scale(scale: 0.7).combined(with: .opacity))
                    .allowsHitTesting(false)
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
                .opacity(drawTo > 0.05 ? 1 : 0)
                .position(x: youPt.x, y: youPt.y - 18)

                // Final flag
                let endPt = point(for: 1, w: w, h: h)
                Image(systemName: "flag.checkered")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(DriveColor.accentDeep)
                    .scaleEffect(finalVisible ? 1 : 0.2)
                    .opacity(finalVisible ? 1 : 0)
                    .animation(.spring(response: 0.4, dampingFraction: 0.6), value: finalVisible)
                    .position(x: endPt.x - 6, y: endPt.y - 18)
            }
            .offset(x: enterX)
            .opacity(enterOpacity)
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
            .animation(.easeInOut(duration: 0.2), value: selected)
        }
        .onAppear(perform: runEntrance)
    }

    private func runEntrance() {
        // 1) Panel slides in from the side.
        withAnimation(.easeOut(duration: 0.55)) {
            enterX = 0
            enterOpacity = 1
        }
        // 2) Line draws left → right.
        withAnimation(.easeInOut(duration: 1.1).delay(0.16)) {
            drawTo = 1
        }
        // 3) Dots pop in after the line is complete.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.15) {
            dotsVisible = true
        }
        // 4) Final flag after the dots.
        let dotsDone = 1.15 + Double(milestones.count) * 0.12 + 0.1
        DispatchQueue.main.asyncAfter(deadline: .now() + dotsDone) {
            finalVisible = true
        }
        // 5) Auto-expand the next uncompleted milestone.
        if let auto = autoSelectIndex, auto >= 0, auto < milestones.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + dotsDone + 0.25) {
                if !userTapped {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) { selected = auto }
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
