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

The database follows a structured 7-layer architecture designed for athlete intelligence. Schema defined in `supabase/schema.sql`.

### Layer 1: Athlete Identity

#### `athlete_profile`
Core athlete information and preferences.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name`, `preferred_name` | TEXT | Display names |
| `email`, `phone` | TEXT | Contact info |
| `weight_kg`, `height_cm` | DECIMAL | Physical measurements |
| `date_of_birth` | DATE | Birth date |
| `sex` | TEXT | `male`, `female`, `other` |
| `blood_type` | TEXT | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `competitive_level` | TEXT | `beginner`, `amateur`, `amateur_elite`, `elite`, `pro` |
| `rider_type` | TEXT | `Sprinter`, `Climber`, `Diesel`, `All-rounder`, `TT Specialist` |
| `rider_type_confidence` | INT | 0-100% confidence in rider type classification |
| `primary_sport` | TEXT | Default: `cycling` |
| `secondary_sports` | JSONB | Array of other sports |
| `training_start_date` | DATE | When athlete started training |
| `coach_name`, `coach_email` | TEXT | Coach contact |
| `timezone` | TEXT | Default: `UTC` |
| `units_preference` | TEXT | `metric` or `imperial` |
| `home_location` | JSONB | `{city, country, lat, lng, elevation_m}` |
| `dietary_restrictions` | JSONB | Array of restrictions |
| `allergies` | JSONB | Array of allergies |
| `emergency_contact` | JSONB | `{name, phone, relationship}` |

#### `athlete_connections`
OAuth/API integrations with external services.

| Column | Type | Description |
|--------|------|-------------|
| `provider` | TEXT | `garmin`, `wahoo`, `strava`, `whoop`, `oura`, `apple_health`, `myfitnesspal`, etc. |
| `access_token`, `refresh_token` | TEXT | Encrypted tokens |
| `token_expires_at` | TIMESTAMPTZ | Token expiry |
| `sync_enabled` | BOOLEAN | Auto-sync enabled |
| `sync_frequency` | TEXT | `realtime`, `hourly`, `daily` |
| `connection_status` | TEXT | `connected`, `expired`, `error` |
| `last_sync_at` | TIMESTAMPTZ | Last successful sync |

---

### Layer 2: Power Profile

#### `signature_metrics`
Current power profile snapshot.

| Column | Type | Description |
|--------|------|-------------|
| `ftp_watts` | INT | Functional Threshold Power |
| `ftp_w_per_kg` | DECIMAL | FTP relative to weight |
| `critical_power_watts` | INT | CP from power-duration model |
| `w_prime_kj` | DECIMAL | Anaerobic work capacity |
| `pmax_watts` | INT | Peak power (neuromuscular) |
| `map_watts` | INT | Maximal Aerobic Power |
| `max_hr`, `resting_hr`, `lthr` | INT | Heart rate metrics |
| `data_source` | TEXT | `test`, `race`, `estimated` |

#### `power_duration_curve`
Power outputs at standard durations (1s to 3h).

| Column | Type | Description |
|--------|------|-------------|
| `duration_seconds` | INT | 1, 5, 15, 30, 60, 120, 180, 300, 480, 720, 1200, 1800, 3600, 5400, 10800 |
| `power_watts` | INT | Best power at duration |
| `w_per_kg` | DECIMAL | Relative power |
| `domain` | TEXT | `Extreme`, `Severe`, `Heavy`, `Moderate` |
| `physiological_parameter` | TEXT | `Pmax`, `Sprint`, `MAP`, `FTP`, etc. |
| `context` | TEXT | `fresh`, `fatigued`, `race`, `training` |

#### `seven_axis_profile`
Percentile rankings across 7 physiological axes.

| Column | Type | Description |
|--------|------|-------------|
| `neuromuscular_p` | INT | 1-99 percentile (sprint/peak power) |
| `w_prime_p` | INT | 1-99 percentile (anaerobic capacity) |
| `glycolytic_p` | INT | 1-99 percentile (30s-2min power) |
| `vo2max_p` | INT | 1-99 percentile (3-8min power) |
| `threshold_p` | INT | 1-99 percentile (FTP/CP) |
| `endurance_p` | INT | 1-99 percentile (long duration) |
| `durability_p` | INT | 1-99 percentile (fatigue resistance) |
| `comparison_population` | TEXT | `all`, `age_group`, `competitive_level` |

#### `metabolic_profile`
Metabolic characteristics.

| Column | Type | Description |
|--------|------|-------------|
| `fractional_utilization_pct` | DECIMAL | % of VO2max at threshold |
| `vlamax_estimated` | DECIMAL | Glycolytic capacity estimate |
| `fat_max_watts` | INT | Power at max fat oxidation |
| `carb_dependency` | TEXT | `Low`, `Moderate`, `High` |
| `metabolic_type` | TEXT | `Diesel`, `Balanced`, `Explosive` |

#### `durability_metrics`
Fatigue resistance measurements.

| Column | Type | Description |
|--------|------|-------------|
| `retention_pct` | DECIMAL | Power retention after fatigue |
| `fresh_cp_watts`, `fatigued_cp_watts` | INT | CP fresh vs fatigued |
| `power_fade_5min_pct`, `power_fade_20min_pct` | DECIMAL | Power decay rates |
| `hr_power_decoupling_pct` | DECIMAL | HR drift vs power |
| `tte_at_cp_minutes` | INT | Time to exhaustion at CP |
| `durability_rating` | TEXT | `Poor`, `Fair`, `Good`, `Excellent` |

---

### Layer 3: Training Data

#### `tcx_files`
Uploaded activity files with extracted summaries.

| Column | Type | Description |
|--------|------|-------------|
| `filename`, `file_path` | TEXT | File storage location |
| `file_hash` | TEXT | For deduplication |
| `activity_date` | DATE | When activity occurred |
| `activity_type` | TEXT | `ride`, `run`, `swim`, `strength`, `other` |
| `workout_type` | TEXT | `endurance`, `threshold`, `vo2max`, `recovery`, `race`, `test` |
| `duration_seconds`, `moving_time_seconds` | INT | Time metrics |
| `distance_meters`, `elevation_meters` | INT | Distance/elevation |
| `avg_power`, `max_power`, `normalized_power` | INT | Power metrics |
| `intensity_factor` | DECIMAL | IF = NP/FTP |
| `tss` | DECIMAL | Training Stress Score |
| `avg_hr`, `max_hr`, `avg_cadence` | INT | HR/cadence |
| `indoor` | BOOLEAN | Indoor trainer ride |
| `rpe` | INT | 1-10 perceived exertion |
| `feeling` | TEXT | `great`, `good`, `ok`, `tired`, `bad` |

#### `training_load`
Daily PMC (Performance Management Chart) values.

| Column | Type | Description |
|--------|------|-------------|
| `date` | DATE | Unique per athlete |
| `tss_total` | DECIMAL | Total TSS for day |
| `duration_total_seconds` | INT | Total training time |
| `activities_count` | INT | Number of activities |
| `atl` | DECIMAL | Acute Training Load (fatigue) |
| `ctl` | DECIMAL | Chronic Training Load (fitness) |
| `tsb` | DECIMAL | Training Stress Balance (form) |
| `ramp_rate` | DECIMAL | CTL change rate |
| `intensity_distribution` | JSONB | `{z1: 1800, z2: 3600, ...}` |

---

### Layer 4: Three-Block System (Daily Life Context)

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

#### `daily_log`
Daily summary scores and flags.

| Column | Type | Description |
|--------|------|-------------|
| `readiness_score` | INT | 1-100 overall readiness |
| `energy_score`, `motivation_score`, `mood_score`, `stress_score` | INT | 1-10 subjective scores |
| `sleep_score`, `nutrition_score`, `recovery_score` | INT | 1-100 category scores |
| `trained`, `rest_day`, `sick`, `injured`, `travel_day`, `race_day` | BOOLEAN | Day flags |
| `tss_total`, `duration_total_minutes`, `activities_count` | Various | Training summary |
| `morning_notes`, `evening_notes`, `coach_notes` | TEXT | Journals |

#### `daily_sleep`
Comprehensive sleep tracking.

| Column | Type | Description |
|--------|------|-------------|
| `time_in_bed_minutes`, `total_sleep_minutes` | INT | Duration |
| `sleep_efficiency_pct` | DECIMAL | Sleep/time in bed ratio |
| `bedtime`, `sleep_onset`, `wake_time` | TIMESTAMPTZ | Timing |
| `deep_sleep_minutes`, `rem_sleep_minutes`, `light_sleep_minutes`, `awake_minutes` | INT | Sleep stages |
| `sleep_score`, `restfulness_score` | INT | 1-100 quality scores |
| `avg_hr_sleeping`, `lowest_hr`, `hrv_avg`, `hrv_rmssd` | Various | Biometrics |
| `respiratory_rate`, `blood_oxygen_avg_pct` | DECIMAL | Vitals |
| `skin_temperature_deviation` | DECIMAL | Temp deviation from baseline |
| `data_source` | TEXT | `oura`, `whoop`, `apple`, `garmin`, `eight_sleep`, `manual` |

#### `daily_nutrition`
Full macro/micro tracking with training fueling.

| Column | Type | Description |
|--------|------|-------------|
| `calories_total`, `calories_target` | INT | Energy balance |
| `protein_g`, `carbs_g`, `fat_g`, `fiber_g` | DECIMAL | Macros |
| `sodium_mg`, `potassium_mg`, `magnesium_mg`, `calcium_mg` | INT | Electrolytes |
| `iron_mg`, `zinc_mg`, `vitamin_d_iu`, `vitamin_b12_mcg`, `vitamin_c_mg` | Various | Vitamins/minerals |
| `water_liters`, `total_fluids_liters` | DECIMAL | Hydration |
| `pre_workout_carbs_g`, `during_workout_carbs_g`, `post_workout_protein_g` | INT | Training nutrition |
| `fueling_compliance` | INT | 1-100 adherence to plan |
| `alcohol_units`, `caffeine_mg` | Various | Substances |
| `data_source` | TEXT | `myfitnesspal`, `cronometer`, `macrofactor`, `manual` |

#### `daily_meals`
Individual meal entries.

| Column | Type | Description |
|--------|------|-------------|
| `meal_type` | TEXT | `breakfast`, `lunch`, `dinner`, `snack`, `pre_workout`, `during_workout`, `post_workout` |
| `meal_time` | TIMESTAMPTZ | When eaten |
| `calories`, `protein_g`, `carbs_g`, `fat_g` | Various | Macros |
| `location` | TEXT | `home`, `restaurant`, `on_bike`, `work` |
| `quality_score` | INT | 1-5 meal quality |
| `portion_size` | TEXT | `small`, `normal`, `large` |

#### `daily_foods`
Individual food items with full nutrition data.

| Column | Type | Description |
|--------|------|-------------|
| `food_name`, `brand`, `barcode` | TEXT | Food identification |
| `serving_size`, `serving_unit`, `servings` | Various | Portions |
| `calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g` | Various | Macros |
| `food_group` | TEXT | `grain`, `protein`, `vegetable`, `fruit`, `dairy`, `fat`, `other` |
| `is_whole_food`, `is_processed` | BOOLEAN | Food quality flags |
| `glycemic_index` | INT | GI value |

#### `daily_wellness`
Mental and physical wellness tracking.

| Column | Type | Description |
|--------|------|-------------|
| `mood_score`, `anxiety_level`, `stress_level` | INT | 1-10 mental state |
| `motivation_training`, `motivation_life`, `focus_level` | INT | 1-10 motivation |
| `energy_level`, `fatigue_level` | INT | 1-10 energy |
| `muscle_soreness`, `pain_level` | INT | 1-10 physical state |
| `soreness_locations`, `pain_locations` | JSONB | Arrays of body parts |
| `legs_feeling` | TEXT | `fresh`, `normal`, `tired`, `heavy`, `dead` |
| `recovery_score`, `readiness_to_train` | INT | Recovery metrics |
| `menstrual_cycle_day`, `menstrual_phase` | Various | Female-specific tracking |
| `gratitude`, `wins`, `challenges`, `journal_entry` | TEXT | Journaling |

#### `daily_biometrics`
Body composition and vital signs.

| Column | Type | Description |
|--------|------|-------------|
| `resting_hr`, `hrv_rmssd`, `hrv_score` | Various | Heart metrics |
| `weight_kg`, `body_fat_pct`, `muscle_mass_kg` | DECIMAL | Body composition |
| `blood_pressure_systolic`, `blood_pressure_diastolic` | INT | Blood pressure |
| `blood_oxygen_pct`, `respiratory_rate` | DECIMAL | Vitals |
| `glucose_mg_dl`, `ketones_mmol`, `lactate_mmol` | Various | Blood markers |
| `steps_count`, `standing_hours` | INT | Activity |

#### `daily_weather`
Training conditions.

| Column | Type | Description |
|--------|------|-------------|
| `condition` | TEXT | `sunny`, `cloudy`, `rainy`, `snowy`, etc. |
| `temp_high_c`, `temp_low_c`, `temp_avg_c`, `feels_like_c` | DECIMAL | Temperature |
| `wind_speed_kmh`, `wind_gust_kmh`, `wind_direction` | Various | Wind |
| `humidity_pct`, `uv_index`, `air_quality_index` | Various | Atmosphere |
| `pollen_level` | TEXT | `low`, `medium`, `high`, `very_high` |

#### `daily_location`
Geographic context.

| Column | Type | Description |
|--------|------|-------------|
| `city`, `region`, `country` | TEXT | Location |
| `lat`, `lng`, `elevation_m` | Various | Coordinates |
| `location_type` | TEXT | `home`, `training_camp`, `race_venue`, `travel`, `vacation` |
| `is_altitude_training`, `days_at_altitude` | Various | Altitude context |
| `travel_day`, `time_zone_change`, `jet_lag_severity` | Various | Travel impact |

#### `daily_medical`
Health issues and medications.

| Column | Type | Description |
|--------|------|-------------|
| `sick`, `illness_type`, `illness_severity` | Various | Illness tracking |
| `injured`, `injury_type`, `injury_location`, `injury_severity` | Various | Injury tracking |
| `medications`, `supplements` | JSONB | `[{name, dose, frequency}]` |
| `doctor_visit`, `appointment_type`, `appointment_notes` | Various | Medical appointments |
| `blood_test`, `blood_test_results` | Various | Lab results |

#### `weekly_summary`
Aggregated weekly patterns (70+ columns).

| Key Columns | Description |
|-------------|-------------|
| `week_start`, `week_end` | Monday to Sunday |
| `total_tss`, `total_hours`, `total_distance_km`, `total_elevation_m` | Training totals |
| `atl_end`, `ctl_end`, `tsb_end` | PMC end-of-week values |
| `avg_sleep_hours`, `avg_hrv`, `sleep_consistency_score` | Sleep patterns |
| `avg_calories`, `avg_protein_g`, `nutrition_compliance_pct` | Nutrition patterns |
| `avg_energy`, `avg_stress`, `avg_mood`, `avg_readiness` | Wellness patterns |
| `sick_days`, `injury_days`, `weight_change_kg` | Health summary |
| `lucy_summary`, `coach_notes`, `athlete_reflection` | Commentary |

#### `monthly_summary`
Monthly trends and progress (40+ columns).

| Key Columns | Description |
|-------------|-------------|
| `month` | First of month |
| `total_tss`, `total_hours`, `avg_weekly_tss` | Training volume |
| `ftp_start`, `ftp_end`, `ftp_change` | FTP progression |
| `weight_start_kg`, `weight_end_kg`, `w_per_kg_change` | Weight changes |
| `limiting_factors` | JSONB array: `["sleep", "work", "travel"]` |
| `phase` | `base`, `build`, `peak`, `recovery`, `off` |
| `lucy_summary`, `goals_next_month` | AI analysis and planning |

---

### Layer 5: Calendar & Planning

#### `events`
Races and target events.

| Column | Type | Description |
|--------|------|-------------|
| `name`, `date` | Various | Event basics |
| `event_type` | TEXT | `race_road`, `race_crit`, `race_tt`, `gran_fondo`, `sportive`, `other` |
| `priority` | TEXT | `A` (key), `B` (important), `C` (training) |
| `distance_km`, `elevation_m`, `expected_duration_hours` | Various | Course details |
| `goal_time`, `goal_power`, `goal_description` | Various | Targets |
| `course_profile` | TEXT | `flat`, `rolling`, `hilly`, `mountainous` |
| `result_time`, `result_power`, `result_notes` | Various | Actual results |

#### `planned_workouts`
Scheduled training sessions.

| Column | Type | Description |
|--------|------|-------------|
| `scheduled_date`, `scheduled_time` | Various | When |
| `workout_type` | TEXT | `endurance`, `tempo`, `sweet_spot`, `threshold`, `vo2max`, `anaerobic`, `sprint`, `recovery`, `strength` |
| `title`, `description` | TEXT | Workout details |
| `duration_planned_minutes`, `tss_planned` | INT | Targets |
| `structure` | JSONB | `[{duration: 300, intensity: "threshold"}, ...]` |
| `completed`, `skipped_reason` | Various | Execution status |
| `actual_tcx_file_id`, `compliance_score` | Various | Linked actual workout |

#### `life_events`
Non-training events that affect training.

| Column | Type | Description |
|--------|------|-------------|
| `date`, `end_date` | DATE | Event duration |
| `event_type` | TEXT | `work`, `travel`, `family`, `social`, `vacation`, `medical` |
| `training_impact` | TEXT | `none`, `reduced`, `blocked` |
| `available_hours` | DECIMAL | Training time available |

#### `travel`
Comprehensive trip planning (40+ columns).

| Key Columns | Description |
|-------------|-------------|
| `trip_name`, `purpose` | `race`, `training_camp`, `vacation`, `work` |
| `departure_date`, `return_date`, `total_days` | Trip duration |
| `destination_city`, `destination_country`, `destination_elevation_m` | Location |
| `flights` | JSONB: `[{airline, flight_number, departure_airport, ...}]` |
| `accommodation_type`, `accommodation_name`, `check_in`, `check_out` | Lodging |
| `event_id`, `registration_confirmed`, `race_number` | Race link |
| `travel_checklist`, `documents_needed` | JSONB arrays |
| `total_cost_estimate`, `costs_breakdown` | Budget |

---

### Layer 6: Intelligence

#### `athlete_insights`
AI-generated patterns and recommendations.

| Column | Type | Description |
|--------|------|-------------|
| `insight_type` | TEXT | `strength`, `weakness`, `pattern`, `recommendation` |
| `category` | TEXT | `sleep`, `training`, `nutrition`, `recovery` |
| `title`, `description` | TEXT | Insight content |
| `confidence` | INT | 0-100% confidence level |
| `evidence` | JSONB | Data points supporting insight |
| `actionable`, `action_suggested` | Various | What to do about it |
| `valid_from`, `valid_until` | DATE | Insight validity period |

#### `training_focus`
Current training priorities.

| Column | Type | Description |
|--------|------|-------------|
| `focus_area` | TEXT | `ftp`, `endurance`, `vo2max`, `sprint`, `weight_loss`, `recovery` |
| `priority` | INT | 1-5 priority ranking |
| `rationale` | TEXT | Why this focus |
| `target_metrics` | JSONB | `{ftp: 280, weight: 72}` |
| `start_date`, `end_date` | DATE | Focus period |
| `progress_notes`, `achieved` | Various | Tracking |

---

### Layer 7: Equipment & Finance

#### `equipment`
Bikes, gear, and maintenance tracking.

| Column | Type | Description |
|--------|------|-------------|
| `equipment_type` | TEXT | `bike`, `shoes`, `helmet`, `power_meter`, `trainer`, etc. |
| `name`, `brand`, `model` | TEXT | Identification |
| `purchase_date`, `purchase_price`, `currency` | Various | Purchase info |
| `bike_type` | TEXT | `road`, `tt`, `gravel`, `mtb`, `track` |
| `frame_material` | TEXT | `carbon`, `aluminum`, `steel`, `titanium` |
| `groupset`, `wheelset`, `weight_kg` | Various | Bike specs |
| `service_interval_km`, `last_service_date`, `last_service_km` | Various | Maintenance |
| `total_km`, `total_hours` | Various | Usage tracking |
| `status` | TEXT | `active`, `backup`, `retired`, `sold` |
| `condition` | TEXT | `excellent`, `good`, `fair`, `needs_service` |

#### `equipment_usage`
Links equipment to activities.

| Column | Type | Description |
|--------|------|-------------|
| `equipment_id` | UUID | FK to equipment |
| `tcx_file_id` | UUID | FK to activity |
| `distance_km`, `duration_hours`, `elevation_m` | Various | Usage metrics |

#### `expenses`
Training-related costs.

| Column | Type | Description |
|--------|------|-------------|
| `category` | TEXT | `equipment`, `race_entry`, `travel`, `nutrition`, `coaching`, `membership`, `medical`, `other` |
| `subcategory`, `description` | TEXT | Details |
| `amount`, `currency` | Various | Cost |
| `vendor`, `receipt_url` | TEXT | Purchase details |
| `event_id`, `travel_id`, `equipment_id` | UUID | Linked records |

---

### Database Indexes

Performance indexes on frequently queried columns:

```sql
-- Athlete lookup
idx_athlete_connections_athlete, idx_signature_metrics_athlete,
idx_power_duration_curve_athlete, idx_tcx_files_athlete_date,
idx_training_load_athlete_date

-- Daily tables (athlete_id, date)
idx_daily_log_athlete_date, idx_daily_sleep_athlete_date,
idx_daily_nutrition_athlete_date, idx_daily_wellness_athlete_date,
idx_daily_biometrics_athlete_date

-- Calendar
idx_events_athlete_date, idx_planned_workouts_athlete_date

-- Summaries
idx_weekly_summary_athlete, idx_monthly_summary_athlete
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
