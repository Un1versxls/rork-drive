//
//  SupabaseService.swift
//  DRIVE
//
//  Connects the native app to the same Supabase backend the Expo app uses.
//  Handles email-code (OTP) auth via the send-otp / verify-otp edge functions
//  and syncs the full app state to the `app_users` table (state_blob) so a
//  user's tasks, progress, email and subscription survive reinstalls and
//  move across devices.
//

import Foundation

enum SupabaseError: LocalizedError {
    case notConfigured
    case network
    case server(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Sign-in is unavailable right now."
        case .network: return "No connection. Check your internet and try again."
        case .server(let m): return m
        }
    }
}

/// A trimmed view of the `app_users` row we care about on iOS.
struct AppUserRow {
    let email: String?
    let name: String?
    let subscriptionActive: Bool?
    let subscriptionPlan: String?
    let subscriptionExpiresAt: Date?
    let trialEndsAt: Date?
    let stateBlob: AppState?

    /// True if the cloud row points to an active paid plan / trial right now.
    var isSubscriptionActive: Bool {
        if subscriptionActive == true { return true }
        let now = Date()
        if let t = trialEndsAt, t > now { return true }
        if let e = subscriptionExpiresAt, e > now { return true }
        return false
    }

    /// True if there's any subscription history (so we can say "expired").
    var hasSubscriptionHistory: Bool {
        subscriptionActive != nil || subscriptionPlan != nil || subscriptionExpiresAt != nil || trialEndsAt != nil
    }
}

@MainActor
enum SupabaseService {
    // Public anon credentials (safe to embed). The native app always talks to
    // this Supabase project. We only honor a build-injected value if it points
    // at the same project, so an unrelated env value can never repoint the app.
    private static let projectRef = "ndoihidkznqdlacpiura"
    private static let defaultURL = "https://ndoihidkznqdlacpiura.supabase.co"
    private static let defaultAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kb2loaWRrem5xZGxhY3BpdXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NDkyOTMsImV4cCI6MjA5MjIyNTI5M30.Oc7pgUEkB2Tw0mc3A7a0ih1UpiNHLpufmuNqaqnf_bE"

    private static var baseURL: String {
        let v = Config.EXPO_PUBLIC_SUPABASE_URL
        return v.contains(projectRef) ? v : defaultURL
    }
    private static var anonKey: String {
        let v = Config.EXPO_PUBLIC_SUPABASE_ANON_KEY
        return v.contains(projectRef) ? v : defaultAnonKey
    }

    static var isConfigured: Bool { !baseURL.isEmpty && !anonKey.isEmpty }

    private static let iso = ISO8601DateFormatter()

    // MARK: - OTP auth

