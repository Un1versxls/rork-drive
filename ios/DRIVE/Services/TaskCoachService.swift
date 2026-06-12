//
//  TaskCoachService.swift
//  DRIVE
//
//  Talks to the Rork AI proxy (OpenAI-compatible) to power the per-task
//  Coach. The coach ONLY explains the current task and may sketch outlines —
//  it never produces finished deliverables for the user.
//

import Foundation

struct CoachMessage: Identifiable, Equatable {
    enum Role { case coach, user }
    let id = UUID()
    let role: Role
    let text: String
}

enum CoachServiceError: LocalizedError {
    case notConfigured
    case auth
    case rateLimited
    case server(Int)

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "The Coach is unavailable right now."
        case .auth: return "The Coach is unavailable. Please restart the app."
        case .rateLimited: return "Slow down a sec, then ask again."
        case .server: return "Something went wrong. Try asking again."
        }
    }
}

@MainActor
enum TaskCoachService {
    private static let model = "anthropic/claude-haiku-4.5"

    private static let systemPrompt = """
    You are DRIVE Coach. You ONLY answer the user's questions ABOUT their current task — what it means, why it matters, how a step might look, examples to understand it, or how it fits their business.

    STRICT RULES — never break these:
    - You may explain concepts, define terms, give context, and provide high-level OUTLINES or frameworks (e.g. "an outline usually has 3 parts: ...").
    - You NEVER do the finished work for the user. Never write the actual content, copy, code, captions, scripts, drafts, taglines, names, emails, or any deliverable they could paste and use directly.
    - If the user asks you to produce a deliverable, refuse politely in ONE short sentence and offer to outline the approach instead. Example: "I can't write that for you — but I can outline how to structure it. Want that?"
    - If the user asks something unrelated to the current task, steer back to the task.
    - Stay warm, plain, and short (1-3 sentences max). No markdown, no headings.
    """

    static func ask(history: [CoachMessage], taskTitle: String, taskDescription: String, businessName: String?) async throws -> String {
        let toolkitURL = Config.EXPO_PUBLIC_TOOLKIT_URL
        let secret = Config.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY
        guard !toolkitURL.isEmpty, !secret.isEmpty,
              let url = URL(string: "\(toolkitURL)/v2/vercel/v1/chat/completions") else {
            throw CoachServiceError.notConfigured
        }

        let context = "Context (do not repeat back): current task is \"\(taskTitle)\" — \(taskDescription). Business: \(businessName ?? "none"). Only help the user understand THIS task. You may give outlines, never the finished deliverable."

        var messages: [[String: String]] = [
            ["role": "system", "content": systemPrompt],
            ["role": "user", "content": context],
            ["role": "assistant", "content": "Understood — I'll explain and outline, but never do the work for them."],
        ]
        for m in history {
            messages.append(["role": m.role == .coach ? "assistant" : "user", "content": m.text])
        }

        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 220,
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(secret)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw CoachServiceError.server(-1) }
        switch http.statusCode {
        case 200: break
        case 401, 403: throw CoachServiceError.auth
        case 429: throw CoachServiceError.rateLimited
        default: throw CoachServiceError.server(http.statusCode)
        }

        let decoded = try JSONDecoder().decode(ChatCompletion.self, from: data)
        let text = decoded.choices.first?.message.content?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let text, !text.isEmpty else {
            return "What part of this task would you like me to explain?"
        }
        return text
    }
}

private struct ChatCompletion: Decodable {
    struct Choice: Decodable {
        struct Message: Decodable { let content: String? }
        let message: Message
    }
    let choices: [Choice]
}
