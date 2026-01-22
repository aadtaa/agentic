-- Lucy AI Coach - Database Schema
-- Single user MVP (no RLS)
-- Run this in Supabase SQL Editor

-- ============================================
-- LAYER 1: ATHLETE IDENTITY
-- ============================================

CREATE TABLE athlete_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  competitive_level TEXT CHECK (competitive_level IN ('beginner', 'amateur', 'amateur_elite', 'elite', 'pro')),
  rider_type TEXT CHECK (rider_type IN ('Sprinter', 'Climber', 'Diesel', 'All-rounder', 'TT Specialist')),
  rider_type_confidence INTEGER CHECK (rider_type_confidence BETWEEN 0 AND 100),
  primary_sport TEXT DEFAULT 'cycling',
  secondary_sports JSONB DEFAULT '[]',
  training_start_date DATE,
  coach_name TEXT,
  coach_email TEXT,
  timezone TEXT DEFAULT 'UTC',
  units_preference TEXT DEFAULT 'metric' CHECK (units_preference IN ('metric', 'imperial')),
  language TEXT DEFAULT 'en',
  home_location JSONB, -- {city, country, lat, lng, elevation_m}
  passport_country TEXT,
  dietary_restrictions JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  emergency_contact JSONB, -- {name, phone, relationship}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE athlete_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- garmin, wahoo, strava, whoop, oura, apple_health, myfitnesspal, etc.
  provider_user_id TEXT,
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  token_expires_at TIMESTAMPTZ,
  scopes JSONB DEFAULT '[]',
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily')),
  connection_status TEXT DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, provider)
);

-- ============================================
-- LAYER 2: POWER PROFILE
-- ============================================

