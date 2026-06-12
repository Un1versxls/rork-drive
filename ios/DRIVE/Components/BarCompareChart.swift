//
//  BarCompareChart.swift
//  DRIVE
//
//  Clean vertical bar chart contrasting "on your own", "other apps", and
//  "with DRIVE". Bars grow up from the baseline in a quick staggered
//  sequence; the highlighted bar gets a golden gradient + glow.
//

import SwiftUI

struct BarDatum: Identifiable {
    let id = UUID()
    let label: String
    let value: Double      // 0...1 relative height
    let caption: String
    var highlight: Bool = false
}

struct BarCompareChart: View {
    let bars: [BarDatum]
    var maxHeight: CGFloat = 170

    @State private var grown = false

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .bottom, spacing: 14) {
                ForEach(Array(bars.enumerated()), id: \.element.id) { idx, b in
                    VStack(spacing: 8) {
                        Text(b.caption)
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(b.highlight ? DriveColor.accentDeep : DriveColor.text)
                            .opacity(grown ? 1 : 0)

                        RoundedRectangle(cornerRadius: 12)
                            .fill(barFill(b))
                            .frame(height: grown ? max(10, CGFloat(b.value) * maxHeight) : 6)
                            .shadow(color: b.highlight ? DriveColor.gold.opacity(0.4) : .clear, radius: 10, x: 0, y: 4)
                            .animation(.spring(response: 0.6, dampingFraction: 0.75).delay(Double(idx) * 0.13), value: grown)

                        Text(b.label)
                            .font(.system(size: 12, weight: b.highlight ? .black : .semibold))
                            .foregroundStyle(b.highlight ? DriveColor.accentDeep : DriveColor.textDim)
                            .multilineTextAlignment(.center)
                            .frame(height: 32, alignment: .top)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: maxHeight + 60, alignment: .bottom)

            Rectangle()
                .fill(DriveColor.border)
                .frame(height: 2)
        }
        .onAppear { grown = true }
    }

    private func barFill(_ b: BarDatum) -> AnyShapeStyle {
        if b.highlight {
            return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0xF4D77A), DriveColor.gold, Color(hex: 0xB8860B)], startPoint: .top, endPoint: .bottom))
        }
        return AnyShapeStyle(Color(hex: 0xE8E6E0))
    }
}
