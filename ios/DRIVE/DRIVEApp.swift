//
//  DRIVEApp.swift
//  DRIVE
//
//  Created by Rork on June 12, 2026.
//

import SwiftUI

@main
struct DRIVEApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .preferredColorScheme(.light)
        }
    }
}
