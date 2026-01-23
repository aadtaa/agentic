# CLAUDE_CONTEXT.md

> **Purpose**: This document provides complete context for Claude Code sessions working on this project. Read this first to understand the vision, architecture, and implementation details.

---

## Project Overview

**Name**: Lucy AI - Agentic Coaching Platform
**Mission**: AI coaching agent for endurance sports. Cycling first, designed to scale.
**Version**: 0.1.0
**Status**: Active Development

### Core Principle

**Lucy knows what she knows.** The LLM self-assesses confidence on every response. She builds trust by being right when confident, and honest when uncertain.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18.2 + Vite 5.0 |
| Backend | Netlify Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL) |
| AI | Claude Opus 4.5 (`claude-opus-4-5-20251101`) via Anthropic SDK |
| Styling | CSS Custom Properties + React inline styles |
| Routing | React Router DOM 6.20 |

---

## Project Structure

```
/home/user/agentic/
├── src/                           # React frontend
│   ├── components/
│   │   ├── Dashboard.jsx          # Main layout/router
│   │   ├── ChatView.jsx           # Main chat interface with Lucy
│   │   ├── DataViewer.jsx         # Database browser
│   │   ├── Header.jsx             # Top navigation (file upload)
│   │   ├── Sidebar.jsx            # Left navigation
│   │   ├── FloatingAssistant.jsx  # Chat overlay for agent pages
│   │   └── agents/                # Specialized agent UIs (placeholders)
│   │       ├── DataAgent.jsx
│   │       ├── CodeAgent.jsx
│   │       ├── ResearchAgent.jsx
│   │       └── WritingAgent.jsx
│   ├── styles/globals.css         # Design system
│   ├── types/database.ts          # TypeScript database types (50+ types)
│   ├── App.jsx                    # Route setup
│   └── main.jsx                   # Entry point
├── netlify/functions/             # Serverless backend
│   ├── chat.js                    # Claude API + Lucy system prompt
│   ├── query-table.js             # Direct table queries for DataViewer
│   └── lib/
│       └── data-collector.js      # Supabase data queries + calculations
├── supabase/                      # Database
│   ├── schema.sql                 # Full 7-layer schema (33KB)
│   ├── seed.sql                   # Initial seed data
│   ├── seed-demo-cyclist.sql      # Demo athlete "cyclist"
│   └── seed-part-*.sql            # Modular seed data files
├── public/                        # Static assets
├── vite.config.js                 # Vite config (port 3000)
├── netlify.toml                   # Netlify settings (port 8888)
└── .env.example                   # Environment template
```

---

## Database Architecture (7 Layers)

The database follows a structured 7-layer architecture designed for athlete intelligence.

### Layer 1: Athlete Identity

```
┌─────────────────────────────────────────────────────────────┐
│  ATHLETE_PROFILE                                            │
├─────────────────────────────────────────────────────────────┤
│  id, name, weight_kg, competitive_level                     │
│  rider_type (Diesel/Sprinter/All-rounder/Climber)          │
│  rider_type_confidence (0-100%)                             │
│  training_start_date                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ATHLETE_CONNECTIONS                                        │
├─────────────────────────────────────────────────────────────┤
│  OAuth/API integrations (Garmin, Strava, Wahoo, etc.)      │
└─────────────────────────────────────────────────────────────┘
```

### Layer 2: Power Profile

```
┌─────────────────────────────────────────────────────────────┐
│  SIGNATURE_METRICS (current snapshot)                       │
├─────────────────────────────────────────────────────────────┤
│  ftp_watts, critical_power_watts                            │
│  w_prime_kj, pmax_watts, map_watts                          │
│  recorded_at, vs_4_weeks_change                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  POWER_DURATION_CURVE (1s → 3h)                             │
├─────────────────────────────────────────────────────────────┤
│  duration_seconds, power_watts, w_per_kg                    │
│  domain, physiological_parameter, recorded_date             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SEVEN_AXIS_PROFILE (percentiles P1-P99)                    │
├─────────────────────────────────────────────────────────────┤
│  neuromuscular_p, w_prime_p, glycolytic_p, vo2max_p         │
│  threshold_p, endurance_p, durability_p                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  METABOLIC_PROFILE                                          │
├─────────────────────────────────────────────────────────────┤
│  fractional_utilization, vlamax_estimated                   │
│  p1min_p20min_ratio, carb_dependency                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DURABILITY_METRICS                                         │
├─────────────────────────────────────────────────────────────┤
│  retention_percent, power_fade_5min, power_fade_20min       │
│  hr_power_decoupling, tte_at_cp                             │
└─────────────────────────────────────────────────────────────┘
```