    static func sendOTP(email: String) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        let _: EmptyOK = try await callFunction("send-otp", body: ["email": clean])
    }

    /// Creates an account directly from name + email + password — no email code.
    static func signUp(email: String, name: String, password: String) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        let body: [String: String] = [
            "email": clean,
            "name": name.trimmingCharacters(in: .whitespaces),
            "password": password,
        ]
        let _: EmptyOK = try await callFunction("signup", body: body)
    }

    /// Verifies the 6-digit code. When `password` is supplied, the account
    /// password is set server-side in the same call (only after the email is
    /// proven via the code).
    static func verifyOTP(email: String, code: String, password: String? = nil) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        var body: [String: String] = ["email": clean, "code": code]
        if let password, !password.isEmpty { body["password"] = password }
        let _: EmptyOK = try await callFunction("verify-otp", body: body)
    }

    /// Verifies an existing account's email + password for sign-in.
    static func verifyPassword(email: String, password: String) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        let _: EmptyOK = try await callFunction("verify-password", body: ["email": clean, "password": password])
    }

    // MARK: - Supabase Auth (GoTrue)

    /// Signs in against Supabase's built-in Auth — the accounts that appear under
    /// Authentication → Users in the dashboard. This is where existing users
    /// (created by the web/Expo app) actually live. Throws on bad credentials.
    static func authSignIn(email: String, password: String) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        guard isConfigured, let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password") else {
            throw SupabaseError.notConfigured
        }
        try await postAuth(url: url, body: ["email": clean, "password": password])
    }

    /// Creates an account in Supabase Auth (same store the web app uses), so
    /// native sign-ups and web sign-ups share one identity per email.
    static func authSignUp(email: String, name: String, password: String) async throws {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        guard isConfigured, let url = URL(string: "\(baseURL)/auth/v1/signup") else {
            throw SupabaseError.notConfigured
        }
        let body: [String: Any] = [
            "email": clean,
            "password": password,
            "data": ["name": name.trimmingCharacters(in: .whitespaces)],
        ]
        try await postAuth(url: url, body: body)
    }

    private struct AuthErrorBody: Decodable {
        let error_description: String?
        let msg: String?
        let error: String?
        var message: String? { error_description ?? msg ?? error }
    }

    private static func postAuth(url: URL, body: [String: Any]) async throws {
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        req.timeoutInterval = 25

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else { throw SupabaseError.network }
            if (200...299).contains(http.statusCode) { return }
            if let e = try? JSONDecoder().decode(AuthErrorBody.self, from: data), let m = e.message {
                throw SupabaseError.server(friendlyAuthMessage(m))
            }
            throw SupabaseError.server("Couldn't sign you in. Try again.")
        } catch let e as SupabaseError {
            throw e
        } catch {
            throw SupabaseError.network
        }
    }

    private static func friendlyAuthMessage(_ raw: String) -> String {
        let lower = raw.lowercased()
        if lower.contains("invalid login") || lower.contains("invalid_grant") || lower.contains("invalid credentials") {
            return "Incorrect email or password."
        }
        if lower.contains("email not confirmed") {
            return "Please confirm your email, then sign in."
        }
        if lower.contains("already registered") || lower.contains("already been registered") || lower.contains("user already") {
            return "An account already exists for this email. Sign in instead."
        }
        if lower.contains("password") && lower.contains("least") {
            return "Password must be at least 6 characters."
        }
        return raw
    }

    private struct EmptyOK: Decodable { let ok: Bool? }
    private struct FnError: Decodable { let error: String? }

    private static func callFunction<T: Decodable>(_ name: String, body: [String: String]) async throws -> T {
        guard isConfigured, let url = URL(string: "\(baseURL)/functions/v1/\(name)") else {
            throw SupabaseError.notConfigured
        }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        req.timeoutInterval = 25

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else { throw SupabaseError.network }
            if http.statusCode == 200 {
                return (try? JSONDecoder().decode(T.self, from: data)) ?? (EmptyOK(ok: true) as! T)
            }
            if let fn = try? JSONDecoder().decode(FnError.self, from: data), let msg = fn.error {
                throw SupabaseError.server(msg)
            }
            throw SupabaseError.server("Something went wrong. Try again.")
        } catch let e as SupabaseError {
            throw e
        } catch {
            throw SupabaseError.network
        }
    }

    // MARK: - app_users fetch

    static func fetchUser(email: String) async -> AppUserRow? {
        let clean = email.trimmingCharacters(in: .whitespaces).lowercased()
        guard isConfigured, !clean.isEmpty,
              let encoded = clean.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "\(baseURL)/rest/v1/app_users?email=eq.\(encoded)&select=email,name,subscription_active,subscription_plan,subscription_expires_at,trial_ends_at,state_blob&limit=1")
        else { return nil }

        var req = URLRequest(url: url)
        req.httpMethod = "GET"
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.timeoutInterval = 20

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]],
                  let row = arr.first
            else { return nil }
            return parseRow(row)
        } catch {
            print("[supabase] fetchUser error \(error)")
            return nil
        }
    }

    private static func parseRow(_ row: [String: Any]) -> AppUserRow {
        var blob: AppState? = nil
        if let blobObj = row["state_blob"], !(blobObj is NSNull),
           let blobData = try? JSONSerialization.data(withJSONObject: blobObj) {
            blob = try? JSONDecoder().decode(AppState.self, from: blobData)
        }
        func date(_ key: String) -> Date? {
            guard let s = row[key] as? String else { return nil }
            return iso.date(from: s) ?? ISO8601DateFormatter.withFractional.date(from: s)
        }
        return AppUserRow(
            email: row["email"] as? String,
            name: row["name"] as? String,
            subscriptionActive: row["subscription_active"] as? Bool,
            subscriptionPlan: row["subscription_plan"] as? String,
            subscriptionExpiresAt: date("subscription_expires_at"),
            trialEndsAt: date("trial_ends_at"),
            stateBlob: blob
        )
    }

    // MARK: - app_users upsert

    /// Pushes the current state to the cloud, keyed by email. No-op if there's
    /// no email yet (anonymous, pre-claim users stay local until they claim).
    @discardableResult
    static func upsert(state: AppState, email: String?) async -> Bool {
        let clean = (email ?? state.profile.email ?? "").trimmingCharacters(in: .whitespaces).lowercased()
        guard isConfigured, !clean.isEmpty else { return false }

        var payload: [String: Any] = [
            "email": clean,
            "name": state.profile.name,
            "auth_provider": "email",
            "onboarded": state.onboarded,
            "points": state.points,
            "streak": state.streak,
            "best_streak": state.bestStreak,
            "updated_at": iso.string(from: Date()),
            "last_seen_at": iso.string(from: Date()),
            "last_migrated_at": iso.string(from: Date()),
            "platform": "ios",
            "app_version": AppInfo.versionLabel,
        ]
        if let last = state.lastActiveDate { payload["last_active_date"] = last }

        let sub = state.profile.subscription
        payload["subscription_plan"] = sub.plan.rawValue
        payload["subscription_cycle"] = sub.cycle.rawValue
        payload["subscription_active"] = sub.active
        payload["subscription_trial"] = sub.trial
        if let started = sub.startedAt { payload["subscription_started_at"] = iso.string(from: started) }
        if let expires = sub.expiresAt { payload["subscription_expires_at"] = iso.string(from: expires) }

        if let biz = state.profile.business {
            payload["business_id"] = biz.id
            payload["business_name"] = biz.name
            payload["business_tagline"] = biz.tagline
        }
        if let goal = state.profile.goal { payload["goal"] = goal.rawValue }
        if let exp = state.profile.experience { payload["experience"] = exp.rawValue }

        // The full state, as jsonb.
        if let blobData = try? JSONEncoder().encode(state),
           let blobObj = try? JSONSerialization.jsonObject(with: blobData) {
            payload["state_blob"] = blobObj
        }

        return await writeUpsert(payload: payload, email: clean)
    }

    /// Sends the upsert, retrying once without `state_blob` if the schema
    /// rejects it (older projects), so the rest of the sync still lands.
    private static func writeUpsert(payload: [String: Any], email: String) async -> Bool {
        if await postUpsert(payload) { return true }
        var fallback = payload
        fallback.removeValue(forKey: "state_blob")
        return await postUpsert(fallback)
    }

    private static func postUpsert(_ payload: [String: Any]) async -> Bool {
        guard let url = URL(string: "\(baseURL)/rest/v1/app_users?on_conflict=email"),
              let body = try? JSONSerialization.data(withJSONObject: payload)
        else { return false }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        req.setValue(anonKey, forHTTPHeaderField: "apikey")
        req.setValue("resolution=merge-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        req.httpBody = body
        req.timeoutInterval = 25

        do {
            let (_, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse else { return false }
            if (200...299).contains(http.statusCode) { return true }
            print("[supabase] upsert status \(http.statusCode)")
            return false
        } catch {
            print("[supabase] upsert error \(error)")
            return false
        }
    }
}

extension ISO8601DateFormatter {
    static let withFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