CREATE TABLE signature_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  ftp_watts INTEGER,
  ftp_w_per_kg DECIMAL(4,2),
  critical_power_watts INTEGER,
  critical_power_w_per_kg DECIMAL(4,2),
  w_prime_kj DECIMAL(5,2),
  w_prime_j_per_kg DECIMAL(6,2),
  pmax_watts INTEGER,
  pmax_w_per_kg DECIMAL(4,2),
  map_watts INTEGER,
  map_w_per_kg DECIMAL(4,2),
  max_hr INTEGER,
  resting_hr INTEGER,
  lthr INTEGER,
  data_source TEXT CHECK (data_source IN ('test', 'race', 'estimated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE power_duration_curve (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL, -- 1, 5, 15, 30, 60, 120, 180, 300, 480, 720, 1200, 1800, 3600, 5400, 10800
  power_watts INTEGER NOT NULL,
  w_per_kg DECIMAL(4,2),
  domain TEXT CHECK (domain IN ('Extreme', 'Severe', 'Heavy', 'Moderate')),
  physiological_parameter TEXT, -- Pmax, Sprint, MAP, FTP, etc.
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  tcx_file_id UUID,
  context TEXT CHECK (context IN ('fresh', 'fatigued', 'race', 'training')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, duration_seconds)
);

CREATE TABLE seven_axis_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  neuromuscular_p INTEGER CHECK (neuromuscular_p BETWEEN 1 AND 99),
  w_prime_p INTEGER CHECK (w_prime_p BETWEEN 1 AND 99),
  glycolytic_p INTEGER CHECK (glycolytic_p BETWEEN 1 AND 99),
  vo2max_p INTEGER CHECK (vo2max_p BETWEEN 1 AND 99),
  threshold_p INTEGER CHECK (threshold_p BETWEEN 1 AND 99),
  endurance_p INTEGER CHECK (endurance_p BETWEEN 1 AND 99),
  durability_p INTEGER CHECK (durability_p BETWEEN 1 AND 99),
  comparison_population TEXT DEFAULT 'all' CHECK (comparison_population IN ('all', 'age_group', 'competitive_level')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metabolic_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  fractional_utilization_pct DECIMAL(5,2),
  vlamax_estimated DECIMAL(4,3),
  w_prime_cp_ratio_seconds DECIMAL(6,2),
  p1min_p20min_ratio DECIMAL(4,2),
  fat_max_watts INTEGER,
  carb_dependency TEXT CHECK (carb_dependency IN ('Low', 'Moderate', 'High')),
  metabolic_type TEXT CHECK (metabolic_type IN ('Diesel', 'Balanced', 'Explosive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE durability_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  retention_pct DECIMAL(5,2),
  fresh_cp_watts INTEGER,
  fatigued_cp_watts INTEGER,
  power_fade_5min_pct DECIMAL(5,2),
  power_fade_20min_pct DECIMAL(5,2),
  hr_power_decoupling_pct DECIMAL(5,2),
  tte_at_cp_minutes INTEGER,
  durability_rating TEXT CHECK (durability_rating IN ('Poor', 'Fair', 'Good', 'Excellent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LAYER 3: TRAINING DATA
-- ============================================

CREATE TABLE tcx_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- S3 key or local path
  file_hash TEXT, -- for deduplication
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  activity_date DATE NOT NULL,
  activity_type TEXT CHECK (activity_type IN ('ride', 'run', 'swim', 'strength', 'other')),
  workout_type TEXT CHECK (workout_type IN ('endurance', 'threshold', 'vo2max', 'recovery', 'race', 'test')),
  title TEXT,
  duration_seconds INTEGER,
  moving_time_seconds INTEGER,
  distance_meters INTEGER,
  elevation_meters INTEGER,
  avg_power INTEGER,
  max_power INTEGER,
  normalized_power INTEGER,
  intensity_factor DECIMAL(4,3),
  tss DECIMAL(6,2),
  avg_hr INTEGER,
  max_hr INTEGER,
  avg_cadence INTEGER,
  indoor BOOLEAN DEFAULT false,
  device TEXT,
  notes TEXT,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  feeling TEXT CHECK (feeling IN ('great', 'good', 'ok', 'tired', 'bad')),
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, file_hash)
);

CREATE TABLE training_load (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tss_total DECIMAL(6,2) DEFAULT 0,
  duration_total_seconds INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  atl DECIMAL(6,2), -- Acute Training Load
  ctl DECIMAL(6,2), -- Chronic Training Load
  tsb DECIMAL(6,2), -- Training Stress Balance
  ramp_rate DECIMAL(5,2),
  intensity_distribution JSONB, -- {z1: 1800, z2: 3600, ...}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

-- ============================================
-- LAYER 4: THREE-BLOCK SYSTEM
-- ============================================

CREATE TABLE daily_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Quick scores
  readiness_score INTEGER CHECK (readiness_score BETWEEN 1 AND 100),
  energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
  motivation_score INTEGER CHECK (motivation_score BETWEEN 1 AND 10),
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  stress_score INTEGER CHECK (stress_score BETWEEN 1 AND 10),
  sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 100),
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 1 AND 100),
  recovery_score INTEGER CHECK (recovery_score BETWEEN 1 AND 100),
  -- Training summary
  trained BOOLEAN DEFAULT false,
  tss_total DECIMAL(6,2) DEFAULT 0,
  duration_total_minutes INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  -- Flags
  rest_day BOOLEAN DEFAULT false,
  sick BOOLEAN DEFAULT false,
  injured BOOLEAN DEFAULT false,
  travel_day BOOLEAN DEFAULT false,
  race_day BOOLEAN DEFAULT false,
  -- Notes
  morning_notes TEXT,
  evening_notes TEXT,
  coach_notes TEXT,
  -- Meta
  completed_at TIMESTAMPTZ,
  data_completeness INTEGER CHECK (data_completeness BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_sleep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Duration
  time_in_bed_minutes INTEGER,
  total_sleep_minutes INTEGER,
  sleep_efficiency_pct DECIMAL(5,2),
  -- Timing
  bedtime TIMESTAMPTZ,
  sleep_onset TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  sleep_latency_minutes INTEGER,
  -- Stages
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  -- Quality
  sleep_score INTEGER CHECK (sleep_score BETWEEN 1 AND 100),
  restfulness_score INTEGER CHECK (restfulness_score BETWEEN 1 AND 100),
  awakenings_count INTEGER,
  -- Biometrics during sleep
  avg_hr_sleeping INTEGER,
  lowest_hr INTEGER,
  hrv_avg INTEGER,
  hrv_rmssd DECIMAL(6,2),
  respiratory_rate DECIMAL(4,1),
  skin_temperature_deviation DECIMAL(4,2),
  blood_oxygen_avg_pct DECIMAL(4,1),
  -- Environment
  room_temperature_c DECIMAL(4,1),
  room_humidity_pct DECIMAL(4,1),
  -- Subjective
  sleep_quality_feel INTEGER CHECK (sleep_quality_feel BETWEEN 1 AND 5),
  dream_recall BOOLEAN,
  notes TEXT,
  -- Source
  data_source TEXT, -- oura, whoop, apple, garmin, eight_sleep, manual
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Macros
  calories_total INTEGER,
  calories_target INTEGER,
  protein_g DECIMAL(6,2),
  protein_target_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  carbs_target_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  fat_target_g DECIMAL(6,2),
  fiber_g DECIMAL(5,2),
  -- Micros
  sodium_mg INTEGER,
  potassium_mg INTEGER,
  magnesium_mg INTEGER,
  calcium_mg INTEGER,
  iron_mg DECIMAL(4,2),
  zinc_mg DECIMAL(4,2),
  vitamin_d_iu INTEGER,
  vitamin_b12_mcg DECIMAL(5,2),
  vitamin_c_mg INTEGER,
  omega_3_g DECIMAL(4,2),
  -- Hydration
  water_liters DECIMAL(4,2),
  total_fluids_liters DECIMAL(4,2),
  electrolytes_mg INTEGER,
  -- Quality
  meals_count INTEGER,
  snacks_count INTEGER,
  processed_food_pct DECIMAL(5,2),
  whole_foods_pct DECIMAL(5,2),
  vegetables_servings INTEGER,
  fruits_servings INTEGER,
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 1 AND 100),
  -- Training nutrition
  pre_workout_carbs_g INTEGER,
  during_workout_carbs_g INTEGER,
  during_workout_fluids_ml INTEGER,
  post_workout_protein_g INTEGER,
  post_workout_carbs_g INTEGER,
  fueling_compliance INTEGER CHECK (fueling_compliance BETWEEN 1 AND 100),
  -- Other
  alcohol_units DECIMAL(4,2),
  caffeine_mg INTEGER,
  supplements_taken JSONB DEFAULT '[]',
  fasting_hours INTEGER,
  notes TEXT,
  -- Source
  data_source TEXT, -- myfitnesspal, cronometer, macrofactor, manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_nutrition_id UUID REFERENCES daily_nutrition(id) ON DELETE SET NULL,
  -- Meal info
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'during_workout', 'post_workout')),
  meal_time TIMESTAMPTZ,
  meal_name TEXT,
  -- Macros
  calories INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fat_g DECIMAL(5,2),
  fiber_g DECIMAL(4,2),
  -- Context
  location TEXT, -- home, restaurant, on_bike, work
  restaurant_name TEXT,
  homemade BOOLEAN,
  meal_prep BOOLEAN,
  -- Quality
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  portion_size TEXT CHECK (portion_size IN ('small', 'normal', 'large')),
  eating_speed TEXT CHECK (eating_speed IN ('slow', 'normal', 'fast')),
  mindful_eating BOOLEAN,
  -- Photo
  photo_url TEXT,
  -- Source
  data_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES daily_meals(id) ON DELETE CASCADE,
  -- Food info
  food_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  food_database_id TEXT,
  -- Serving
  serving_size DECIMAL(8,2),
  serving_unit TEXT, -- g, oz, cup, piece
  servings DECIMAL(4,2),
  -- Macros
  calories INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  sugar_g DECIMAL(5,2),
  fiber_g DECIMAL(4,2),
  fat_g DECIMAL(5,2),
  saturated_fat_g DECIMAL(4,2),
  trans_fat_g DECIMAL(4,2),
  -- Micros
  sodium_mg INTEGER,
  cholesterol_mg INTEGER,
  potassium_mg INTEGER,
  vitamin_a_iu INTEGER,
  vitamin_c_mg INTEGER,
  calcium_mg INTEGER,
  iron_mg DECIMAL(4,2),
  -- Classification
  food_group TEXT CHECK (food_group IN ('grain', 'protein', 'vegetable', 'fruit', 'dairy', 'fat', 'other')),
  is_whole_food BOOLEAN,
  is_processed BOOLEAN,
  glycemic_index INTEGER,
  -- Source
  data_source TEXT, -- usda, myfitnesspal, manual, barcode_scan
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Mental
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  motivation_training INTEGER CHECK (motivation_training BETWEEN 1 AND 10),
  motivation_life INTEGER CHECK (motivation_life BETWEEN 1 AND 10),
  focus_level INTEGER CHECK (focus_level BETWEEN 1 AND 10),
  irritability INTEGER CHECK (irritability BETWEEN 1 AND 10),
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 10),
  -- Physical
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  fatigue_level INTEGER CHECK (fatigue_level BETWEEN 1 AND 10),
  muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 10),
  soreness_locations JSONB DEFAULT '[]', -- ["quads", "lower_back", etc.]
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  pain_locations JSONB DEFAULT '[]',
  -- Recovery
  legs_feeling TEXT CHECK (legs_feeling IN ('fresh', 'normal', 'tired', 'heavy', 'dead')),
  recovery_score INTEGER CHECK (recovery_score BETWEEN 1 AND 100),
  readiness_to_train INTEGER CHECK (readiness_to_train BETWEEN 1 AND 10),
  -- Female specific
  menstrual_cycle_day INTEGER,
  menstrual_phase TEXT CHECK (menstrual_phase IN ('menstruation', 'follicular', 'ovulation', 'luteal')),
  menstrual_symptoms JSONB,
  contraceptive_type TEXT,
  -- Journaling
  gratitude TEXT,
  wins TEXT,
  challenges TEXT,
  journal_entry TEXT,
  -- Source
  data_source TEXT, -- whoop, oura, manual, journal_app
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  measurement_time TIMESTAMPTZ,
  -- Heart
  resting_hr INTEGER,
  hrv_rmssd DECIMAL(6,2),
  hrv_score INTEGER CHECK (hrv_score BETWEEN 1 AND 100),
  hr_variability_trend TEXT CHECK (hr_variability_trend IN ('increasing', 'stable', 'decreasing')),
  -- Body composition
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,2),
  muscle_mass_kg DECIMAL(5,2),
  bone_mass_kg DECIMAL(4,2),
  water_pct DECIMAL(4,2),
  visceral_fat INTEGER,
  metabolic_age INTEGER,
  bmr_kcal INTEGER,
  -- Vitals
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  blood_oxygen_pct DECIMAL(4,1),
  respiratory_rate DECIMAL(4,1),
  body_temperature_c DECIMAL(4,2),
  -- Blood (if available)
  glucose_mg_dl INTEGER,
  ketones_mmol DECIMAL(4,2),
  lactate_mmol DECIMAL(4,2),
  -- Other
  skin_temperature_c DECIMAL(4,2),
  core_temperature_c DECIMAL(4,2),
  steps_count INTEGER,
  standing_hours INTEGER,
  -- Source
  data_source TEXT, -- scale, whoop, oura, apple, garmin, cgm, manual
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location JSONB, -- {city, lat, lng}
  -- Conditions
  condition TEXT, -- sunny, cloudy, rainy, snowy, etc.
  condition_code TEXT,
  description TEXT,
  -- Temperature
  temp_high_c DECIMAL(4,1),
  temp_low_c DECIMAL(4,1),
  temp_avg_c DECIMAL(4,1),
  feels_like_c DECIMAL(4,1),
  -- Wind
  wind_speed_kmh DECIMAL(5,1),
  wind_gust_kmh DECIMAL(5,1),
  wind_direction TEXT, -- N, NE, E, etc.
  -- Precipitation
  precipitation_mm DECIMAL(5,1),
  precipitation_probability_pct INTEGER,
  snow_cm DECIMAL(4,1),
  -- Atmosphere
  humidity_pct INTEGER,
  pressure_hpa INTEGER,
  uv_index INTEGER,
  visibility_km DECIMAL(5,1),
  air_quality_index INTEGER,
  pollen_level TEXT CHECK (pollen_level IN ('low', 'medium', 'high', 'very_high')),
  -- Sun
  sunrise TIME,
  sunset TIME,
  daylight_hours DECIMAL(4,2),
  -- Source
  data_source TEXT, -- openweather, tomorrow_io, apple_weather
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Primary location
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  elevation_m INTEGER,
  timezone TEXT,
  -- Context
  location_type TEXT CHECK (location_type IN ('home', 'training_camp', 'race_venue', 'travel', 'vacation')),
  is_altitude_training BOOLEAN DEFAULT false,
  days_at_altitude INTEGER,
  -- Travel
  travel_day BOOLEAN DEFAULT false,
  travel_hours DECIMAL(4,2),
  time_zone_change INTEGER,
  jet_lag_severity INTEGER CHECK (jet_lag_severity BETWEEN 1 AND 10),
  -- Source
  data_source TEXT, -- gps, manual, calendar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE daily_medical (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Illness
  sick BOOLEAN DEFAULT false,
  illness_type TEXT, -- cold, flu, covid, stomach, other
  illness_severity INTEGER CHECK (illness_severity BETWEEN 1 AND 10),
  illness_symptoms JSONB DEFAULT '[]',
  fever_c DECIMAL(4,2),
  illness_day INTEGER,
  -- Injury
  injured BOOLEAN DEFAULT false,
  injury_type TEXT, -- muscle, joint, bone, tendon, other
  injury_location TEXT,
  injury_severity INTEGER CHECK (injury_severity BETWEEN 1 AND 10),
  injury_limiting_training BOOLEAN,
  treatment TEXT,
  -- Medications
  medications JSONB DEFAULT '[]', -- [{name, dose, frequency}]
  supplements JSONB DEFAULT '[]', -- [{name, dose}]
  new_medication_started BOOLEAN DEFAULT false,
  -- Appointments
  doctor_visit BOOLEAN DEFAULT false,
  appointment_type TEXT, -- GP, physio, specialist, dentist
  appointment_notes TEXT,
  -- Tests
  blood_test BOOLEAN DEFAULT false,
  blood_test_results JSONB,
  other_tests JSONB,
  -- Notes
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE TABLE weekly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday
  week_end DATE NOT NULL, -- Sunday
  -- Training
  total_tss DECIMAL(7,2),
  total_hours DECIMAL(5,2),
  total_distance_km DECIMAL(7,2),
  total_elevation_m INTEGER,
  activities_count INTEGER,
  training_days INTEGER,
  rest_days INTEGER,
  longest_activity_hours DECIMAL(4,2),
  highest_tss_day DECIMAL(6,2),
  intensity_distribution JSONB, -- {z1: %, z2: %, ...}
  compliance_pct DECIMAL(5,2),
  -- Load
  avg_daily_tss DECIMAL(5,2),
  tss_trend TEXT CHECK (tss_trend IN ('increasing', 'stable', 'decreasing')),
  week_vs_last_week_pct DECIMAL(6,2),
  atl_end DECIMAL(6,2),
  ctl_end DECIMAL(6,2),
  tsb_end DECIMAL(6,2),
  -- Sleep
  avg_sleep_hours DECIMAL(4,2),
  avg_sleep_score INTEGER,
  total_sleep_debt_hours DECIMAL(5,2),
  nights_below_7h INTEGER,
  avg_hrv INTEGER,
  hrv_trend TEXT CHECK (hrv_trend IN ('improving', 'stable', 'declining')),
  sleep_consistency_score INTEGER,
  -- Nutrition
  avg_calories INTEGER,
  avg_protein_g DECIMAL(5,2),
  avg_carbs_g DECIMAL(5,2),
  nutrition_compliance_pct DECIMAL(5,2),
  avg_hydration_liters DECIMAL(4,2),
  alcohol_total_units DECIMAL(4,2),
  -- Wellness
  avg_energy DECIMAL(3,1),
  avg_stress DECIMAL(3,1),
  avg_mood DECIMAL(3,1),
  avg_soreness DECIMAL(3,1),
  avg_readiness DECIMAL(4,1),
  high_stress_days INTEGER,
  low_energy_days INTEGER,
  -- Health
  sick_days INTEGER,
  injury_days INTEGER,
  weight_start_kg DECIMAL(5,2),
  weight_end_kg DECIMAL(5,2),
  weight_change_kg DECIMAL(4,2),
  -- Biometrics
  avg_resting_hr INTEGER,
  resting_hr_trend TEXT CHECK (resting_hr_trend IN ('increasing', 'stable', 'decreasing')),
  -- Weather
  avg_temp_c DECIMAL(4,1),
  rainy_days INTEGER,
  indoor_training_days INTEGER,
  -- Location
  travel_days INTEGER,
  locations_visited JSONB DEFAULT '[]',
  time_at_altitude_days INTEGER,
  -- Summary
  week_rating TEXT CHECK (week_rating IN ('great', 'good', 'ok', 'poor', 'bad')),
  biggest_win TEXT,
  biggest_challenge TEXT,
  lucy_summary TEXT,
  coach_notes TEXT,
  athlete_reflection TEXT,
  -- Meta
  data_completeness_pct INTEGER,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, week_start)
);

