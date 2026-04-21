-- Seed the DRIVE business/routine/skill library with all known entries so far.
-- You can edit, deactivate, or remove any row from the Supabase Table Editor.

insert into public.business_library (
  id, name, category, tagline, description, why_fit,
  startup_cost, time_to_income, first_milestones, task_pool,
  matching_goals, matching_experience, difficulty, active
) values
-- ============== BUSINESSES ==============
(
  'local-boost-studio',
  'Local Boost Studio',
  'business',
  'Done-for-you marketing for local shops',
  'A service that runs Instagram, Google, and email for small local businesses. You handle content + ads while owners focus on operations.',
  'Low startup cost, high demand in every city, fits around your schedule.',
  '$0–$200',
  '2–4 weeks',
  '["Pick a niche (gyms, cafes, salons)","Build a 1-page portfolio site","Pitch 20 local businesses","Land first paying client"]'::jsonb,
  '[
    {"title":"List 10 local niches","description":"Write down 10 local business types you''d enjoy serving.","category":"focus","difficulty":1},
    {"title":"Pitch 5 local shops","description":"Send personalized DMs or emails offering a free audit.","category":"hustle","difficulty":2},
    {"title":"Build a 1-page site","description":"Use Carrd or Framer and publish a simple portfolio page.","category":"skill","difficulty":2},
    {"title":"Write 3 offer bullets","description":"Outline exactly what clients get and the price.","category":"growth","difficulty":1},
    {"title":"Post one case-study idea","description":"Share a before/after or mini strategy on LinkedIn.","category":"growth","difficulty":2},
    {"title":"Follow up with warm leads","description":"Re-message anyone who showed interest.","category":"hustle","difficulty":1}
  ]'::jsonb,
  array['earn_income','grow_business'],
  array['beginner','intermediate'],
  2,
  true
),
(
  'skill-shorts',
  'Skill Shorts',
  'business',
  'Teach one skill in 60-second videos',
  'Short-form content channel focused on one teachable skill. Monetize through ads, sponsors, and a small digital product.',
  'Plays to the time you have and compounds over months.',
  '$0–$100',
  '6–12 weeks',
  '["Choose your skill niche","Record 10 shorts","Post daily for 30 days","Launch a $9 digital guide"]'::jsonb,
  '[
    {"title":"Record 1 short video","description":"60 seconds teaching one thing in your skill niche.","category":"skill","difficulty":2},
    {"title":"Write 5 hook ideas","description":"Draft 5 punchy opening lines for future shorts.","category":"growth","difficulty":1},
    {"title":"Engage with 10 creators","description":"Leave thoughtful comments on bigger accounts.","category":"growth","difficulty":1},
    {"title":"Study 3 viral posts","description":"Note structure, hook, and pacing.","category":"skill","difficulty":2},
    {"title":"Plan tomorrow''s script","description":"One hook, one lesson, one call to action.","category":"focus","difficulty":1},
    {"title":"Outline a $9 guide","description":"5 section headings for your first digital product.","category":"hustle","difficulty":3}
  ]'::jsonb,
  array['earn_income','build_skills'],
  array['beginner','intermediate'],
  2,
  true
),
(
  'clean-crew-concierge',
  'Clean Crew Concierge',
  'business',
  'Premium cleaning for busy professionals',
  'High-end recurring cleaning service booked online. Start solo, then subcontract as demand grows.',
  'Cash-flow fast and doesn''t require expertise to start.',
  '$100–$400',
  '1–2 weeks',
  '["Buy supplies + insurance","Build a Square booking page","Flyer 3 affluent zip codes","Book first 3 recurring clients"]'::jsonb,
  '[
    {"title":"Research local pricing","description":"Check 5 competitors and note their offers.","category":"focus","difficulty":1},
    {"title":"Set up booking page","description":"Use Square or Jobber to accept first bookings.","category":"skill","difficulty":2},
    {"title":"Design a flyer","description":"Make a clean postcard in Canva.","category":"skill","difficulty":1},
    {"title":"Door-knock 20 homes","description":"Hand out flyers in a target neighborhood.","category":"hustle","difficulty":3},
    {"title":"Ask for a referral","description":"Message one past client or friend for a warm intro.","category":"hustle","difficulty":1},
    {"title":"Post on Nextdoor","description":"Introduce your service in your local community.","category":"growth","difficulty":1}
  ]'::jsonb,
  array['earn_income','grow_business'],
  array['beginner'],
  2,
  true
),

