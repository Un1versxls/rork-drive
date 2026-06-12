//
//  ContentView.swift
//  DRIVE
//
//  Created by Rork on June 12, 2026.
//  DRIVE — daily tasks toward a real business.
//

import SwiftUI

/// Placeholder shown until Rork replaces it with the real app UI.
/// The live entry point is `DRIVEApp` → `RootView`; this is unused at runtime.
/// This view is intentionally minimal: it must never ship as a final screen.
struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Rork is building your app…")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

#Preview {
    ContentView()
}
