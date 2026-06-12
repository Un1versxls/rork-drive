//
//  BusinessCatalog.swift
//  DRIVE
//
//  A large pool of business ideas split into two paths — online AI and
//  in-person hustle. Each idea carries scoring signals so we can recommend
//  the 3 best-fit ideas (always 2 Premium-locked + 1 Base) from the user's
//  onboarding answers.
//

import Foundation

/// Lightweight scoring signals used to rank an idea against the user's answers.
struct BizSignals {
    var speed: Int = 0      // good for "fast money" / earning-now intent
    var lowCost: Int = 0    // tiny startup cost (helps the money-constrained)
    var beginner: Int = 0   // friendly to total beginners
    var skill: Int = 0      // rewards people who want to learn deeply
    var scalable: Int = 0   // high ceiling — fits experienced / more time
}

struct BusinessSpec: Identifiable {
    let idea: BusinessIdea
    let signals: BizSignals
    var id: String { idea.id }
    var premium: Bool { idea.premium }
}

enum BusinessCatalog {

    // MARK: - Recommendation

    /// Returns exactly 3 ideas for the path: the 2 best-fit Premium ideas and
    /// the single best-fit Base idea, ordered Base → Premium → Premium so the
    /// free option leads and the upsells follow.
    static func recommend(
        path: BusinessPath,
        experience: ExperienceLevel?,
        time: TimeCommitment?,
        priority: Priority?,
        obstacle: Obstacle?
    ) -> [BusinessIdea] {
        let pool = specs(for: path)
        let scored = pool
            .map { ($0, score($0, experience: experience, time: time, priority: priority, obstacle: obstacle)) }
            .sorted { $0.1 > $1.1 }

        let premium = scored.filter { $0.0.premium }.prefix(2).map { $0.0.idea }
        let base = scored.first { !$0.0.premium }.map { $0.0.idea }

        var result: [BusinessIdea] = []
        if let base { result.append(base) }
        result.append(contentsOf: premium)
        // Safety: guarantee 3 items even if a pool is thin.
        if result.count < 3 {
            for s in scored.map({ $0.0.idea }) where !result.contains(where: { $0.id == s.id }) {
                result.append(s)
                if result.count == 3 { break }
            }
        }
        return Array(result.prefix(3))
    }

    private static func score(
        _ spec: BusinessSpec,
        experience: ExperienceLevel?,
        time: TimeCommitment?,
        priority: Priority?,
        obstacle: Obstacle?
    ) -> Int {
        let s = spec.signals
        var total = 1 // base so ties resolve in catalog order

        switch priority {
        case .earning: total += s.speed * 3
        case .speed: total += s.speed * 2 + s.beginner
        case .learning: total += s.skill * 3
        case .flexibility: total += s.lowCost * 2 + s.beginner
        case .none: break
        }

        switch obstacle {
        case .money: total += s.lowCost * 3
        case .time: total += s.lowCost + s.beginner
        case .confidence: total += s.beginner * 2
        case .direction: total += s.beginner
        case .accountability: total += s.beginner
        case .none: break
        }

        switch experience {
        case .beginner: total += s.beginner * 3
        case .intermediate: total += s.beginner
        case .advanced: total += s.scalable * 2
        case .expert: total += s.scalable * 3
        case .none: break
        }

        switch time {
        case .m15, .m30: total += s.lowCost + s.beginner
        case .h1, .h2: total += s.scalable * 2
        case .none: break
        }

        return total
    }

    static func specs(for path: BusinessPath) -> [BusinessSpec] {
        path == .onlineAI ? online : hustle
    }

    static func allIdeas(for path: BusinessPath) -> [BusinessIdea] {
        specs(for: path).map { $0.idea }
    }

    // MARK: - Helpers

    private static func biz(
        _ id: String, _ name: String, _ tagline: String, _ description: String,
        why: String, cost: String, time: String, milestones: [String],
        premium: Bool, path: BusinessPath, _ signals: BizSignals
    ) -> BusinessSpec {
        BusinessSpec(
            idea: BusinessIdea(
                id: id, name: name, tagline: tagline, description: description,
                whyFit: why, startupCost: cost, timeToIncome: time,
                firstMilestones: milestones, premium: premium, path: path
            ),
            signals: signals
        )
    }