### Layer 3: Training Data

```
┌─────────────────────────────────────────────────────────────┐
│  TCX_FILES (raw files, not parsed to seconds)               │
├─────────────────────────────────────────────────────────────┤
│  id, athlete_id, filename, uploaded_at                      │
│  file_path (storage location)                               │
│  activity_date, activity_type                               │
│  summary_json (basic metrics extracted once)                │
│    → duration, distance, avg_power, tss, etc.              │
└─────────────────────────────────────────────────────────────┘
│                                                             │
│  NOTE: Full second-by-second data stays in TCX file.       │
│  Code Generator runs analysis on raw file when needed.      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRAINING_LOAD (daily aggregates from summaries)            │
├─────────────────────────────────────────────────────────────┤
│  date, tss_total, duration_total                            │
│  atl, ctl, tsb (PMC values)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Layer 4: Three-Block System (Life Context)

```
DAILY (detail)              WEEKLY (patterns)          MONTHLY (trends)
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ sleep_hours      │       │ avg_sleep        │       │ sleep_trend      │
│ sleep_quality    │  ──►  │ consistency      │  ──►  │ vs_target        │
│ hrv, bedtime     │       │ debt_hours       │       │                  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ calories, macros │       │ avg_calories     │       │ nutrition_trend  │
│ hydration        │  ──►  │ fueling_score    │  ──►  │ weight_change    │
│ meal_quality     │       │                  │       │                  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ energy, stress   │       │ avg_readiness    │       │ limiting_factors │
│ soreness, mood   │  ──►  │ red_flag_days    │  ──►  │ patterns         │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

**Daily Tables**:
- `daily_log` - Readiness, energy, motivation, mood, stress, recovery
- `daily_sleep` - Duration, quality, HRV, sleep stages
- `daily_nutrition` - Calories, macros, micronutrients, hydration
- `daily_meals` - Individual meal entries
- `daily_foods` - Food items with nutrition facts
- `daily_wellness` - Mental health, soreness, menstrual cycle
- `daily_biometrics` - Weight, body composition, resting HR
- `daily_weather` - Training conditions
- `daily_location` - Geographic data, altitude, timezone
- `daily_medical` - Illness, injury, medication

**Summary Tables**:
- `weekly_summary` - Weekly totals, averages, trends
- `monthly_summary` - Monthly analysis, consistency metrics

### Layer 5: Calendar & Planning

```
┌─────────────────────────────────────────────────────────────┐
│  EVENTS                                                     │
├─────────────────────────────────────────────────────────────┤
│  date, name, priority (A/B/C), goal_time, goal_power        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PLANNED_WORKOUTS                                           │
├─────────────────────────────────────────────────────────────┤
│  scheduled_date, workout_type, duration, tss_planned        │
│  completed, actual_tcx_file_id                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  LIFE_EVENTS (constraints)                                  │
├─────────────────────────────────────────────────────────────┤
│  date, type (work/travel/family), training_impact           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRAVEL                                                     │
├─────────────────────────────────────────────────────────────┤
│  Trip details, flights, accommodation, race logistics       │
└─────────────────────────────────────────────────────────────┘
```

### Layer 6: Intelligence

```
┌─────────────────────────────────────────────────────────────┐
│  ATHLETE_INSIGHTS (learned patterns)                        │
├─────────────────────────────────────────────────────────────┤
│  category, pattern, data_points, correlation                │
│  actionable_recommendation                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRAINING_FOCUS (current recommendations)                   │
├─────────────────────────────────────────────────────────────┤
│  recommendation, priority (do/maintain/avoid)               │
│  rationale                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Layer 7: Equipment & Finance

```
┌─────────────────────────────────────────────────────────────┐
│  EQUIPMENT                                                  │
├─────────────────────────────────────────────────────────────┤
│  Bikes, shoes, power meters, trainers                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EQUIPMENT_USAGE                                            │
├─────────────────────────────────────────────────────────────┤
│  Which bike used on which activities                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EXPENSES                                                   │
├─────────────────────────────────────────────────────────────┤
│  Training-related costs                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Architecture