CREATE TABLE monthly_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First of month
  -- Training
  total_tss DECIMAL(8,2),
  total_hours DECIMAL(6,2),
  total_distance_km DECIMAL(8,2),
  total_elevation_m INTEGER,
  activities_count INTEGER,
  avg_weekly_tss DECIMAL(6,2),
  training_consistency_pct DECIMAL(5,2),
  biggest_week_tss DECIMAL(6,2),
  -- Progress
  ftp_start INTEGER,
  ftp_end INTEGER,
  ftp_change INTEGER,
  weight_start_kg DECIMAL(5,2),
  weight_end_kg DECIMAL(5,2),
  weight_change_kg DECIMAL(4,2),
  w_per_kg_change DECIMAL(4,3),
  -- Patterns
  avg_sleep_hours DECIMAL(4,2),
  avg_hrv INTEGER,
  avg_stress DECIMAL(3,1),
  limiting_factors JSONB DEFAULT '[]', -- ["sleep", "work", "travel"]
  best_training_type TEXT,
  -- Health
  sick_days_total INTEGER,
  injury_days_total INTEGER,
  -- Summary
  phase TEXT CHECK (phase IN ('base', 'build', 'peak', 'recovery', 'off')),
  month_rating TEXT CHECK (month_rating IN ('great', 'good', 'ok', 'poor', 'bad')),
  highlights JSONB DEFAULT '[]',
  challenges JSONB DEFAULT '[]',
  lucy_summary TEXT,
  athlete_reflection TEXT,
  goals_next_month TEXT,
  -- Meta
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, month)
);