    // MARK: - Online AI pool

    static let online: [BusinessSpec] = [
        biz("ai-content", "AI Content Studio", "Faceless short-form videos with AI",
            "Use AI to script, voice and edit faceless short videos for TikTok/Reels/Shorts, then earn from the creator funds and brand deals.",
            why: "No camera, tiny budget, and you can post your first video today.",
            cost: "$0 – $50", time: "2 – 4 weeks",
            milestones: ["Pick a faceless niche", "Script 3 videos with AI", "Post daily for a week", "Land first 10k views"],
            premium: false, path: .onlineAI, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 1)),

        biz("ai-trading", "AI-Assisted Trading", "Build a disciplined edge with AI tools",
            "Use AI to research setups, journal trades and backtest a strategy — risk-first. Paper trade until your edge is proven.",
            why: "The fastest-moving path for people chasing real upside — with guardrails.",
            cost: "$0 – $200", time: "Self-paced",
            milestones: ["Open a paper account", "Define strict risk rules", "Journal 10 trades", "Backtest one strategy"],
            premium: true, path: .onlineAI, BizSignals(speed: 3, lowCost: 1, beginner: 0, skill: 2, scalable: 3)),

        biz("ai-automation", "AI Automation Agency", "Sell automations to local businesses",
            "Build simple AI workflows (lead capture, follow-ups, content) and charge businesses monthly to run them.",
            why: "High-ticket retainers and AI does the heavy lifting once it's set up.",
            cost: "$50 – $300", time: "3 – 6 weeks",
            milestones: ["Pick one automation to sell", "Build a demo", "Pitch 20 local businesses", "Close first retainer"],
            premium: true, path: .onlineAI, BizSignals(speed: 2, lowCost: 1, beginner: 1, skill: 2, scalable: 3)),