```
                              USER MESSAGE
                                   │
                                   ▼
                         ┌─────────────────┐
                         │  ORCHESTRATOR   │
                         │                 │
                         │ • Understand    │
                         │ • Route         │
                         │ • Coordinate    │
                         └────────┬────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       │                          │                          │
       ▼                          ▼                          ▼
┌─────────────┐          ┌─────────────────┐         ┌─────────────┐
│    DATA     │          │      CODE       │         │  INTERNET   │
│  COLLECTOR  │          │   GENERATOR     │         │   SEARCH    │
│             │          │                 │         │             │
│ • Query DB  │          │ • TCX parsing   │         │ • Training  │
│ • Aggregate │          │ • Calculations  │         │   science   │
│ • Validate  │          │ • Custom metrics│         │ • Race info │
│             │          │ • Extract data  │         │ • Fill gaps │
└─────────────┘          └─────────────────┘         └─────────────┘
       │                          │                          │
       │                          ▼                          │
       │                 ┌─────────────────┐                 │
       │                 │   VISUALIZER    │                 │
       │                 │                 │                 │
       │                 │ PRE-BUILT:      │                 │
       │                 │ • Power curve   │                 │
       │                 │ • PMC chart     │                 │
       │                 │ • Readiness     │                 │
       │                 │ • 7-axis radar  │                 │
       │                 │                 │                 │
       │                 │ CUSTOM:         │                 │
       │                 │ • Any X vs Y    │                 │
       │                 │ • User requests │                 │
       └────────────────►└─────────────────┘◄────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │  RESPONSE CRAFTER   │
                       │                     │
                       │ • Lucy's voice      │
                       │ • LLM confidence    │
                       │ • Assemble output   │
                       └─────────────────────┘
                                  │
                                  ▼
                           LUCY'S RESPONSE
```

### Current Implementation Status

| Agent | Status | Location |
|-------|--------|----------|
| Lucy AI Coach (Chat) | **Implemented** | `netlify/functions/chat.js` |
| Data Collector | **Implemented** | `netlify/functions/lib/data-collector.js` |
| Data Viewer | **Implemented** | `src/components/DataViewer.jsx` |
| Data Agent | UI Ready | `src/components/agents/DataAgent.jsx` |
| Code Agent | UI Ready | `src/components/agents/CodeAgent.jsx` |
| Research Agent | UI Ready | `src/components/agents/ResearchAgent.jsx` |
| Writing Agent | UI Ready | `src/components/agents/WritingAgent.jsx` |

### Specialized Agent Flows (Planned)

These are pre-built analysis flows that run in parallel when triggered:

**Race Analyzer**
- Trigger: "analyze my race" + TCX file
- Output: Race summary, power distribution, pacing analysis, matches burned, HR/power decoupling, key moments, learnings

**Weekly Review**
- Trigger: "weekly review" or automatic Sunday
- Output: Week stats, training load chart, intensity distribution, sleep/recovery trend, plan vs actual, wins/concerns

**Fitness Test Analyzer**
- Trigger: "analyze my test" + TCX file
- Output: New metrics, power curve overlay, FTP progression, profile changes, training implications

**Readiness Check**
- Trigger: "how should I train today" or morning routine
- Output: Readiness score, contributing factors, training recommendation, adjusted workout

---

## Data Access System

Lucy uses a **two-tier data access system**:

### Tier 1: Specialized Analytics (`query_athlete_data`)

Pre-calculated summaries and analyses:

| Data Type | Returns |
|-----------|---------|
| `profile` | Basic athlete info, measurements, preferences |
| `power_metrics` | FTP, CP, W', power curve analysis |
| `training_load` | CTL/ATL/TSB (PMC system), trends |
| `sleep_summary` | Sleep quality averages, HRV trends |
| `wellness_summary` | Energy, stress, mood, readiness |
| `weekly_summary` | Week overview with totals |
| `upcoming_events` | Scheduled races and goals |
| `nutrition_summary` | Macro/calorie averages |

### Tier 2: Raw Data Access (`query_table`)

Direct table queries with date filtering. **Allowed tables** (27 total):

```
Layer 1: athlete_profile, athlete_connections
Layer 2: signature_metrics, power_duration_curve, seven_axis_profile,
         metabolic_profile, durability_metrics
Layer 3: tcx_files, training_load
Layer 4: daily_log, daily_sleep, daily_nutrition, daily_meals, daily_foods,
         daily_wellness, daily_biometrics, daily_weather, daily_location,
         daily_medical, weekly_summary, monthly_summary
Layer 5: events, planned_workouts, life_events, travel
Layer 6: athlete_insights, training_focus
Layer 7: equipment, equipment_usage, expenses
```

**Date ranges**: `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_week`, `last_week`

---