-- ============================================
-- LAYER 5: CALENDAR & PLANNING
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  event_type TEXT CHECK (event_type IN ('race_road', 'race_crit', 'race_tt', 'gran_fondo', 'sportive', 'other')),
  priority TEXT CHECK (priority IN ('A', 'B', 'C')),
  distance_km DECIMAL(6,2),
  elevation_m DECIMAL(6,1),
  expected_duration_hours DECIMAL(4,2),
  goal_time TEXT,
  goal_power INTEGER,
  goal_description TEXT,
  course_profile TEXT CHECK (course_profile IN ('flat', 'rolling', 'hilly', 'mountainous')),
  notes TEXT,
  result_time TEXT,
  result_power INTEGER,
  result_notes TEXT,
  tcx_file_id UUID REFERENCES tcx_files(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  workout_type TEXT CHECK (workout_type IN ('endurance', 'tempo', 'sweet_spot', 'threshold', 'vo2max', 'anaerobic', 'sprint', 'recovery', 'strength')),
  title TEXT NOT NULL,
  description TEXT,
  duration_planned_minutes INTEGER,
  tss_planned INTEGER,
  intensity_target TEXT, -- Zone or % FTP target
  structure JSONB, -- [{duration: 300, intensity: "threshold"}, ...]
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  skipped_reason TEXT,
  actual_tcx_file_id UUID REFERENCES tcx_files(id),
  compliance_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  end_date DATE,
  event_type TEXT CHECK (event_type IN ('work', 'travel', 'family', 'social', 'vacation', 'medical')),
  title TEXT NOT NULL,
  training_impact TEXT CHECK (training_impact IN ('none', 'reduced', 'blocked')),
  available_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE travel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  purpose TEXT CHECK (purpose IN ('race', 'training_camp', 'vacation', 'work')),
  -- Dates
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  total_days INTEGER,
  -- Destination
  destination_city TEXT,
  destination_country TEXT,
  destination_lat DECIMAL(10,7),
  destination_lng DECIMAL(10,7),
  destination_elevation_m INTEGER,
  destination_timezone TEXT,
  -- Flights
  flights JSONB DEFAULT '[]', -- [{airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, booking_ref, seat}]
  total_flight_hours DECIMAL(5,2),
  timezone_change_hours INTEGER,
  -- Accommodation
  accommodation_type TEXT CHECK (accommodation_type IN ('hotel', 'airbnb', 'friends', 'camping')),
  accommodation_name TEXT,
  accommodation_address TEXT,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  booking_ref TEXT,
  -- Transport
  ground_transport JSONB DEFAULT '[]', -- [{type, details, booking_ref}]
  bike_transport TEXT,
  -- Race info (if race trip)
  event_id UUID REFERENCES events(id),
  registration_confirmed BOOLEAN,
  race_number TEXT,
  start_time TIMESTAMPTZ,
  -- Logistics
  travel_checklist JSONB DEFAULT '[]',
  documents_needed JSONB DEFAULT '[]',
  bike_box_booked BOOLEAN,
  travel_insurance BOOLEAN,
  -- Costs
  total_cost_estimate DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  costs_breakdown JSONB, -- {flights: X, hotel: Y, ...}
  -- Notes
  notes TEXT,
  lucy_travel_tips TEXT,
  -- Source
  booked_via TEXT,
  booking_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LAYER 6: INTELLIGENCE (Placeholder)
-- ============================================

CREATE TABLE athlete_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- strength, weakness, pattern, recommendation
  category TEXT, -- sleep, training, nutrition, recovery
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  evidence JSONB, -- Data points supporting this insight
  actionable BOOLEAN DEFAULT true,
  action_suggested TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  focus_area TEXT NOT NULL, -- ftp, endurance, vo2max, sprint, weight_loss, recovery
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  rationale TEXT,
  target_metrics JSONB, -- {ftp: 280, weight: 72}
  progress_notes TEXT,
  achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LAYER 7: EQUIPMENT & FINANCE
-- ============================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL, -- bike, shoes, helmet, power_meter, trainer, etc.
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  -- Bike specific
  bike_type TEXT CHECK (bike_type IN ('road', 'tt', 'gravel', 'mtb', 'track')),
  frame_size TEXT,
  frame_material TEXT CHECK (frame_material IN ('carbon', 'aluminum', 'steel', 'titanium')),
  groupset TEXT,
  wheelset TEXT,
  weight_kg DECIMAL(5,2),
  -- Maintenance
  service_interval_km INTEGER,
  last_service_date DATE,
  last_service_km INTEGER,
  total_km INTEGER DEFAULT 0,
  total_hours DECIMAL(7,2) DEFAULT 0,
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'backup', 'retired', 'sold')),
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'needs_service')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  tcx_file_id UUID NOT NULL REFERENCES tcx_files(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  distance_km DECIMAL(7,2),
  duration_hours DECIMAL(5,2),
  elevation_m INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('equipment', 'race_entry', 'travel', 'nutrition', 'coaching', 'membership', 'medical', 'other')),
  subcategory TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  vendor TEXT,
  receipt_url TEXT,
  event_id UUID REFERENCES events(id),
  travel_id UUID REFERENCES travel(id),
  equipment_id UUID REFERENCES equipment(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Athlete lookup indexes
CREATE INDEX idx_athlete_connections_athlete ON athlete_connections(athlete_id);
CREATE INDEX idx_signature_metrics_athlete ON signature_metrics(athlete_id);
CREATE INDEX idx_power_duration_curve_athlete ON power_duration_curve(athlete_id);
CREATE INDEX idx_tcx_files_athlete_date ON tcx_files(athlete_id, activity_date);
CREATE INDEX idx_training_load_athlete_date ON training_load(athlete_id, date);

-- Daily tables indexes
CREATE INDEX idx_daily_log_athlete_date ON daily_log(athlete_id, date);
CREATE INDEX idx_daily_sleep_athlete_date ON daily_sleep(athlete_id, date);
CREATE INDEX idx_daily_nutrition_athlete_date ON daily_nutrition(athlete_id, date);
CREATE INDEX idx_daily_wellness_athlete_date ON daily_wellness(athlete_id, date);
CREATE INDEX idx_daily_biometrics_athlete_date ON daily_biometrics(athlete_id, date);

-- Calendar indexes
CREATE INDEX idx_events_athlete_date ON events(athlete_id, date);
CREATE INDEX idx_planned_workouts_athlete_date ON planned_workouts(athlete_id, scheduled_date);

-- Weekly/Monthly indexes
CREATE INDEX idx_weekly_summary_athlete ON weekly_summary(athlete_id, week_start);
CREATE INDEX idx_monthly_summary_athlete ON monthly_summary(athlete_id, month);

-- ============================================
-- SEED DATA: Create default athlete profile
-- ============================================

INSERT INTO athlete_profile (id, name, preferred_name, email, primary_sport)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Athlete',
  'Athlete',
  'athlete@example.com',
  'cycling'
);