        biz("ai-ugc", "AI UGC Creator", "Get paid for AI-made brand videos",
            "Brands pay for authentic product videos — now you can produce them faster with AI avatars and voiceovers.",
            why: "Low startup cost and brands constantly need fresh creatives.",
            cost: "$0 – $100", time: "2 – 4 weeks",
            milestones: ["Make 3 sample UGC clips", "Build a simple rate card", "Pitch 10 brands", "Land first paid deal"],
            premium: false, path: .onlineAI, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 1)),

        biz("ai-newsletter", "AI Newsletter", "Curate a niche audience, sell ads",
            "Use AI to research and draft a niche newsletter, grow subscribers, then monetize with sponsors and a paid tier.",
            why: "Compounds over time and an audience is an asset you own.",
            cost: "$0 – $50", time: "6 – 10 weeks",
            milestones: ["Pick a niche", "Draft 3 issues with AI", "Get first 100 subs", "Land first sponsor"],
            premium: false, path: .onlineAI, BizSignals(speed: 0, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("ai-digital", "AI Digital Products", "Sell templates, prompts & guides",
            "Package AI-made templates, prompt packs or mini-guides and sell them on autopilot through a simple storefront.",
            why: "Make it once, sell it forever — pure margin.",
            cost: "$0 – $50", time: "2 – 5 weeks",
            milestones: ["Pick a buyer & problem", "Build one product with AI", "Set up a storefront", "Make first sale"],
            premium: false, path: .onlineAI, BizSignals(speed: 1, lowCost: 2, beginner: 2, skill: 1, scalable: 2)),

        biz("ai-saas", "Micro-SaaS with AI", "Build a tiny AI tool people pay for",
            "Wrap an AI model into a narrow tool that solves one painful problem, and charge a monthly subscription.",
            why: "Recurring revenue with software margins once it clicks.",
            cost: "$50 – $400", time: "8 – 12 weeks",
            milestones: ["Validate one problem", "Build an MVP", "Get 10 beta users", "Charge your first $99/mo"],
            premium: true, path: .onlineAI, BizSignals(speed: 0, lowCost: 1, beginner: 0, skill: 3, scalable: 3)),

        biz("ai-ghostwrite", "AI Ghostwriting", "Write posts for founders with AI",
            "Use AI to draft LinkedIn/X content for busy founders, then refine it in their voice for a monthly fee.",
            why: "Clients pay well and AI makes you 3x faster.",
            cost: "$0", time: "2 – 4 weeks",
            milestones: ["Pick a platform & niche", "Write 3 sample posts", "Pitch 15 founders", "Sign first client"],
            premium: false, path: .onlineAI, BizSignals(speed: 2, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("ai-ecom", "AI-Powered Ecom", "Find & sell trending products",
            "Use AI to spot trending products, write listings and ads, then sell via a lean store or marketplace.",
            why: "Big upside if you find a winner — AI shortens the research.",
            cost: "$200 – $800", time: "4 – 8 weeks",
            milestones: ["Research 3 product ideas", "Validate demand", "Launch one listing", "Get first sale"],
            premium: true, path: .onlineAI, BizSignals(speed: 2, lowCost: 0, beginner: 0, skill: 2, scalable: 3)),

        biz("ai-leadgen", "AI Lead-Gen Agency", "Book meetings for B2B clients",
            "Run AI-assisted cold outreach that fills clients' calendars with qualified meetings on a monthly retainer.",
            why: "Premium clients pay $1.5k–$5k/mo for results.",
            cost: "$100 – $500", time: "3 – 6 weeks",
            milestones: ["Pick a niche", "Build an outreach list", "Send 100 messages", "Close first retainer"],
            premium: true, path: .onlineAI, BizSignals(speed: 2, lowCost: 1, beginner: 0, skill: 2, scalable: 3)),

        biz("ai-coach", "AI-Built Course", "Teach a skill with an AI-made course",
            "Use AI to structure and produce a mini-course on something you know, then sell seats to a small audience.",
            why: "Turn what's in your head into income that scales.",
            cost: "$0 – $100", time: "6 – 10 weeks",
            milestones: ["Pick a teachable skill", "Outline with AI", "Record a mini-course", "Sell first 5 seats"],
            premium: false, path: .onlineAI, BizSignals(speed: 0, lowCost: 2, beginner: 1, skill: 3, scalable: 2)),

        biz("ai-app", "No-Code AI App", "Ship an app without coding",
            "Use no-code + AI to build a simple app around a real need, then charge for access.",
            why: "Own a product asset without a dev team.",
            cost: "$50 – $300", time: "8 – 12 weeks",
            milestones: ["Define one core feature", "Build with no-code", "Get 10 testers", "Charge first users"],
            premium: true, path: .onlineAI, BizSignals(speed: 0, lowCost: 1, beginner: 0, skill: 3, scalable: 3)),

        biz("ai-social", "Social Media Manager", "Run socials with AI for clients",
            "Manage content calendars for small businesses, using AI to plan, draft and schedule posts.",
            why: "Every local business needs this and AI makes it scalable.",
            cost: "$0", time: "2 – 4 weeks",
            milestones: ["Build a sample calendar", "Make a simple offer", "Pitch 10 businesses", "Sign first client"],
            premium: false, path: .onlineAI, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 2)),

        biz("ai-seo", "AI SEO Content", "Rank sites with AI-assisted writing",
            "Produce AI-assisted, human-edited SEO articles for businesses that need traffic, billed per article or monthly.",
            why: "Steady demand and clear deliverables.",
            cost: "$0 – $50", time: "3 – 6 weeks",
            milestones: ["Pick a niche", "Write 2 sample articles", "Pitch 15 sites", "Land first order"],
            premium: false, path: .onlineAI, BizSignals(speed: 1, lowCost: 2, beginner: 2, skill: 2, scalable: 2)),

        biz("ai-design", "AI Design Service", "Logos, ads & thumbnails with AI",
            "Offer fast, AI-accelerated design (thumbnails, ad creatives, brand kits) to creators and small brands.",
            why: "Visual work sells and AI multiplies your output.",
            cost: "$0 – $100", time: "2 – 5 weeks",
            milestones: ["Build a mini portfolio", "Set package pricing", "Pitch 15 creators", "Deliver first order"],
            premium: false, path: .onlineAI, BizSignals(speed: 1, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("ai-chatbot", "Chatbot Builder", "Sell AI chat support to businesses",
            "Build and host AI chat assistants that answer customer questions for local and online businesses.",
            why: "One build, recurring monthly hosting fees.",
            cost: "$50 – $300", time: "4 – 8 weeks",
            milestones: ["Pick an industry", "Build a demo bot", "Pitch 20 businesses", "Close first retainer"],
            premium: true, path: .onlineAI, BizSignals(speed: 1, lowCost: 1, beginner: 0, skill: 3, scalable: 3)),

        biz("ai-affiliate", "AI Affiliate Site", "Earn commissions with AI content",
            "Build a focused review/affiliate site with AI-assisted content that earns commissions as it ranks.",
            why: "Passive upside once content compounds.",
            cost: "$50 – $150", time: "8 – 16 weeks",
            milestones: ["Pick a profitable niche", "Publish 10 articles", "Get indexed", "Earn first commission"],
            premium: false, path: .onlineAI, BizSignals(speed: 0, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("ai-video-edit", "AI Video Editing", "Edit creators' long-form with AI",
            "Offer fast turnaround editing for YouTubers and podcasters using AI to speed cuts, captions and clips.",
            why: "Creators always need editors — recurring work.",
            cost: "$0 – $100", time: "2 – 4 weeks",
            milestones: ["Edit 2 sample videos", "Set monthly pricing", "Pitch 15 creators", "Sign first client"],
            premium: false, path: .onlineAI, BizSignals(speed: 2, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("ai-voice", "AI Voiceover Studio", "Sell narration & ad reads",
            "Produce AI voiceovers for videos, ads and audiobooks, offering quick custom reads at scale.",
            why: "In-demand and fast to deliver.",
            cost: "$0 – $50", time: "2 – 5 weeks",
            milestones: ["Build a voice sample reel", "List your service", "Pitch 15 buyers", "Deliver first order"],
            premium: false, path: .onlineAI, BizSignals(speed: 1, lowCost: 2, beginner: 2, skill: 1, scalable: 1)),

        biz("ai-consult", "AI Consulting", "Help companies adopt AI",
            "Advise small businesses on which AI tools to use and set them up, charging per project or retainer.",
            why: "High value — most owners don't know where to start.",
            cost: "$0 – $200", time: "2 – 5 weeks",
            milestones: ["Define your offer", "Set premium pricing", "Reach 20 prospects", "Land first project"],
            premium: true, path: .onlineAI, BizSignals(speed: 1, lowCost: 1, beginner: 0, skill: 3, scalable: 3)),
    ]

    // MARK: - In-person hustle pool

    static let hustle: [BusinessSpec] = [
        biz("hu-pressure", "Pressure Washing", "Make driveways & decks look new",
            "Buy or rent a pressure washer and clean driveways, patios and siding — instant, visible results customers love.",
            why: "Cash in days, low skill barrier, satisfying before/afters that sell themselves.",
            cost: "$100 – $400", time: "1 – 2 weeks",
            milestones: ["Get/rent a washer", "Post before/after photos", "Door-knock 20 homes", "Book first 3 jobs"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 1, beginner: 2, skill: 1, scalable: 2)),

        biz("hu-resell", "Flip & Resell", "Buy low, sell high locally & online",
            "Source undervalued items from thrift stores and marketplaces, then resell for a margin.",
            why: "Real sales skill with tiny risk per flip and quick cash.",
            cost: "$100 – $300", time: "1 – 3 weeks",
            milestones: ["Pick a niche", "Source 5 items", "List with great photos", "Make first profit"],
            premium: true, path: .hustle, BizSignals(speed: 2, lowCost: 1, beginner: 2, skill: 2, scalable: 3)),

        biz("hu-detail", "Mobile Car Detailing", "Premium car cleaning at their door",
            "Detail cars at customers' homes — interior shampoo, wax, ceramic add-ons command premium prices.",
            why: "High margins, repeat clients and easy upsells.",
            cost: "$150 – $500", time: "1 – 3 weeks",
            milestones: ["Buy a starter kit", "Detail 2 friends' cars", "Post results locally", "Book first 3 clients"],
            premium: true, path: .hustle, BizSignals(speed: 2, lowCost: 0, beginner: 1, skill: 2, scalable: 3)),

        biz("hu-lawn", "Lawn & Yard Care", "Recurring mowing & cleanup income",
            "Mow, trim and haul for neighbors — weekly routes build predictable recurring income.",
            why: "Recurring clients mean stable cash every week.",
            cost: "$100 – $400", time: "1 – 2 weeks",
            milestones: ["Get basic equipment", "Flyer your neighborhood", "Book 3 weekly clients", "Build a route"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 1, beginner: 2, skill: 1, scalable: 2)),

        biz("hu-clean", "Local Cleaning", "Recurring home cleaning clients",
            "Residential cleaning is in constant demand with near-zero barrier — recurring weekly clients build income fast.",
            why: "Cash flow starts almost immediately and clients rebook.",
            cost: "$50 – $200", time: "1 – 2 weeks",
            milestones: ["Buy basic supplies", "Post in 3 local groups", "Book first 2 clients", "Set a schedule"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 2)),

        biz("hu-handyman", "Handyman Service", "Small fixes, steady demand",
            "Offer small home repairs and assembly — mounting TVs, furniture, fixtures. Every neighborhood needs one.",
            why: "Always in demand and you set your rates.",
            cost: "$100 – $400", time: "1 – 3 weeks",
            milestones: ["List your skills", "Set hourly pricing", "Post in local groups", "Complete first 3 jobs"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 1, beginner: 1, skill: 2, scalable: 2)),

        biz("hu-window", "Window Cleaning", "Streak-free homes & storefronts",
            "Clean windows for homes and small businesses — low cost to start, fast routes, repeat contracts.",
            why: "Cheap to start and storefronts rebook monthly.",
            cost: "$50 – $200", time: "1 – 2 weeks",
            milestones: ["Get a kit", "Practice on your home", "Pitch 15 storefronts", "Book first contract"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 2)),

        biz("hu-junk", "Junk Removal", "Haul away what people don't want",
            "Use a truck or trailer to haul junk, then resell or recycle the good stuff for extra margin.",
            why: "Strong demand and double income from reselling finds.",
            cost: "$200 – $600", time: "1 – 3 weeks",
            milestones: ["Line up a truck", "Set pricing tiers", "Post locally", "Complete first haul"],
            premium: true, path: .hustle, BizSignals(speed: 2, lowCost: 0, beginner: 1, skill: 1, scalable: 3)),

        biz("hu-pet", "Pet Sitting & Walking", "Get paid to care for pets",
            "Walk dogs and pet-sit for busy owners — flexible, low cost, and easy to rebook.",
            why: "Almost free to start and clients are loyal.",
            cost: "$0 – $50", time: "1 – 2 weeks",
            milestones: ["Make a simple profile", "Set rates", "Post in local groups", "Book first 3 clients"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 0, scalable: 1)),

        biz("hu-baby", "Babysitting / Nanny", "Trusted care for local families",
            "Offer reliable childcare to neighborhood families — referrals build a steady client base fast.",
            why: "Zero startup and word-of-mouth keeps you booked.",
            cost: "$0", time: "1 week",
            milestones: ["Ask for 2 references", "Set your rate", "Tell 10 families", "Book first job"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 0, scalable: 0)),

        biz("hu-mobilewash", "Mobile Bin Cleaning", "Sanitize trash bins on a route",
            "Clean and deodorize curbside trash bins on a recurring subscription route — niche with low competition.",
            why: "Subscription income and few competitors.",
            cost: "$200 – $700", time: "2 – 4 weeks",
            milestones: ["Build a cleaning rig", "Set monthly pricing", "Door-knock a street", "Sign 5 subscribers"],
            premium: true, path: .hustle, BizSignals(speed: 1, lowCost: 0, beginner: 1, skill: 1, scalable: 3)),

        biz("hu-snow", "Seasonal Yard Crew", "Leaf, gutter & snow cleanup",
            "Offer seasonal cleanups — leaves, gutters, driveways — when neighbors least want to do it themselves.",
            why: "Seasonal spikes mean fast, repeatable cash.",
            cost: "$50 – $300", time: "1 – 2 weeks",
            milestones: ["Get basic tools", "Flyer the block", "Book 5 cleanups", "Upsell a season plan"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 1, beginner: 2, skill: 1, scalable: 1)),

        biz("hu-mover", "Moving & Hauling Help", "Muscle for local moves",
            "Help people move furniture and haul items by the hour — book through local marketplaces.",
            why: "Steady gigs and instant cash.",
            cost: "$0 – $200", time: "1 week",
            milestones: ["List on local apps", "Set hourly rate", "Take first 3 gigs", "Collect reviews"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 0, scalable: 1)),

        biz("hu-vending", "Vending Machines", "Passive snacks & drinks income",
            "Place vending machines in high-traffic spots and restock them — semi-passive recurring income.",
            why: "Income while you sleep once machines are placed.",
            cost: "$500 – $2,000", time: "3 – 6 weeks",
            milestones: ["Find a location", "Get one machine", "Stock best-sellers", "Hit first $200 month"],
            premium: true, path: .hustle, BizSignals(speed: 0, lowCost: 0, beginner: 1, skill: 1, scalable: 3)),

        biz("hu-events", "Event Setup Crew", "Set up & tear down for events",
            "Provide setup, breakdown and staffing for parties, markets and weddings — weekend-friendly cash.",
            why: "Great fit around a busy schedule.",
            cost: "$0 – $100", time: "1 – 2 weeks",
            milestones: ["List your service", "Reach out to venues", "Book first event", "Get referrals"],
            premium: false, path: .hustle, BizSignals(speed: 1, lowCost: 2, beginner: 2, skill: 0, scalable: 1)),

        biz("hu-bake", "Home Bakery / Meal Prep", "Sell food from your kitchen",
            "Sell baked goods or meal-prep boxes to neighbors and coworkers, scaling with weekly orders.",
            why: "Turn a skill you have into weekly orders.",
            cost: "$50 – $200", time: "1 – 3 weeks",
            milestones: ["Pick a signature item", "Price a menu", "Take pre-orders", "Fulfill first batch"],
            premium: false, path: .hustle, BizSignals(speed: 1, lowCost: 2, beginner: 1, skill: 2, scalable: 2)),

        biz("hu-tutor", "Local Tutoring", "Teach what you know for cash",
            "Tutor students in a subject you're strong in — in person or hybrid, with referrals compounding.",
            why: "High hourly rate and zero startup.",
            cost: "$0", time: "1 – 2 weeks",
            milestones: ["Pick subjects", "Set hourly rate", "Post at schools/groups", "Book first student"],
            premium: false, path: .hustle, BizSignals(speed: 1, lowCost: 2, beginner: 1, skill: 2, scalable: 1)),

        biz("hu-power-detail", "Fleet & Equipment Washing", "Wash for businesses, not homes",
            "Contract with dealerships, gyms and fleets for recurring exterior cleaning — bigger tickets than homes.",
            why: "B2B contracts pay more and rebook automatically.",
            cost: "$300 – $1,000", time: "3 – 6 weeks",
            milestones: ["Build a rig", "Make a B2B pitch", "Visit 15 businesses", "Sign first contract"],
            premium: true, path: .hustle, BizSignals(speed: 1, lowCost: 0, beginner: 0, skill: 2, scalable: 3)),

        biz("hu-photo", "Local Photography", "Shoot portraits & local businesses",
            "Offer portrait, real-estate or product photography to locals, upselling editing packages.",
            why: "Creative income with strong word-of-mouth.",
            cost: "$100 – $600", time: "2 – 5 weeks",
            milestones: ["Build a mini portfolio", "Set package pricing", "Pitch 15 locals", "Book first shoot"],
            premium: false, path: .hustle, BizSignals(speed: 0, lowCost: 1, beginner: 1, skill: 3, scalable: 2)),

        biz("hu-assembly", "Furniture Assembly", "Build flat-pack for busy people",
            "Assemble furniture for homeowners and offices — simple, in-demand, and tip-friendly.",
            why: "Easy to learn and constant demand.",
            cost: "$0 – $100", time: "1 week",
            milestones: ["List your service", "Set per-item pricing", "Post locally", "Complete first 3 jobs"],
            premium: false, path: .hustle, BizSignals(speed: 2, lowCost: 2, beginner: 2, skill: 1, scalable: 1)),

        biz("hu-cleanout", "Estate & Garage Cleanouts", "Clear, sort, resell, profit",
            "Clear out garages and estates, hauling junk and reselling valuables for a double payday.",
            why: "Two income streams from one job.",
            cost: "$200 – $700", time: "2 – 4 weeks",
            milestones: ["Line up transport", "Set pricing", "Network with realtors", "Land first cleanout"],
            premium: true, path: .hustle, BizSignals(speed: 1, lowCost: 0, beginner: 1, skill: 2, scalable: 3)),
    ]
}