-- ============== ROUTINES ==============
(
  'productive-daily-routine',
  'Productive Daily Routine',
  'routine',
  'A simple rhythm to own your day',
  'A daily loop of intentional planning, focused work, movement, and reflection — built for consistency over intensity.',
  'Perfect for users who want structure and momentum without overwhelm.',
  '$0',
  'Immediate',
  '["Plan top 3 every morning","Move your body daily","Do one focused work block","Review your day each evening"]'::jsonb,
  '[
    {"title":"Plan your top 3","description":"Write down the three things that would make today a win.","category":"focus","difficulty":1},
    {"title":"Move your body","description":"Walk, stretch or train for at least 10 minutes.","category":"health","difficulty":1},
    {"title":"Inbox zero sprint","description":"15 minutes clearing inbox or notifications.","category":"focus","difficulty":2},
    {"title":"Mindful reset","description":"Five slow breaths or a short meditation.","category":"mindset","difficulty":1},
    {"title":"Evening review","description":"Reflect: what worked, what to change tomorrow.","category":"mindset","difficulty":2}
  ]'::jsonb,
  array['stay_productive'],
  array['beginner','intermediate','advanced'],
  1,
  true
),
(
  'deep-work-operator',
  'Deep Work Operator',
  'routine',
  'Train the focus muscle daily',
  'A routine centered on deep focus blocks, deliberate rest, and daily reflection — ideal for makers, writers, and builders.',
  'Great for anyone whose output depends on uninterrupted thinking time.',
  '$0',
  'Immediate',
  '["Run one 25-minute deep block","Protect a daily no-phone window","Journal one insight per day","Hit 5 deep blocks in a week"]'::jsonb,
  '[
    {"title":"Deep work block","description":"25 minutes, one tab, no phone.","category":"focus","difficulty":2},
    {"title":"Cut one distraction","description":"Remove a meeting, tool, or task that isn''t moving things.","category":"focus","difficulty":1},
    {"title":"Teach it back","description":"Explain today''s lesson out loud or in writing.","category":"skill","difficulty":2},
    {"title":"Evening review","description":"Reflect: what worked, what to change tomorrow.","category":"mindset","difficulty":2}
  ]'::jsonb,
  array['stay_productive','build_skills'],
  array['intermediate','advanced','expert'],
  2,
  true
),

-- ============== SKILLS ==============
(
  'daily-learning-loop',
  'Daily Learning Loop',
  'skill',
  'Compound a real skill in 30 days',
  'A deliberate practice routine: learn a concept, apply it, and teach it back each day to lock it in.',
  'For users who want to level up a specific craft — coding, design, writing, sales, etc.',
  '$0–$50',
  'Immediate',
  '["Pick one skill to master","Study 20 minutes daily","Ship a small practice artifact","Teach what you learned once a week"]'::jsonb,
  '[
    {"title":"Learn something new","description":"Watch a lesson or read a chapter — then write one takeaway.","category":"skill","difficulty":1},
    {"title":"Practice deliberately","description":"Work on the one thing you''re weakest at.","category":"skill","difficulty":3},
    {"title":"Teach it back","description":"Explain today''s lesson out loud or in writing.","category":"skill","difficulty":2},
    {"title":"Review yesterday''s notes","description":"Spaced repetition beats cramming.","category":"mindset","difficulty":1},
    {"title":"Deep work block","description":"25 minutes, one tab, no phone.","category":"focus","difficulty":2}
  ]'::jsonb,
  array['build_skills'],
  array['beginner','intermediate','advanced','expert'],
  2,
  true
),
(
  'founder-operating-system',
  'Founder Operating System',
  'skill',
  'Run your business like an operator',
  'A weekly rhythm of talking to customers, reviewing numbers, shipping improvements, and cutting waste.',
  'For founders and side-project owners who want signal over noise.',
  '$0',
  'Immediate',
  '["Talk to a customer weekly","Review numbers weekly","Ship one improvement per week","Remove one distraction per week"]'::jsonb,
  '[
    {"title":"Talk to one customer","description":"Ask what they love and what''s missing.","category":"growth","difficulty":2},
    {"title":"Review your numbers","description":"Check revenue, churn, or pipeline for 10 minutes.","category":"hustle","difficulty":2},
    {"title":"Cut one distraction","description":"Remove a meeting, tool, or task that isn''t moving things.","category":"focus","difficulty":1},
    {"title":"Draft one campaign idea","description":"Sketch a promo, launch, or partnership.","category":"growth","difficulty":2},
    {"title":"Recognize a teammate","description":"A 30 second message can change someone''s week.","category":"mindset","difficulty":1},
    {"title":"Ship one small improvement","description":"Make a visible change to your product or service.","category":"focus","difficulty":3}
  ]'::jsonb,
  array['grow_business'],
  array['intermediate','advanced','expert'],
  2,
  true
),
(
  'client-acquisition-engine',
  'Client Acquisition Engine',
  'skill',
  'Daily reps to fill your pipeline',
  'A simple daily outreach and follow-up rhythm built to land consistent paying clients.',
  'For freelancers, agencies, and service providers who need more revenue now.',
  '$0–$100',
  '2–6 weeks',
  '["Send 5 cold pitches per day","Follow up with 3 warm leads","Post one piece of value daily","Close first new client"]'::jsonb,
  '[
    {"title":"Pitch one new client","description":"Send a personalized outreach message to a potential client.","category":"hustle","difficulty":2},
    {"title":"Post a value piece","description":"Share a tip or insight publicly to grow your audience.","category":"growth","difficulty":1},
    {"title":"Review your offers","description":"Audit pricing, copy or positioning for 15 minutes.","category":"hustle","difficulty":2},
    {"title":"Follow up with 3 leads","description":"Send a short, warm follow-up to recent conversations.","category":"hustle","difficulty":1},
    {"title":"Ship one small improvement","description":"Make a visible change to your product or service.","category":"focus","difficulty":3}
  ]'::jsonb,
  array['earn_income','grow_business'],
  array['beginner','intermediate','advanced'],
  2,
  true
)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  tagline = excluded.tagline,
  description = excluded.description,
  why_fit = excluded.why_fit,
  startup_cost = excluded.startup_cost,
  time_to_income = excluded.time_to_income,
  first_milestones = excluded.first_milestones,
  task_pool = excluded.task_pool,
  matching_goals = excluded.matching_goals,
  matching_experience = excluded.matching_experience,
  difficulty = excluded.difficulty,
  updated_at = now();