## Confidence System

**The LLM self-assesses confidence.** Not calculated from data metrics.

### How it works:

After processing a request, Lucy evaluates:

```
"Before I respond, I assess my confidence:

- Do I have enough data about this athlete?
- Is this question within my training/sports knowledge?
- Have I seen this pattern before with this athlete?
- Am I guessing or do I actually know?
- What could I be missing?

I must be honest. Athletes trust me because I don't bullshit."
```

### Confidence Levels

| Level | When Used |
|-------|-----------|
| **HIGH** | Clear data, established patterns, evidence-based |
| **MEDIUM** | Good data but some assumptions, reasonable extrapolation |
| **LOW** | Limited data, educated guessing, needs more info |
| **INSUFFICIENT** | Cannot answer reliably, refuses to guess |

---

## Data Integration Vision

**Capture everything. Aggregate smartly. Surface insights.**

Lucy connects to every data source in an athlete's life:

| Category | Sources |
|----------|---------|
| Training Devices | Garmin, Wahoo, Zwift, TrainerRoad |
| Wearables | Whoop, Oura, Apple Watch, Fitbit |
| Nutrition | MyFitnessPal, Cronometer, MacroFactor |
| Health | Apple Health, medical records |
| Calendar | Google, Outlook |
| Travel | Expedia, Google Flights, Booking.com |
| Weather | OpenWeather, Tomorrow.io |
| Sleep | Eight Sleep, Oura, Whoop |
| Mental | Mood trackers, journaling apps |
| Financial | Race entries, equipment purchases |

Raw data comes in → Lucy structures it → Intelligence emerges.

---

## API Endpoints

### POST `/.netlify/functions/chat`

Main chat endpoint for Lucy AI.

**Request**:
```json
{
  "message": "How is my training going?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**: Streaming text with markdown formatting

**Tools Available**:
- `query_athlete_data` - Specialized analytics
- `query_table` - Raw database queries

### POST `/.netlify/functions/query-table`

Direct database queries for DataViewer.

**Request**:
```json
{
  "table_name": "training_load",
  "date_range": "last_7_days",
  "limit": 50
}
```

**Response**: Formatted table data with pagination

---

## Development Commands

```bash
# Start development (runs both Vite + Netlify)
npm run netlify

# Just frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Ports**:
- Frontend (Vite): `localhost:3000`
- Backend (Netlify Dev): `localhost:8888`

---

## Environment Variables

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## Design System

| Token | Value |
|-------|-------|
| Primary Accent | `#2F71FF` |
| Background | White, Grey scale (50-500) |
| Success | `#28CD56` |
| Warning | `#FFB800` |
| Danger | `#FF3B2F` |
| Border Radius | 10px (sm), 14px (md), 20px (lg) |
| Font | System font stack |
| Glass Effect | Frosted blur with transparency |

---

## Key Files to Know

| Purpose | File |
|---------|------|
| Lucy's system prompt + tools | `netlify/functions/chat.js` |
| Database queries + calculations | `netlify/functions/lib/data-collector.js` |
| Full database schema | `supabase/schema.sql` |
| TypeScript types | `src/types/database.ts` |
| Main chat UI | `src/components/ChatView.jsx` |
| Data browser | `src/components/DataViewer.jsx` |
| App routing | `src/components/Dashboard.jsx` |
| Styles | `src/styles/globals.css` |

---

## Current Demo Athlete

- **ID**: `cyclist`
- **Name**: Demo Cyclist
- **Data**: Comprehensive training history, power data, daily logs
- **Seed files**: `supabase/seed-demo-cyclist.sql` and `seed-part-*.sql`

---

## Future Roadmap

1. **Implement remaining specialized agents** (Code, Research, Writing)
2. **Add TCX file parsing** in Code Generator
3. **Build visualization components** (Power curves, PMC charts, 7-axis radar)
4. **Integrate external APIs** (Garmin, Strava, Whoop, etc.)
5. **Add race/event analyzer**
6. **Weekly review automation**
7. **Mobile responsive improvements**

---

## Notes for Claude Sessions

1. **Always check `data-collector.js`** for how data queries work
2. **Lucy's personality** is defined in `chat.js` - direct, honest, no emojis
3. **Database schema** is comprehensive - check `schema.sql` for exact column names
4. **TypeScript types** in `database.ts` mirror the schema exactly
5. **Test with athlete ID `cyclist`** - has full demo data
6. **Netlify functions** use ES modules, not CommonJS

---

*Last updated: 2026-01-23*
