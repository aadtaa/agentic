-- ============================================
-- LUCY AI COACH - DEMO CYCLIST SEED DATA
-- Complete 1-year dataset for Marco Rossi
-- Run this AFTER schema.sql
-- ============================================

-- First, clear existing data for the demo athlete
DELETE FROM expenses WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM equipment_usage WHERE equipment_id IN (SELECT id FROM equipment WHERE athlete_id = '00000000-0000-0000-0000-000000000001');
DELETE FROM equipment WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM training_focus WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM athlete_insights WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM travel WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM life_events WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM planned_workouts WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM events WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM monthly_summary WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM weekly_summary WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_medical WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_location WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_weather WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_biometrics WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_wellness WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_foods WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_meals WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_nutrition WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_sleep WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM daily_log WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM training_load WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM tcx_files WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM durability_metrics WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM metabolic_profile WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM seven_axis_profile WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM power_duration_curve WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM signature_metrics WHERE athlete_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM athlete_connections WHERE athlete_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- LAYER 1: ATHLETE IDENTITY
-- ============================================

-- Update athlete profile with complete data
UPDATE athlete_profile SET
  name = 'Marco Rossi',
  preferred_name = 'Marco',
  email = 'marco.rossi@example.com',
  phone = '+39 333 1234567',
  weight_kg = 72.5,
  height_cm = 178,
  date_of_birth = '1991-06-15',
  sex = 'male',
  blood_type = 'A+',
  competitive_level = 'amateur_elite',
  rider_type = 'All-rounder',
  rider_type_confidence = 78,
  primary_sport = 'cycling',
  secondary_sports = '["running", "swimming"]',
  training_start_date = '2016-03-01',
  coach_name = 'Alessandro Bianchi',
  coach_email = 'coach.bianchi@example.com',
  timezone = 'Europe/Rome',
  units_preference = 'metric',
  language = 'en',
  home_location = '{"city": "Milan", "country": "Italy", "lat": 45.4642, "lng": 9.1900, "elevation_m": 120}',
  passport_country = 'IT',
  dietary_restrictions = '[]',
  allergies = '["pollen"]',
  emergency_contact = '{"name": "Sofia Rossi", "phone": "+39 333 7654321", "relationship": "wife"}',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Athlete connections (Garmin, Strava, Whoop)
INSERT INTO athlete_connections (athlete_id, provider, provider_user_id, last_sync_at, sync_enabled, connection_status) VALUES
('00000000-0000-0000-0000-000000000001', 'garmin', 'garmin_marco_12345', NOW() - INTERVAL '2 hours', true, 'connected'),
('00000000-0000-0000-0000-000000000001', 'strava', 'strava_marco_67890', NOW() - INTERVAL '1 hour', true, 'connected'),
('00000000-0000-0000-0000-000000000001', 'whoop', 'whoop_marco_11111', NOW() - INTERVAL '3 hours', true, 'connected');

-- ============================================
-- LAYER 2: POWER PROFILE
-- ============================================

-- Current signature metrics
INSERT INTO signature_metrics (athlete_id, recorded_at, ftp_watts, ftp_w_per_kg, critical_power_watts, critical_power_w_per_kg, w_prime_kj, w_prime_j_per_kg, pmax_watts, pmax_w_per_kg, map_watts, map_w_per_kg, max_hr, resting_hr, lthr, data_source, notes) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', 285, 3.93, 275, 3.79, 22.5, 310, 1150, 15.86, 380, 5.24, 186, 48, 168, 'test', 'FTP test on Zwift - 20min protocol');

-- Historical signature metrics (showing progression)
INSERT INTO signature_metrics (athlete_id, recorded_at, ftp_watts, ftp_w_per_kg, critical_power_watts, critical_power_w_per_kg, w_prime_kj, max_hr, resting_hr, lthr, data_source) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 months', 275, 3.79, 265, 3.66, 21.8, 186, 50, 165, 'test'),
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 months', 268, 3.62, 258, 3.49, 21.2, 187, 52, 163, 'test'),
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '9 months', 260, 3.47, 250, 3.33, 20.5, 188, 54, 160, 'test'),
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 months', 252, 3.36, 242, 3.23, 20.0, 188, 55, 158, 'test');

-- Power duration curve (current bests)
INSERT INTO power_duration_curve (athlete_id, duration_seconds, power_watts, w_per_kg, domain, physiological_parameter, recorded_at, context) VALUES
('00000000-0000-0000-0000-000000000001', 1, 1280, 17.66, 'Extreme', 'Peak Power', NOW() - INTERVAL '45 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 5, 1150, 15.86, 'Extreme', 'Pmax', NOW() - INTERVAL '30 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 15, 850, 11.72, 'Severe', 'Anaerobic', NOW() - INTERVAL '21 days', 'race'),
('00000000-0000-0000-0000-000000000001', 30, 620, 8.55, 'Severe', 'Anaerobic', NOW() - INTERVAL '28 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 60, 480, 6.62, 'Severe', 'MAP', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 120, 400, 5.52, 'Severe', 'VO2max', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 180, 365, 5.03, 'Heavy', 'VO2max', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 300, 330, 4.55, 'Heavy', 'VO2max', NOW() - INTERVAL '7 days', 'training'),
('00000000-0000-0000-0000-000000000001', 480, 310, 4.28, 'Heavy', 'Threshold', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 720, 298, 4.11, 'Heavy', 'Threshold', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 1200, 285, 3.93, 'Moderate', 'FTP', NOW() - INTERVAL '14 days', 'training'),
('00000000-0000-0000-0000-000000000001', 1800, 275, 3.79, 'Moderate', 'FTP', NOW() - INTERVAL '21 days', 'training'),
('00000000-0000-0000-0000-000000000001', 3600, 258, 3.56, 'Moderate', 'Endurance', NOW() - INTERVAL '35 days', 'training'),
('00000000-0000-0000-0000-000000000001', 5400, 245, 3.38, 'Moderate', 'Endurance', NOW() - INTERVAL '42 days', 'training'),
('00000000-0000-0000-0000-000000000001', 10800, 225, 3.10, 'Moderate', 'Endurance', NOW() - INTERVAL '60 days', 'training');

-- 7-axis profile
INSERT INTO seven_axis_profile (athlete_id, recorded_at, neuromuscular_p, w_prime_p, glycolytic_p, vo2max_p, threshold_p, endurance_p, durability_p, comparison_population) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', 68, 72, 65, 78, 82, 75, 70, 'all');

-- Metabolic profile
INSERT INTO metabolic_profile (athlete_id, recorded_at, fractional_utilization_pct, vlamax_estimated, w_prime_cp_ratio_seconds, p1min_p20min_ratio, fat_max_watts, carb_dependency, metabolic_type) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', 78.5, 0.42, 82, 1.68, 185, 'Moderate', 'Balanced');

-- Durability metrics
INSERT INTO durability_metrics (athlete_id, recorded_at, retention_pct, fresh_cp_watts, fatigued_cp_watts, power_fade_5min_pct, power_fade_20min_pct, hr_power_decoupling_pct, tte_at_cp_minutes, durability_rating) VALUES
('00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days', 88.5, 275, 244, 4.2, 8.5, 3.8, 42, 'Good');

-- ============================================
-- LAYER 3: TRAINING DATA - Last 30 days workouts
-- ============================================

-- Generate 30 days of workouts (tcx_files)
-- Day 1 (today - 29 days): Endurance ride
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-24-endurance.tcx', '/activities/2025-12-24-endurance.tcx', CURRENT_DATE - 29, 'ride', 'endurance', 'Easy morning spin', 5400, 5200, 42000, 320, 175, 285, 185, 0.65, 62, 128, 152, 88, false, 'Garmin Edge 540', 4, 'good', true);

-- Day 2: Rest day (no workout)

-- Day 3: Threshold intervals
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-26-threshold.tcx', '/activities/2025-12-26-threshold.tcx', CURRENT_DATE - 27, 'ride', 'threshold', '4x8min threshold', 4800, 4600, 38000, 450, 225, 340, 248, 0.87, 85, 156, 178, 92, false, 'Garmin Edge 540', 7, 'good', true);

-- Day 4: Recovery
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-27-recovery.tcx', '/activities/2025-12-27-recovery.tcx', CURRENT_DATE - 26, 'ride', 'recovery', 'Coffee spin', 3600, 3400, 28000, 180, 145, 220, 155, 0.54, 32, 118, 138, 85, false, 'Garmin Edge 540', 2, 'good', true);

-- Day 5: Long endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-28-long.tcx', '/activities/2025-12-28-long.tcx', CURRENT_DATE - 25, 'ride', 'endurance', 'Saturday long ride', 14400, 13800, 115000, 1450, 185, 380, 205, 0.72, 145, 138, 172, 86, false, 'Garmin Edge 540', 6, 'good', true);

-- Day 6: Rest

-- Day 7: VO2max intervals
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-30-vo2max.tcx', '/activities/2025-12-30-vo2max.tcx', CURRENT_DATE - 23, 'ride', 'vo2max', '5x4min VO2max', 4200, 4000, 32000, 380, 235, 420, 268, 0.94, 92, 162, 184, 95, true, 'Garmin Edge 540', 8, 'tired', true);

-- Day 8: Endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2025-12-31-endurance.tcx', '/activities/2025-12-31-endurance.tcx', CURRENT_DATE - 22, 'ride', 'endurance', 'New Years Eve ride', 5400, 5100, 45000, 520, 180, 295, 195, 0.68, 68, 132, 158, 87, false, 'Garmin Edge 540', 5, 'good', true);

-- Day 9: Rest

-- Day 10: Threshold
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-02-threshold.tcx', '/activities/2026-01-02-threshold.tcx', CURRENT_DATE - 20, 'ride', 'threshold', '2x20min sweet spot', 5400, 5200, 42000, 480, 218, 320, 242, 0.85, 88, 152, 175, 90, false, 'Garmin Edge 540', 7, 'good', true);

-- Day 11: Recovery
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-03-recovery.tcx', '/activities/2026-01-03-recovery.tcx', CURRENT_DATE - 19, 'ride', 'recovery', 'Easy spin', 3000, 2800, 22000, 150, 140, 210, 150, 0.53, 25, 115, 135, 82, false, 'Garmin Edge 540', 2, 'good', true);

-- Day 12: Long ride
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-04-long.tcx', '/activities/2026-01-04-long.tcx', CURRENT_DATE - 18, 'ride', 'endurance', 'Weekend long ride', 16200, 15600, 130000, 1680, 188, 395, 210, 0.74, 162, 140, 176, 85, false, 'Garmin Edge 540', 6, 'great', true);

-- Day 13: Rest

-- Day 14: VO2max
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-06-vo2max.tcx', '/activities/2026-01-06-vo2max.tcx', CURRENT_DATE - 16, 'ride', 'vo2max', '6x3min VO2max', 4500, 4300, 35000, 420, 240, 435, 275, 0.96, 98, 165, 186, 96, true, 'Garmin Edge 540', 9, 'tired', true);

-- Day 15: Endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-07-endurance.tcx', '/activities/2026-01-07-endurance.tcx', CURRENT_DATE - 15, 'ride', 'endurance', 'Zona 2 ride', 6000, 5700, 48000, 380, 178, 280, 188, 0.66, 72, 130, 155, 88, false, 'Garmin Edge 540', 4, 'good', true);

-- Day 16: FTP Test!
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-08-test.tcx', '/activities/2026-01-08-test.tcx', CURRENT_DATE - 14, 'ride', 'test', 'FTP Test - 20min', 4800, 4600, 36000, 280, 245, 380, 285, 1.00, 105, 168, 186, 94, true, 'Garmin Edge 540', 10, 'tired', true);

-- Day 17: Rest (after test)

-- Day 18: Recovery
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-10-recovery.tcx', '/activities/2026-01-10-recovery.tcx', CURRENT_DATE - 12, 'ride', 'recovery', 'Legs opener', 3600, 3400, 28000, 200, 148, 225, 158, 0.55, 35, 120, 142, 84, false, 'Garmin Edge 540', 3, 'ok', true);

-- Day 19: Long endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-11-long.tcx', '/activities/2026-01-11-long.tcx', CURRENT_DATE - 11, 'ride', 'endurance', 'Group ride', 14400, 13800, 118000, 1520, 192, 450, 215, 0.75, 155, 142, 178, 87, false, 'Garmin Edge 540', 6, 'great', true);

-- Day 20: Rest

-- Day 21: Threshold
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-13-threshold.tcx', '/activities/2026-01-13-threshold.tcx', CURRENT_DATE - 9, 'ride', 'threshold', '3x12min threshold', 5100, 4900, 40000, 520, 228, 345, 255, 0.89, 95, 158, 180, 91, false, 'Garmin Edge 540', 8, 'good', true);

-- Day 22: Endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-14-endurance.tcx', '/activities/2026-01-14-endurance.tcx', CURRENT_DATE - 8, 'ride', 'endurance', 'Easy spin with sprints', 5400, 5100, 44000, 350, 182, 680, 198, 0.69, 70, 134, 175, 86, false, 'Garmin Edge 540', 5, 'good', true);

-- Day 23: Rest

-- Day 24: VO2max
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-16-vo2max.tcx', '/activities/2026-01-16-vo2max.tcx', CURRENT_DATE - 6, 'ride', 'vo2max', '8x2min VO2max', 4200, 4000, 34000, 400, 242, 440, 278, 0.98, 96, 166, 185, 97, true, 'Garmin Edge 540', 9, 'ok', true);

-- Day 25: Recovery
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-17-recovery.tcx', '/activities/2026-01-17-recovery.tcx', CURRENT_DATE - 5, 'ride', 'recovery', 'Shake out ride', 3000, 2850, 24000, 160, 142, 215, 152, 0.53, 26, 116, 138, 83, false, 'Garmin Edge 540', 2, 'good', true);

-- Day 26: Long endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-18-long.tcx', '/activities/2026-01-18-long.tcx', CURRENT_DATE - 4, 'ride', 'endurance', 'Lombardy hills', 18000, 17200, 142000, 2100, 195, 420, 218, 0.76, 185, 144, 180, 84, false, 'Garmin Edge 540', 7, 'great', true);

-- Day 27: Rest

-- Day 28: Threshold
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-20-threshold.tcx', '/activities/2026-01-20-threshold.tcx', CURRENT_DATE - 2, 'ride', 'threshold', 'Over-under intervals', 5400, 5200, 43000, 480, 232, 355, 258, 0.91, 102, 160, 182, 92, false, 'Garmin Edge 540', 8, 'good', true);

-- Day 29: Endurance
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-21-endurance.tcx', '/activities/2026-01-21-endurance.tcx', CURRENT_DATE - 1, 'ride', 'endurance', 'Morning tempo', 6000, 5800, 50000, 420, 185, 295, 200, 0.70, 78, 135, 160, 88, false, 'Garmin Edge 540', 5, 'good', true);

-- Day 30: Today - Recovery
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-22-recovery.tcx', '/activities/2026-01-22-recovery.tcx', CURRENT_DATE, 'ride', 'recovery', 'Easy recovery spin', 3600, 3450, 28000, 180, 145, 220, 155, 0.54, 32, 118, 140, 85, false, 'Garmin Edge 540', 2, 'good', true);

-- Strength sessions
INSERT INTO tcx_files (athlete_id, filename, file_path, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, rpe, feeling, processed) VALUES
('00000000-0000-0000-0000-000000000001', '2026-01-05-strength.tcx', '/activities/2026-01-05-strength.tcx', CURRENT_DATE - 17, 'strength', 'endurance', 'Gym - Legs & Core', 3600, 3600, 0, 0, NULL, NULL, NULL, NULL, 35, 105, 135, NULL, true, 'Apple Watch', 6, 'good', true),
('00000000-0000-0000-0000-000000000001', '2026-01-12-strength.tcx', '/activities/2026-01-12-strength.tcx', CURRENT_DATE - 10, 'strength', 'endurance', 'Gym - Upper Body', 3000, 3000, 0, 0, NULL, NULL, NULL, NULL, 28, 98, 125, NULL, true, 'Apple Watch', 5, 'good', true),
('00000000-0000-0000-0000-000000000001', '2026-01-19-strength.tcx', '/activities/2026-01-19-strength.tcx', CURRENT_DATE - 3, 'strength', 'endurance', 'Gym - Full Body', 3600, 3600, 0, 0, NULL, NULL, NULL, NULL, 38, 108, 138, NULL, true, 'Apple Watch', 6, 'good', true);

-- ============================================
-- TRAINING LOAD - 30 days with CTL/ATL/TSB
-- Starting from a base CTL of ~60
-- ============================================

INSERT INTO training_load (athlete_id, date, tss_total, duration_total_seconds, activities_count, atl, ctl, tsb, ramp_rate, intensity_distribution) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 62, 5400, 1, 52, 58, 6, 0.8, '{"z1": 1200, "z2": 3600, "z3": 600, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 0, 0, 0, 45, 58, 13, 0.7, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 85, 4800, 1, 55, 59, 4, 0.9, '{"z1": 600, "z2": 1800, "z3": 1200, "z4": 1200, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 32, 3600, 1, 50, 59, 9, 0.8, '{"z1": 2400, "z2": 1200, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 145, 14400, 1, 68, 60, -8, 1.2, '{"z1": 3600, "z2": 7200, "z3": 2400, "z4": 1200, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 0, 0, 0, 58, 60, 2, 1.0, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 92, 4200, 1, 65, 61, -4, 1.1, '{"z1": 600, "z2": 1200, "z3": 600, "z4": 600, "z5": 1200}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 68, 5400, 1, 64, 61, -3, 1.0, '{"z1": 1200, "z2": 3000, "z3": 1200, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 0, 0, 0, 55, 61, 6, 0.9, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 88, 5400, 1, 62, 62, 0, 1.0, '{"z1": 600, "z2": 2400, "z3": 1200, "z4": 1200, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 25, 3000, 1, 54, 62, 8, 0.9, '{"z1": 2400, "z2": 600, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 162, 16200, 1, 75, 64, -11, 1.3, '{"z1": 4800, "z2": 8400, "z3": 2400, "z4": 600, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 35, 3600, 1, 68, 64, -4, 1.2, '{"z1": 1800, "z2": 1800, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 98, 4500, 1, 72, 65, -7, 1.3, '{"z1": 600, "z2": 1200, "z3": 600, "z4": 600, "z5": 1500}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 72, 6000, 1, 70, 65, -5, 1.2, '{"z1": 1800, "z2": 3600, "z3": 600, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 105, 4800, 1, 78, 66, -12, 1.4, '{"z1": 600, "z2": 1200, "z3": 1200, "z4": 1800, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 0, 0, 0, 67, 66, -1, 1.2, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 35, 3600, 1, 60, 66, 6, 1.0, '{"z1": 2400, "z2": 1200, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 155, 14400, 1, 78, 67, -11, 1.3, '{"z1": 3600, "z2": 7800, "z3": 2400, "z4": 600, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 28, 3000, 1, 70, 67, -3, 1.2, '{"z1": 1800, "z2": 1200, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 95, 5100, 1, 75, 68, -7, 1.3, '{"z1": 600, "z2": 2100, "z3": 1200, "z4": 1200, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 70, 5400, 1, 72, 68, -4, 1.2, '{"z1": 1200, "z2": 3000, "z3": 1200, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 0, 0, 0, 62, 68, 6, 1.0, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 96, 4200, 1, 70, 68, -2, 1.1, '{"z1": 600, "z2": 1200, "z3": 600, "z4": 600, "z5": 1200}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 26, 3000, 1, 62, 68, 6, 1.0, '{"z1": 2400, "z2": 600, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 185, 18000, 1, 85, 70, -15, 1.5, '{"z1": 5400, "z2": 9000, "z3": 2700, "z4": 900, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 38, 3600, 1, 78, 70, -8, 1.3, '{"z1": 1800, "z2": 1800, "z3": 0, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 102, 5400, 1, 82, 71, -11, 1.4, '{"z1": 600, "z2": 2400, "z3": 1200, "z4": 1200, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 78, 6000, 1, 80, 71, -9, 1.3, '{"z1": 1200, "z2": 3600, "z3": 1200, "z4": 0, "z5": 0}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 32, 3600, 1, 72, 71, -1, 1.2, '{"z1": 2400, "z2": 1200, "z3": 0, "z4": 0, "z5": 0}');

-- ============================================
-- LAYER 4: DAILY DATA - 30 days
-- ============================================

-- Daily Log
INSERT INTO daily_log (athlete_id, date, readiness_score, energy_score, motivation_score, mood_score, stress_score, sleep_score, nutrition_score, recovery_score, trained, tss_total, duration_total_minutes, activities_count, rest_day, sick, injured, travel_day, race_day, morning_notes, data_completeness) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 78, 7, 8, 7, 4, 82, 75, 72, true, 62, 90, 1, false, false, false, false, false, 'Felt good this morning, ready to train', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 85, 8, 7, 8, 3, 88, 80, 82, false, 0, 0, 0, true, false, false, false, false, 'Rest day, legs feeling fresh', 90),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 72, 7, 8, 7, 5, 75, 72, 68, true, 85, 80, 1, false, false, false, false, false, 'Ready for threshold session', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 68, 6, 7, 7, 4, 78, 75, 65, true, 32, 60, 1, false, false, false, false, false, 'A bit tired from yesterday', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 75, 7, 9, 8, 3, 80, 85, 70, true, 145, 240, 1, false, false, false, false, false, 'Excited for long ride!', 92),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 65, 5, 6, 7, 4, 72, 78, 58, false, 0, 0, 0, true, false, false, false, false, 'Legs tired from long ride', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 70, 6, 7, 7, 5, 76, 72, 62, true, 92, 70, 1, false, false, false, false, false, 'VO2max day - need coffee', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 72, 7, 7, 8, 4, 78, 75, 68, true, 68, 90, 1, false, false, false, false, false, 'New Years Eve ride planned', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 80, 7, 6, 8, 5, 70, 65, 72, false, 0, 0, 0, true, false, false, false, false, 'Happy New Year! Rest day', 80),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 76, 7, 8, 7, 4, 82, 78, 70, true, 88, 90, 1, false, false, false, false, false, 'First training day of the year', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 74, 7, 7, 7, 4, 80, 75, 68, true, 25, 50, 1, false, false, false, false, false, 'Easy day after threshold', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 82, 8, 9, 8, 3, 85, 82, 78, true, 162, 270, 1, false, false, false, false, false, 'Perfect weather for long ride!', 92),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 68, 6, 7, 7, 4, 75, 72, 62, true, 35, 60, 1, false, false, false, false, false, 'Gym day - legs heavy', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 70, 6, 8, 7, 5, 72, 70, 64, true, 98, 75, 1, false, false, false, false, false, 'Ready for VO2 work', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 72, 7, 7, 7, 4, 78, 75, 68, true, 72, 100, 1, false, false, false, false, false, 'Solid endurance day', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 78, 8, 9, 8, 3, 85, 80, 75, true, 105, 80, 1, false, false, false, false, false, 'FTP TEST DAY!', 95),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 60, 5, 6, 6, 4, 70, 72, 55, false, 0, 0, 0, true, false, false, false, false, 'Recovery after test', 80),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 72, 7, 7, 7, 4, 78, 75, 68, true, 35, 60, 1, false, false, false, false, false, 'Legs opener ride', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 80, 8, 8, 8, 3, 82, 80, 76, true, 155, 240, 1, false, false, false, false, false, 'Group ride day!', 90),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 68, 6, 7, 7, 4, 75, 72, 62, true, 28, 50, 1, false, false, false, false, false, 'Gym upper body', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 74, 7, 8, 7, 4, 80, 78, 70, true, 95, 85, 1, false, false, false, false, false, 'Threshold intervals planned', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 76, 7, 7, 8, 4, 78, 75, 72, true, 70, 90, 1, false, false, false, false, false, 'Easy ride with sprints', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 82, 8, 7, 8, 3, 85, 80, 78, false, 0, 0, 0, true, false, false, false, false, 'Full rest day', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 75, 7, 8, 7, 4, 78, 75, 70, true, 96, 70, 1, false, false, false, false, false, 'VO2max session', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 72, 7, 7, 7, 4, 80, 78, 68, true, 26, 50, 1, false, false, false, false, false, 'Recovery spin', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 78, 8, 9, 8, 3, 82, 85, 75, true, 185, 300, 1, false, false, false, false, false, 'Big day in the hills!', 92),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 65, 5, 6, 7, 5, 72, 70, 58, true, 38, 60, 1, false, false, false, false, false, 'Tired but gym done', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 72, 7, 8, 7, 4, 78, 75, 68, true, 102, 90, 1, false, false, false, false, false, 'Over-under day', 88),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 75, 7, 7, 7, 4, 80, 78, 70, true, 78, 100, 1, false, false, false, false, false, 'Morning tempo', 85),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 78, 7, 8, 8, 3, 82, 80, 74, true, 32, 60, 1, false, false, false, false, false, 'Easy recovery day', 88);

-- Daily Sleep - 30 days
INSERT INTO daily_sleep (athlete_id, date, time_in_bed_minutes, total_sleep_minutes, sleep_efficiency_pct, bedtime, sleep_onset, wake_time, sleep_latency_minutes, deep_sleep_minutes, rem_sleep_minutes, light_sleep_minutes, awake_minutes, sleep_score, restfulness_score, awakenings_count, avg_hr_sleeping, lowest_hr, hrv_avg, hrv_rmssd, respiratory_rate, skin_temperature_deviation, sleep_quality_feel, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 480, 445, 92.7, (CURRENT_DATE - 29)::timestamp + TIME '22:30', (CURRENT_DATE - 29)::timestamp + TIME '22:45', (CURRENT_DATE - 28)::timestamp + TIME '06:30', 15, 98, 105, 212, 30, 82, 78, 2, 52, 45, 58, 62.5, 14.2, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 510, 478, 93.7, (CURRENT_DATE - 28)::timestamp + TIME '22:00', (CURRENT_DATE - 28)::timestamp + TIME '22:12', (CURRENT_DATE - 27)::timestamp + TIME '06:30', 12, 112, 115, 224, 27, 88, 85, 1, 50, 44, 62, 68.2, 13.8, -0.1, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 450, 408, 90.7, (CURRENT_DATE - 27)::timestamp + TIME '23:00', (CURRENT_DATE - 27)::timestamp + TIME '23:18', (CURRENT_DATE - 26)::timestamp + TIME '06:30', 18, 85, 95, 198, 30, 75, 72, 3, 54, 47, 52, 55.8, 14.5, 0.2, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 465, 428, 92.0, (CURRENT_DATE - 26)::timestamp + TIME '22:45', (CURRENT_DATE - 26)::timestamp + TIME '23:00', (CURRENT_DATE - 25)::timestamp + TIME '06:30', 15, 92, 100, 206, 30, 78, 75, 2, 53, 46, 55, 58.5, 14.3, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 480, 450, 93.8, (CURRENT_DATE - 25)::timestamp + TIME '22:00', (CURRENT_DATE - 25)::timestamp + TIME '22:10', (CURRENT_DATE - 24)::timestamp + TIME '06:00', 10, 105, 110, 210, 25, 80, 78, 2, 51, 45, 60, 65.2, 14.0, 0.0, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 435, 392, 90.1, (CURRENT_DATE - 24)::timestamp + TIME '23:15', (CURRENT_DATE - 24)::timestamp + TIME '23:35', (CURRENT_DATE - 23)::timestamp + TIME '06:30', 20, 78, 88, 196, 30, 72, 68, 3, 56, 48, 48, 50.5, 14.8, 0.3, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 458, 420, 91.7, (CURRENT_DATE - 23)::timestamp + TIME '22:30', (CURRENT_DATE - 23)::timestamp + TIME '22:48', (CURRENT_DATE - 22)::timestamp + TIME '06:08', 18, 88, 98, 204, 30, 76, 73, 2, 54, 47, 54, 57.8, 14.4, 0.2, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 465, 432, 92.9, (CURRENT_DATE - 22)::timestamp + TIME '22:15', (CURRENT_DATE - 22)::timestamp + TIME '22:28', (CURRENT_DATE - 21)::timestamp + TIME '06:00', 13, 95, 102, 208, 27, 78, 76, 2, 52, 46, 56, 60.2, 14.2, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 420, 378, 90.0, (CURRENT_DATE - 21)::timestamp + TIME '01:00', (CURRENT_DATE - 21)::timestamp + TIME '01:25', (CURRENT_DATE - 21)::timestamp + TIME '08:00', 25, 72, 85, 191, 30, 70, 65, 4, 58, 50, 45, 48.2, 15.0, 0.4, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 495, 462, 93.3, (CURRENT_DATE - 20)::timestamp + TIME '22:00', (CURRENT_DATE - 20)::timestamp + TIME '22:12', (CURRENT_DATE - 19)::timestamp + TIME '06:15', 12, 108, 112, 218, 24, 82, 80, 1, 50, 44, 60, 65.5, 13.9, -0.1, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 480, 445, 92.7, (CURRENT_DATE - 19)::timestamp + TIME '22:15', (CURRENT_DATE - 19)::timestamp + TIME '22:30', (CURRENT_DATE - 18)::timestamp + TIME '06:15', 15, 98, 105, 215, 27, 80, 77, 2, 52, 45, 58, 62.0, 14.1, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 510, 480, 94.1, (CURRENT_DATE - 18)::timestamp + TIME '21:45', (CURRENT_DATE - 18)::timestamp + TIME '21:55', (CURRENT_DATE - 17)::timestamp + TIME '06:15', 10, 115, 118, 222, 25, 85, 82, 1, 49, 43, 64, 70.5, 13.7, -0.2, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 450, 405, 90.0, (CURRENT_DATE - 17)::timestamp + TIME '23:00', (CURRENT_DATE - 17)::timestamp + TIME '23:20', (CURRENT_DATE - 16)::timestamp + TIME '06:30', 20, 82, 92, 201, 30, 75, 72, 3, 55, 48, 50, 53.5, 14.6, 0.2, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 442, 398, 90.0, (CURRENT_DATE - 16)::timestamp + TIME '23:10', (CURRENT_DATE - 16)::timestamp + TIME '23:28', (CURRENT_DATE - 15)::timestamp + TIME '06:32', 18, 80, 90, 198, 30, 72, 70, 3, 56, 49, 48, 51.2, 14.7, 0.3, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 470, 438, 93.2, (CURRENT_DATE - 15)::timestamp + TIME '22:20', (CURRENT_DATE - 15)::timestamp + TIME '22:32', (CURRENT_DATE - 14)::timestamp + TIME '06:10', 12, 96, 104, 212, 26, 78, 76, 2, 52, 46, 56, 60.0, 14.2, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 510, 478, 93.7, (CURRENT_DATE - 14)::timestamp + TIME '21:30', (CURRENT_DATE - 14)::timestamp + TIME '21:42', (CURRENT_DATE - 13)::timestamp + TIME '06:00', 12, 112, 115, 226, 25, 85, 82, 1, 49, 43, 62, 68.0, 13.8, -0.1, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 420, 375, 89.3, (CURRENT_DATE - 13)::timestamp + TIME '23:30', (CURRENT_DATE - 13)::timestamp + TIME '23:52', (CURRENT_DATE - 12)::timestamp + TIME '06:30', 22, 70, 82, 193, 30, 70, 66, 4, 58, 50, 44, 47.5, 15.1, 0.4, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 465, 428, 92.0, (CURRENT_DATE - 12)::timestamp + TIME '22:30', (CURRENT_DATE - 12)::timestamp + TIME '22:45', (CURRENT_DATE - 11)::timestamp + TIME '06:15', 15, 92, 100, 208, 28, 78, 75, 2, 53, 46, 55, 58.5, 14.3, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 495, 462, 93.3, (CURRENT_DATE - 11)::timestamp + TIME '22:00', (CURRENT_DATE - 11)::timestamp + TIME '22:12', (CURRENT_DATE - 10)::timestamp + TIME '06:15', 12, 108, 112, 218, 24, 82, 80, 1, 50, 44, 60, 65.5, 13.9, -0.1, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 450, 405, 90.0, (CURRENT_DATE - 10)::timestamp + TIME '23:00', (CURRENT_DATE - 10)::timestamp + TIME '23:18', (CURRENT_DATE - 9)::timestamp + TIME '06:30', 18, 82, 92, 201, 30, 75, 72, 3, 55, 48, 50, 53.5, 14.6, 0.2, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 480, 448, 93.3, (CURRENT_DATE - 9)::timestamp + TIME '22:15', (CURRENT_DATE - 9)::timestamp + TIME '22:27', (CURRENT_DATE - 8)::timestamp + TIME '06:15', 12, 100, 108, 215, 25, 80, 78, 2, 51, 45, 58, 62.8, 14.0, 0.0, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 465, 430, 92.5, (CURRENT_DATE - 8)::timestamp + TIME '22:30', (CURRENT_DATE - 8)::timestamp + TIME '22:45', (CURRENT_DATE - 7)::timestamp + TIME '06:15', 15, 94, 102, 207, 27, 78, 76, 2, 52, 46, 56, 60.2, 14.2, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 525, 495, 94.3, (CURRENT_DATE - 7)::timestamp + TIME '21:45', (CURRENT_DATE - 7)::timestamp + TIME '21:55', (CURRENT_DATE - 6)::timestamp + TIME '06:30', 10, 118, 120, 232, 25, 85, 83, 1, 48, 42, 65, 72.0, 13.6, -0.2, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 465, 428, 92.0, (CURRENT_DATE - 6)::timestamp + TIME '22:30', (CURRENT_DATE - 6)::timestamp + TIME '22:45', (CURRENT_DATE - 5)::timestamp + TIME '06:15', 15, 92, 100, 208, 28, 78, 75, 2, 53, 46, 55, 58.5, 14.3, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 480, 450, 93.8, (CURRENT_DATE - 5)::timestamp + TIME '22:00', (CURRENT_DATE - 5)::timestamp + TIME '22:12', (CURRENT_DATE - 4)::timestamp + TIME '06:00', 12, 105, 110, 212, 25, 80, 78, 2, 51, 45, 58, 63.0, 14.0, 0.0, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 495, 465, 93.9, (CURRENT_DATE - 4)::timestamp + TIME '21:30', (CURRENT_DATE - 4)::timestamp + TIME '21:40', (CURRENT_DATE - 3)::timestamp + TIME '05:45', 10, 110, 114, 218, 23, 82, 80, 1, 50, 44, 60, 66.0, 13.9, -0.1, 5, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 435, 390, 89.7, (CURRENT_DATE - 3)::timestamp + TIME '23:15', (CURRENT_DATE - 3)::timestamp + TIME '23:35', (CURRENT_DATE - 2)::timestamp + TIME '06:30', 20, 78, 88, 194, 30, 72, 68, 3, 56, 49, 48, 51.0, 14.8, 0.3, 3, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 465, 430, 92.5, (CURRENT_DATE - 2)::timestamp + TIME '22:30', (CURRENT_DATE - 2)::timestamp + TIME '22:45', (CURRENT_DATE - 1)::timestamp + TIME '06:15', 15, 94, 102, 207, 27, 78, 76, 2, 53, 46, 55, 58.8, 14.3, 0.1, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 480, 450, 93.8, (CURRENT_DATE - 1)::timestamp + TIME '22:00', (CURRENT_DATE - 1)::timestamp + TIME '22:12', CURRENT_DATE::timestamp + TIME '06:00', 12, 105, 110, 212, 25, 80, 78, 2, 51, 45, 58, 63.0, 14.0, 0.0, 4, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 495, 465, 93.9, CURRENT_DATE::timestamp + TIME '21:45', CURRENT_DATE::timestamp + TIME '21:57', (CURRENT_DATE + 1)::timestamp + TIME '06:00', 12, 108, 112, 220, 25, 82, 80, 1, 50, 44, 60, 65.5, 13.8, -0.1, 5, 'whoop');

-- Daily Nutrition - 30 days
INSERT INTO daily_nutrition (athlete_id, date, calories_total, calories_target, protein_g, protein_target_g, carbs_g, carbs_target_g, fat_g, fat_target_g, fiber_g, sodium_mg, potassium_mg, magnesium_mg, water_liters, total_fluids_liters, meals_count, snacks_count, vegetables_servings, fruits_servings, nutrition_score, pre_workout_carbs_g, during_workout_carbs_g, during_workout_fluids_ml, post_workout_protein_g, post_workout_carbs_g, fueling_compliance, caffeine_mg, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 2450, 2600, 145, 150, 310, 325, 78, 85, 32, 2100, 3200, 380, 2.8, 3.5, 3, 2, 4, 2, 75, 40, 30, 500, 35, 60, 80, 180, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 2200, 2400, 140, 145, 260, 280, 75, 80, 28, 1800, 2800, 350, 2.5, 3.0, 3, 1, 3, 2, 80, 0, 0, 0, 0, 0, 0, 120, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 2650, 2700, 155, 155, 340, 350, 82, 85, 35, 2300, 3500, 400, 3.0, 4.0, 3, 2, 5, 3, 72, 50, 45, 600, 40, 70, 85, 200, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 2350, 2500, 142, 148, 285, 300, 76, 82, 30, 1950, 3000, 365, 2.6, 3.2, 3, 2, 4, 2, 75, 30, 15, 400, 30, 45, 75, 160, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 3200, 3400, 168, 175, 420, 450, 95, 100, 42, 2800, 4200, 480, 4.0, 5.5, 4, 3, 5, 4, 85, 80, 120, 1200, 50, 100, 90, 240, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 2300, 2500, 145, 150, 275, 300, 78, 82, 30, 1900, 2900, 360, 2.8, 3.4, 3, 2, 4, 2, 78, 0, 0, 0, 0, 0, 0, 100, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 2580, 2650, 152, 155, 325, 340, 80, 85, 33, 2200, 3300, 390, 3.0, 3.8, 3, 2, 4, 3, 72, 45, 40, 550, 38, 65, 82, 220, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 2500, 2600, 148, 152, 315, 330, 79, 84, 32, 2100, 3150, 375, 2.9, 3.6, 3, 2, 4, 2, 75, 40, 35, 500, 35, 55, 78, 180, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 2800, 2400, 135, 145, 380, 280, 92, 80, 25, 2500, 2600, 320, 2.2, 3.5, 4, 3, 2, 1, 65, 0, 0, 0, 0, 0, 0, 80, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 2550, 2650, 150, 155, 325, 340, 80, 85, 34, 2150, 3250, 385, 3.0, 3.8, 3, 2, 5, 3, 78, 45, 35, 500, 38, 60, 80, 200, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 2380, 2500, 144, 148, 290, 305, 77, 82, 31, 1980, 3050, 368, 2.7, 3.3, 3, 2, 4, 2, 75, 25, 10, 300, 28, 40, 72, 150, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 3350, 3500, 172, 180, 445, 470, 98, 105, 45, 2900, 4400, 500, 4.2, 5.8, 4, 3, 6, 4, 82, 85, 130, 1300, 52, 105, 88, 260, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 2420, 2550, 146, 150, 298, 315, 78, 83, 31, 2000, 3100, 370, 2.8, 3.4, 3, 2, 4, 2, 72, 30, 0, 0, 32, 50, 75, 160, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 2620, 2700, 154, 158, 335, 350, 82, 87, 34, 2250, 3400, 395, 3.1, 4.0, 3, 2, 5, 3, 70, 50, 45, 580, 40, 68, 82, 210, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 2520, 2620, 150, 154, 320, 335, 80, 85, 33, 2120, 3220, 382, 2.9, 3.7, 3, 2, 4, 3, 75, 42, 30, 480, 36, 58, 78, 185, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 2700, 2800, 158, 162, 350, 365, 84, 88, 36, 2350, 3550, 410, 3.2, 4.2, 3, 2, 5, 3, 80, 55, 40, 550, 42, 72, 85, 220, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 2280, 2450, 142, 148, 275, 295, 76, 81, 29, 1880, 2880, 355, 2.6, 3.2, 3, 2, 4, 2, 72, 0, 0, 0, 0, 0, 0, 120, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 2400, 2520, 145, 150, 295, 310, 78, 82, 31, 2000, 3050, 368, 2.7, 3.4, 3, 2, 4, 2, 75, 32, 18, 380, 30, 48, 76, 165, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 3280, 3450, 170, 178, 435, 460, 96, 102, 44, 2850, 4300, 490, 4.1, 5.6, 4, 3, 5, 4, 80, 82, 125, 1250, 50, 100, 86, 250, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 2350, 2500, 143, 148, 285, 300, 77, 82, 30, 1950, 2980, 362, 2.6, 3.2, 3, 2, 4, 2, 72, 28, 0, 0, 30, 45, 74, 155, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 2650, 2750, 156, 160, 340, 355, 83, 88, 35, 2280, 3450, 402, 3.1, 4.0, 3, 2, 5, 3, 78, 52, 42, 560, 40, 68, 82, 205, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 2480, 2580, 148, 152, 312, 328, 79, 84, 32, 2080, 3180, 378, 2.9, 3.6, 3, 2, 4, 2, 75, 38, 32, 480, 34, 55, 78, 175, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 2350, 2500, 145, 150, 285, 300, 78, 82, 30, 1920, 2920, 358, 2.7, 3.3, 3, 2, 4, 2, 80, 0, 0, 0, 0, 0, 0, 100, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 2600, 2700, 153, 158, 332, 348, 82, 87, 34, 2220, 3380, 395, 3.0, 3.9, 3, 2, 5, 3, 75, 48, 42, 550, 38, 65, 80, 200, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 2380, 2500, 144, 148, 290, 305, 77, 82, 31, 1980, 3020, 365, 2.7, 3.3, 3, 2, 4, 2, 78, 25, 12, 320, 28, 42, 74, 145, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 3450, 3600, 178, 185, 460, 485, 102, 108, 48, 3000, 4550, 520, 4.5, 6.2, 4, 3, 6, 4, 85, 90, 140, 1400, 55, 110, 90, 280, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 2380, 2520, 144, 150, 288, 305, 77, 82, 30, 1960, 3000, 362, 2.6, 3.2, 3, 2, 4, 2, 70, 28, 0, 0, 30, 45, 72, 155, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 2680, 2780, 158, 162, 345, 360, 84, 88, 36, 2300, 3480, 405, 3.2, 4.1, 3, 2, 5, 3, 75, 55, 45, 580, 42, 70, 82, 210, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 2550, 2650, 152, 156, 325, 340, 81, 86, 34, 2150, 3280, 388, 3.0, 3.8, 3, 2, 5, 3, 78, 45, 38, 520, 38, 62, 80, 195, 'myfitnesspal'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 2420, 2550, 146, 150, 298, 315, 78, 83, 32, 2020, 3100, 372, 2.8, 3.5, 3, 2, 4, 2, 80, 30, 15, 380, 32, 48, 78, 160, 'myfitnesspal');

-- Daily Wellness - 30 days
INSERT INTO daily_wellness (athlete_id, date, mood_score, anxiety_level, stress_level, motivation_training, motivation_life, focus_level, energy_level, fatigue_level, muscle_soreness, soreness_locations, legs_feeling, recovery_score, readiness_to_train, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 7, 3, 4, 8, 7, 7, 7, 4, 3, '["quads"]', 'normal', 72, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 8, 2, 3, 7, 8, 8, 8, 3, 2, '[]', 'fresh', 82, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 7, 3, 5, 8, 7, 7, 7, 4, 3, '["quads", "glutes"]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 7, 3, 4, 7, 7, 7, 6, 5, 4, '["quads"]', 'tired', 65, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 8, 2, 3, 9, 8, 8, 7, 4, 3, '[]', 'normal', 70, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 7, 3, 4, 6, 7, 6, 5, 6, 5, '["quads", "hamstrings", "lower_back"]', 'heavy', 58, 5, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 7, 4, 5, 7, 7, 6, 6, 5, 4, '["quads", "glutes"]', 'tired', 62, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 8, 3, 4, 7, 8, 7, 7, 4, 3, '["quads"]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 8, 3, 5, 6, 8, 6, 7, 4, 3, '[]', 'normal', 72, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 7, 3, 4, 8, 7, 7, 7, 4, 3, '[]', 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 7, 3, 4, 7, 7, 7, 7, 4, 3, '["quads"]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 8, 2, 3, 9, 8, 8, 8, 3, 2, '[]', 'fresh', 78, 9, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 7, 3, 4, 7, 7, 6, 6, 5, 4, '["quads", "glutes", "core"]', 'tired', 62, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 7, 4, 5, 8, 7, 6, 6, 5, 4, '["quads"]', 'tired', 64, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 7, 3, 4, 7, 7, 7, 7, 4, 3, '[]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 8, 2, 3, 9, 8, 8, 8, 3, 2, '[]', 'fresh', 75, 9, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 6, 4, 4, 6, 6, 6, 5, 6, 5, '["quads", "hamstrings"]', 'heavy', 55, 5, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 7, 3, 4, 7, 7, 7, 7, 4, 3, '["quads"]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 8, 2, 3, 8, 8, 8, 8, 3, 3, '[]', 'fresh', 76, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 7, 3, 4, 7, 7, 6, 6, 5, 4, '["shoulders", "arms"]', 'normal', 62, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 7, 3, 4, 8, 7, 7, 7, 4, 3, '[]', 'normal', 70, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 8, 3, 4, 7, 8, 7, 7, 4, 3, '["quads"]', 'normal', 72, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 8, 2, 3, 7, 8, 8, 8, 3, 2, '[]', 'fresh', 78, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 7, 3, 4, 8, 7, 7, 7, 4, 3, '[]', 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 7, 3, 4, 7, 7, 7, 7, 4, 3, '["quads"]', 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 8, 2, 3, 9, 8, 8, 8, 3, 2, '[]', 'fresh', 75, 9, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 7, 4, 5, 6, 7, 6, 5, 6, 5, '["quads", "hamstrings", "glutes", "core"]', 'heavy', 58, 5, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 7, 3, 4, 8, 7, 7, 7, 4, 4, '["quads"]', 'tired', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 7, 3, 4, 7, 7, 7, 7, 4, 3, '[]', 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 8, 2, 3, 8, 8, 8, 7, 4, 3, '[]', 'normal', 74, 8, 'manual');

-- Daily Biometrics - 30 days
INSERT INTO daily_biometrics (athlete_id, date, measurement_time, resting_hr, hrv_rmssd, hrv_score, weight_kg, body_fat_pct, blood_pressure_systolic, blood_pressure_diastolic, blood_oxygen_pct, respiratory_rate, body_temperature_c, steps_count, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, (CURRENT_DATE - 29)::timestamp + TIME '06:30', 48, 62.5, 72, 72.8, 12.5, 118, 72, 98.2, 14.2, 36.5, 8500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, (CURRENT_DATE - 28)::timestamp + TIME '06:30', 47, 68.2, 78, 72.6, 12.4, 116, 70, 98.5, 13.8, 36.4, 6200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, (CURRENT_DATE - 27)::timestamp + TIME '06:30', 49, 55.8, 65, 72.7, 12.5, 120, 74, 98.0, 14.5, 36.6, 9100, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, (CURRENT_DATE - 26)::timestamp + TIME '06:30', 50, 58.5, 68, 72.5, 12.4, 118, 72, 98.2, 14.3, 36.5, 7800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, (CURRENT_DATE - 25)::timestamp + TIME '06:00', 48, 65.2, 75, 72.4, 12.3, 116, 70, 98.4, 14.0, 36.4, 12500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, (CURRENT_DATE - 24)::timestamp + TIME '06:30', 52, 50.5, 58, 72.2, 12.2, 122, 76, 97.8, 14.8, 36.7, 5800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, (CURRENT_DATE - 23)::timestamp + TIME '06:08', 51, 57.8, 66, 72.3, 12.3, 120, 74, 98.0, 14.4, 36.6, 8200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, (CURRENT_DATE - 22)::timestamp + TIME '06:00', 49, 60.2, 70, 72.4, 12.4, 118, 72, 98.2, 14.2, 36.5, 9500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, (CURRENT_DATE - 21)::timestamp + TIME '08:00', 52, 48.2, 55, 72.8, 12.6, 124, 78, 97.6, 15.0, 36.8, 4500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, (CURRENT_DATE - 20)::timestamp + TIME '06:15', 48, 65.5, 76, 72.5, 12.4, 116, 70, 98.4, 13.9, 36.4, 8800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, (CURRENT_DATE - 19)::timestamp + TIME '06:15', 49, 62.0, 72, 72.4, 12.3, 118, 72, 98.2, 14.1, 36.5, 7200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, (CURRENT_DATE - 18)::timestamp + TIME '06:15', 47, 70.5, 82, 72.2, 12.2, 114, 68, 98.6, 13.7, 36.3, 13200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, (CURRENT_DATE - 17)::timestamp + TIME '06:30', 50, 53.5, 62, 72.3, 12.3, 120, 74, 98.0, 14.6, 36.6, 7500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, (CURRENT_DATE - 16)::timestamp + TIME '06:32', 51, 51.2, 60, 72.4, 12.4, 122, 76, 97.8, 14.7, 36.7, 8600, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, (CURRENT_DATE - 15)::timestamp + TIME '06:10', 49, 60.0, 70, 72.3, 12.3, 118, 72, 98.2, 14.2, 36.5, 9200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, (CURRENT_DATE - 14)::timestamp + TIME '06:00', 47, 68.0, 78, 72.2, 12.2, 114, 68, 98.5, 13.8, 36.4, 8500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, (CURRENT_DATE - 13)::timestamp + TIME '06:30', 53, 47.5, 54, 72.4, 12.4, 124, 78, 97.6, 15.1, 36.8, 5200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, (CURRENT_DATE - 12)::timestamp + TIME '06:15', 49, 58.5, 68, 72.3, 12.3, 118, 72, 98.1, 14.3, 36.5, 7800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, (CURRENT_DATE - 11)::timestamp + TIME '06:15', 47, 65.5, 76, 72.1, 12.1, 114, 68, 98.5, 13.9, 36.3, 12800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, (CURRENT_DATE - 10)::timestamp + TIME '06:30', 50, 53.5, 62, 72.2, 12.2, 120, 74, 98.0, 14.6, 36.6, 7200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, (CURRENT_DATE - 9)::timestamp + TIME '06:15', 48, 62.8, 73, 72.3, 12.3, 116, 70, 98.3, 14.0, 36.4, 9000, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, (CURRENT_DATE - 8)::timestamp + TIME '06:15', 49, 60.2, 70, 72.4, 12.4, 118, 72, 98.2, 14.2, 36.5, 9400, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, (CURRENT_DATE - 7)::timestamp + TIME '06:30', 46, 72.0, 84, 72.2, 12.2, 112, 66, 98.7, 13.6, 36.2, 5500, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, (CURRENT_DATE - 6)::timestamp + TIME '06:15', 49, 58.5, 68, 72.3, 12.3, 118, 72, 98.1, 14.3, 36.5, 8400, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, (CURRENT_DATE - 5)::timestamp + TIME '06:00', 48, 63.0, 74, 72.4, 12.4, 116, 70, 98.4, 14.0, 36.4, 7000, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, (CURRENT_DATE - 4)::timestamp + TIME '05:45', 47, 66.0, 76, 72.2, 12.2, 114, 68, 98.5, 13.9, 36.3, 14200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, (CURRENT_DATE - 3)::timestamp + TIME '06:30', 52, 51.0, 58, 72.0, 12.0, 124, 78, 97.7, 14.8, 36.7, 7800, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, (CURRENT_DATE - 2)::timestamp + TIME '06:15', 49, 58.8, 68, 72.2, 12.2, 118, 72, 98.1, 14.3, 36.5, 9200, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, CURRENT_DATE::timestamp + TIME '06:00', 48, 63.0, 74, 72.3, 12.3, 116, 70, 98.4, 14.0, 36.4, 9600, 'whoop'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, (CURRENT_DATE + 1)::timestamp + TIME '06:00', 48, 65.5, 76, 72.5, 12.4, 115, 69, 98.5, 13.8, 36.3, 7200, 'whoop');

-- ============================================
-- WEEKLY SUMMARIES - 52 weeks (1 year)
-- Shows progression from base building through race season
-- ============================================

-- Helper: Generate week_start dates (Mondays) going back 52 weeks
-- Most recent 12 weeks with detailed data
INSERT INTO weekly_summary (athlete_id, week_start, week_end, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, training_days, rest_days, longest_activity_hours, highest_tss_day, intensity_distribution, compliance_pct, avg_daily_tss, tss_trend, week_vs_last_week_pct, atl_end, ctl_end, tsb_end, avg_sleep_hours, avg_sleep_score, avg_hrv, hrv_trend, avg_energy, avg_stress, avg_mood, avg_soreness, avg_readiness, high_stress_days, low_energy_days, weight_start_kg, weight_end_kg, week_rating, biggest_win, biggest_challenge, lucy_summary, data_completeness_pct) VALUES
-- Week 1 (most recent - current week in progress)
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date, date_trunc('week', CURRENT_DATE)::date + 6, 420, 9.5, 285, 2200, 5, 4, 3, 5.0, 185, '{"z1": 15, "z2": 55, "z3": 18, "z4": 10, "z5": 2}', 85, 84, 'stable', 5.2, 72, 71, -1, 7.6, 80, 60, 'stable', 7.2, 3.8, 7.5, 3.2, 72, 0, 0, 72.5, 72.5, 'good', 'Solid consistency', 'Managing fatigue from big weekend', 'Good week so far. Keep the intensity manageable.', 88),
-- Week 2
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 7, date_trunc('week', CURRENT_DATE)::date - 1, 485, 11.2, 340, 2850, 6, 5, 2, 5.0, 185, '{"z1": 14, "z2": 52, "z3": 20, "z4": 12, "z5": 2}', 88, 81, 'increasing', 8.5, 85, 70, -15, 7.5, 78, 58, 'stable', 7.0, 4.0, 7.4, 3.5, 70, 1, 0, 72.4, 72.2, 'great', 'Big 5hr ride in the hills', 'Recovery after big volume', 'Strong week with good quality. The long ride was a highlight.', 92),
-- Week 3
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 14, date_trunc('week', CURRENT_DATE)::date - 8, 445, 10.5, 315, 2400, 5, 4, 3, 4.5, 162, '{"z1": 16, "z2": 54, "z3": 18, "z4": 10, "z5": 2}', 82, 74, 'stable', 2.3, 78, 67, -11, 7.6, 79, 56, 'stable', 7.1, 3.9, 7.5, 3.3, 71, 0, 0, 72.3, 72.4, 'good', 'Group ride with climbing', 'Balancing intensity', 'Solid week. Good mix of endurance and intensity.', 90),
-- Week 4
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 21, date_trunc('week', CURRENT_DATE)::date - 15, 520, 12.0, 365, 3100, 6, 5, 2, 4.5, 155, '{"z1": 15, "z2": 50, "z3": 20, "z4": 12, "z5": 3}', 90, 87, 'increasing', 12.5, 82, 68, -14, 7.4, 77, 55, 'stable', 6.9, 4.2, 7.3, 3.8, 68, 1, 1, 72.2, 72.2, 'great', 'FTP test - new PR!', 'Managing post-test fatigue', 'Breakthrough week! FTP up to 285W. Well-timed test after recovery.', 95),
-- Week 5
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 28, date_trunc('week', CURRENT_DATE)::date - 22, 380, 8.8, 260, 1950, 5, 4, 3, 4.0, 92, '{"z1": 18, "z2": 58, "z3": 15, "z4": 8, "z5": 1}', 78, 63, 'decreasing', -15.2, 68, 64, -4, 7.8, 82, 62, 'improving', 7.5, 3.5, 7.8, 2.8, 76, 0, 0, 72.4, 72.3, 'good', 'Good recovery', 'Holding back before test', 'Recovery week executed well. Fresh for upcoming test.', 85),
-- Week 6
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 35, date_trunc('week', CURRENT_DATE)::date - 29, 465, 10.8, 325, 2600, 6, 5, 2, 4.5, 145, '{"z1": 15, "z2": 52, "z3": 19, "z4": 11, "z5": 3}', 85, 78, 'stable', 5.8, 75, 65, -10, 7.5, 78, 56, 'stable', 7.0, 4.0, 7.4, 3.5, 70, 1, 0, 72.5, 72.4, 'good', 'Consistent training block', 'Weather challenges', 'Good consistency despite rain. Indoor sessions were productive.', 88),
-- Week 7
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 42, date_trunc('week', CURRENT_DATE)::date - 36, 495, 11.5, 350, 2900, 6, 5, 2, 5.0, 165, '{"z1": 14, "z2": 50, "z3": 21, "z4": 12, "z5": 3}', 88, 83, 'increasing', 10.2, 78, 66, -12, 7.4, 76, 54, 'stable', 6.8, 4.2, 7.3, 3.8, 68, 1, 1, 72.6, 72.5, 'great', 'Strong VO2max session', 'Sleep quality dipped', 'High quality week. VO2max work going well.', 90),
-- Week 8
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 49, date_trunc('week', CURRENT_DATE)::date - 43, 440, 10.2, 305, 2350, 5, 4, 3, 4.0, 135, '{"z1": 16, "z2": 54, "z3": 18, "z4": 10, "z5": 2}', 82, 73, 'stable', -2.5, 72, 64, -8, 7.6, 79, 58, 'stable', 7.2, 3.8, 7.5, 3.2, 72, 0, 0, 72.7, 72.6, 'good', 'Good endurance base', 'Motivation dip mid-week', 'Solid week. Base building continues.', 88),
-- Weeks 9-12 (November-December)
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 56, date_trunc('week', CURRENT_DATE)::date - 50, 420, 9.8, 290, 2100, 5, 4, 3, 4.0, 125, '{"z1": 17, "z2": 55, "z3": 17, "z4": 9, "z5": 2}', 80, 70, 'stable', 0.0, 70, 63, -7, 7.7, 80, 60, 'stable', 7.3, 3.6, 7.6, 3.0, 74, 0, 0, 72.8, 72.7, 'good', 'Consistent training', 'Cold weather adaptation', 'Good week despite cold. Indoor trainer working well.', 85),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 63, date_trunc('week', CURRENT_DATE)::date - 57, 455, 10.6, 315, 2450, 5, 4, 3, 4.5, 145, '{"z1": 15, "z2": 52, "z3": 19, "z4": 11, "z5": 3}', 84, 76, 'increasing', 8.3, 74, 62, -12, 7.5, 78, 56, 'stable', 7.0, 4.0, 7.4, 3.4, 70, 1, 0, 72.9, 72.8, 'good', 'Sweet spot work', 'Managing work stress', 'Good training week. Sweet spot sessions on point.', 88),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 70, date_trunc('week', CURRENT_DATE)::date - 64, 380, 8.8, 255, 1850, 4, 3, 4, 4.0, 110, '{"z1": 18, "z2": 58, "z3": 15, "z4": 8, "z5": 1}', 75, 63, 'decreasing', -12.5, 65, 60, -5, 7.8, 82, 62, 'improving', 7.5, 3.4, 7.8, 2.8, 76, 0, 0, 73.0, 72.9, 'ok', 'Recovery focus', 'Holiday schedule', 'Light week due to holidays. Good mental break.', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 77, date_trunc('week', CURRENT_DATE)::date - 71, 410, 9.5, 280, 2000, 5, 4, 3, 4.0, 120, '{"z1": 17, "z2": 55, "z3": 17, "z4": 9, "z5": 2}', 80, 68, 'stable', 2.5, 68, 59, -9, 7.6, 80, 58, 'stable', 7.2, 3.8, 7.5, 3.2, 72, 0, 0, 73.2, 73.0, 'good', 'Back to routine', 'Post-holiday fitness', 'Getting back into rhythm after holidays.', 85);

-- Weeks 13-24 (October - August, working backwards - Build/Race prep phase)
INSERT INTO weekly_summary (athlete_id, week_start, week_end, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, training_days, rest_days, atl_end, ctl_end, tsb_end, avg_sleep_hours, avg_hrv, avg_energy, avg_stress, week_rating, lucy_summary, data_completeness_pct) VALUES
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 84, date_trunc('week', CURRENT_DATE)::date - 78, 435, 10.0, 300, 2200, 5, 4, 3, 70, 58, -12, 7.5, 56, 7.0, 4.0, 'good', 'Building back after off-season', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 91, date_trunc('week', CURRENT_DATE)::date - 85, 390, 9.0, 270, 1900, 5, 4, 3, 65, 56, -9, 7.6, 58, 7.2, 3.8, 'good', 'Steady base building', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 98, date_trunc('week', CURRENT_DATE)::date - 92, 360, 8.5, 250, 1750, 4, 3, 4, 60, 55, -5, 7.7, 60, 7.4, 3.5, 'ok', 'Easy week - recovery focus', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 105, date_trunc('week', CURRENT_DATE)::date - 99, 420, 9.8, 295, 2100, 5, 4, 3, 68, 56, -12, 7.5, 55, 7.0, 4.2, 'good', 'Good threshold work', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 112, date_trunc('week', CURRENT_DATE)::date - 106, 480, 11.0, 335, 2600, 6, 5, 2, 75, 58, -17, 7.3, 52, 6.8, 4.5, 'great', 'Big training week', 85),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 119, date_trunc('week', CURRENT_DATE)::date - 113, 450, 10.5, 315, 2400, 5, 4, 3, 72, 57, -15, 7.4, 54, 6.9, 4.3, 'good', 'Solid training block', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 126, date_trunc('week', CURRENT_DATE)::date - 120, 520, 12.0, 365, 2950, 6, 5, 2, 80, 60, -20, 7.2, 50, 6.6, 4.8, 'great', 'Peak training volume', 88),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 133, date_trunc('week', CURRENT_DATE)::date - 127, 380, 8.8, 260, 1900, 4, 3, 4, 65, 58, -7, 7.8, 62, 7.5, 3.2, 'good', 'Taper week - race prep', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 140, date_trunc('week', CURRENT_DATE)::date - 134, 550, 12.5, 385, 3200, 6, 5, 2, 85, 62, -23, 7.0, 48, 6.4, 5.0, 'great', 'Race week - A race!', 90),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 147, date_trunc('week', CURRENT_DATE)::date - 141, 490, 11.2, 340, 2750, 6, 5, 2, 78, 60, -18, 7.3, 52, 6.8, 4.5, 'good', 'Final build before race', 85),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 154, date_trunc('week', CURRENT_DATE)::date - 148, 465, 10.8, 325, 2550, 5, 4, 3, 74, 58, -16, 7.4, 54, 7.0, 4.2, 'good', 'Quality intensity work', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 161, date_trunc('week', CURRENT_DATE)::date - 155, 510, 11.8, 355, 2850, 6, 5, 2, 80, 59, -21, 7.2, 50, 6.6, 4.7, 'great', 'Big volume week', 85);

-- Weeks 25-40 (May - February, Build phase & early season)
INSERT INTO weekly_summary (athlete_id, week_start, week_end, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, training_days, rest_days, atl_end, ctl_end, tsb_end, avg_sleep_hours, avg_hrv, week_rating, lucy_summary, data_completeness_pct) VALUES
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 168, date_trunc('week', CURRENT_DATE)::date - 162, 440, 10.2, 305, 2300, 5, 4, 3, 72, 56, -16, 7.4, 55, 'good', 'Solid build week', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 175, date_trunc('week', CURRENT_DATE)::date - 169, 480, 11.0, 335, 2600, 6, 5, 2, 76, 57, -19, 7.3, 53, 'great', 'Strong training', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 182, date_trunc('week', CURRENT_DATE)::date - 176, 350, 8.2, 245, 1750, 4, 3, 4, 58, 54, -4, 7.8, 62, 'ok', 'Recovery week', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 189, date_trunc('week', CURRENT_DATE)::date - 183, 425, 9.8, 295, 2150, 5, 4, 3, 70, 55, -15, 7.5, 56, 'good', 'Good progression', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 196, date_trunc('week', CURRENT_DATE)::date - 190, 460, 10.6, 320, 2450, 5, 4, 3, 74, 56, -18, 7.4, 54, 'good', 'Threshold focus', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 203, date_trunc('week', CURRENT_DATE)::date - 197, 495, 11.4, 345, 2700, 6, 5, 2, 78, 57, -21, 7.2, 52, 'great', 'Big week', 85),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 210, date_trunc('week', CURRENT_DATE)::date - 204, 380, 8.8, 265, 1900, 4, 3, 4, 62, 55, -7, 7.7, 60, 'good', 'Deload', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 217, date_trunc('week', CURRENT_DATE)::date - 211, 435, 10.0, 300, 2200, 5, 4, 3, 70, 54, -16, 7.5, 56, 'good', 'Build phase', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 224, date_trunc('week', CURRENT_DATE)::date - 218, 470, 10.8, 325, 2500, 5, 4, 3, 75, 55, -20, 7.3, 54, 'great', 'Strong week', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 231, date_trunc('week', CURRENT_DATE)::date - 225, 400, 9.2, 280, 2000, 5, 4, 3, 66, 53, -13, 7.6, 58, 'good', 'Steady progress', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 238, date_trunc('week', CURRENT_DATE)::date - 232, 365, 8.5, 255, 1800, 4, 3, 4, 60, 52, -8, 7.8, 60, 'ok', 'Light week', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 245, date_trunc('week', CURRENT_DATE)::date - 239, 420, 9.8, 290, 2100, 5, 4, 3, 68, 52, -16, 7.5, 56, 'good', 'Building', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 252, date_trunc('week', CURRENT_DATE)::date - 246, 450, 10.4, 315, 2350, 5, 4, 3, 72, 53, -19, 7.4, 54, 'good', 'Good training', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 259, date_trunc('week', CURRENT_DATE)::date - 253, 340, 7.8, 235, 1650, 4, 3, 4, 56, 51, -5, 7.9, 62, 'ok', 'Recovery', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 266, date_trunc('week', CURRENT_DATE)::date - 260, 405, 9.4, 280, 2000, 5, 4, 3, 66, 51, -15, 7.6, 57, 'good', 'Base building', 80),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 273, date_trunc('week', CURRENT_DATE)::date - 267, 380, 8.8, 265, 1850, 4, 3, 4, 62, 50, -12, 7.7, 58, 'good', 'Steady week', 78);

-- Weeks 41-52 (January - December prior year, Base/Off-season)
INSERT INTO weekly_summary (athlete_id, week_start, week_end, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, training_days, rest_days, atl_end, ctl_end, tsb_end, avg_sleep_hours, avg_hrv, week_rating, lucy_summary, data_completeness_pct) VALUES
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 280, date_trunc('week', CURRENT_DATE)::date - 274, 350, 8.0, 240, 1650, 4, 3, 4, 58, 49, -9, 7.8, 60, 'good', 'Base phase', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 287, date_trunc('week', CURRENT_DATE)::date - 281, 320, 7.4, 220, 1500, 4, 3, 4, 52, 48, -4, 7.9, 62, 'ok', 'Easy week', 75),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 294, date_trunc('week', CURRENT_DATE)::date - 288, 365, 8.4, 255, 1750, 4, 3, 4, 60, 48, -12, 7.7, 58, 'good', 'Building base', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 301, date_trunc('week', CURRENT_DATE)::date - 295, 280, 6.5, 195, 1350, 3, 2, 5, 45, 47, 2, 8.0, 65, 'ok', 'Holiday week', 70),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 308, date_trunc('week', CURRENT_DATE)::date - 302, 310, 7.2, 215, 1450, 4, 3, 4, 50, 47, -3, 7.9, 62, 'ok', 'Off-season', 75),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 315, date_trunc('week', CURRENT_DATE)::date - 309, 340, 7.8, 235, 1600, 4, 3, 4, 55, 47, -8, 7.8, 60, 'good', 'Getting going', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 322, date_trunc('week', CURRENT_DATE)::date - 316, 295, 6.8, 205, 1400, 3, 2, 5, 48, 46, -2, 8.0, 64, 'ok', 'Light week', 72),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 329, date_trunc('week', CURRENT_DATE)::date - 323, 325, 7.5, 225, 1550, 4, 3, 4, 52, 46, -6, 7.9, 62, 'good', 'Off-season base', 75),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 336, date_trunc('week', CURRENT_DATE)::date - 330, 250, 5.8, 175, 1200, 3, 2, 5, 40, 45, 5, 8.2, 68, 'ok', 'Recovery focus', 70),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 343, date_trunc('week', CURRENT_DATE)::date - 337, 360, 8.3, 250, 1700, 4, 3, 4, 58, 46, -12, 7.7, 58, 'good', 'End of season', 78),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 350, date_trunc('week', CURRENT_DATE)::date - 344, 420, 9.7, 290, 2100, 5, 4, 3, 68, 48, -20, 7.5, 55, 'great', 'Final race week', 82),
('00000000-0000-0000-0000-000000000001', date_trunc('week', CURRENT_DATE)::date - 357, date_trunc('week', CURRENT_DATE)::date - 351, 385, 8.9, 270, 1900, 4, 3, 4, 62, 50, -12, 7.6, 57, 'good', 'Race prep', 80);

-- ============================================
-- MONTHLY SUMMARIES - 12 months
-- Shows progression from 252W to 285W FTP over the year
-- ============================================

INSERT INTO monthly_summary (athlete_id, month, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, avg_weekly_tss, training_consistency_pct, ftp_start, ftp_end, ftp_change, weight_start_kg, weight_end_kg, weight_change_kg, avg_sleep_hours, avg_hrv, avg_stress, phase, month_rating, highlights, challenges, lucy_summary) VALUES
-- Current month (January 2026)
('00000000-0000-0000-0000-000000000001', date_trunc('month', CURRENT_DATE)::date, 1850, 42.5, 1180, 9200, 22, 462, 88, 280, 285, 5, 72.5, 72.5, 0, 7.5, 58, 4.0, 'build', 'great', '["FTP test - new PR at 285W", "5hr hill ride", "Consistent VO2max work"]', '["Post-holiday fatigue", "Cold weather"]', 'Excellent start to the year! FTP breakthrough to 285W. Keep building.'),
-- December 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date, 1680, 38.8, 1050, 7800, 20, 420, 82, 275, 280, 5, 72.8, 72.5, -0.3, 7.6, 56, 3.8, 'base', 'good', '["Good holiday balance", "Maintained fitness"]', '["Holiday schedule disruptions", "Travel"]', 'Solid month considering holidays. Good maintenance phase.'),
-- November 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date, 1820, 42.0, 1165, 8900, 22, 455, 85, 272, 275, 3, 73.0, 72.8, -0.2, 7.5, 55, 4.0, 'build', 'good', '["Strong threshold work", "Good indoor sessions"]', '["Weather limited outdoor rides", "Work stress"]', 'Good progression despite weather challenges.'),
-- October 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '3 months')::date, 1950, 45.0, 1280, 10200, 24, 488, 88, 268, 272, 4, 73.2, 73.0, -0.2, 7.4, 54, 4.2, 'build', 'great', '["Big volume week", "Autumn colors ride"]', '["Shorter days", "Rain"]', 'Excellent build month. Volume was on point.'),
-- September 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '4 months')::date, 2100, 48.5, 1420, 11500, 26, 525, 92, 265, 268, 3, 72.8, 73.2, 0.4, 7.3, 52, 4.5, 'peak', 'great', '["Gran Fondo race - PB!", "Peak form achieved"]', '["Managing fatigue", "Race travel"]', 'Outstanding month! Peak form for Gran Fondo race.'),
-- August 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date, 2250, 52.0, 1550, 12800, 28, 563, 94, 262, 265, 3, 72.5, 72.8, 0.3, 7.2, 50, 4.8, 'peak', 'great', '["Highest volume month", "Training camp success"]', '["Heat", "Accumulated fatigue"]', 'Peak training month! Training camp was excellent.'),
-- July 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '6 months')::date, 2050, 47.5, 1380, 11200, 25, 513, 90, 258, 262, 4, 72.8, 72.5, -0.3, 7.3, 52, 4.5, 'build', 'great', '["Mountain stage simulation", "Good climbing form"]', '["Summer heat", "Work-life balance"]', 'Strong build phase. Climbing going well.'),
-- June 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '7 months')::date, 1920, 44.5, 1290, 10400, 24, 480, 88, 255, 258, 3, 73.0, 72.8, -0.2, 7.4, 54, 4.2, 'build', 'good', '["First B race", "Good progression"]', '["Early heat wave", "Recovery issues"]', 'Good progression month with first race.'),
-- May 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '8 months')::date, 1750, 40.5, 1150, 9000, 22, 438, 85, 252, 255, 3, 73.2, 73.0, -0.2, 7.5, 56, 4.0, 'build', 'good', '["Outdoor season started", "Group rides resumed"]', '["Weather variability", "Pollen allergies"]', 'Good transition to outdoor riding.'),
-- April 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '9 months')::date, 1620, 37.5, 1050, 7800, 20, 405, 82, 250, 252, 2, 73.5, 73.2, -0.3, 7.6, 58, 3.8, 'base', 'good', '["FTP test - baseline", "First outdoor rides"]', '["Cold snaps", "Equipment issues"]', 'Good base month. FTP baseline established.'),
-- March 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '10 months')::date, 1480, 34.2, 950, 6800, 18, 370, 78, 248, 250, 2, 74.0, 73.5, -0.5, 7.7, 60, 3.5, 'base', 'good', '["Consistent indoor training", "Weight coming down"]', '["Indoor monotony", "Motivation dips"]', 'Solid base building. Weight trending down nicely.'),
-- February 2025
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '11 months')::date, 1350, 31.2, 870, 5900, 17, 338, 75, 245, 248, 3, 74.5, 74.0, -0.5, 7.8, 62, 3.2, 'base', 'ok', '["Started structured plan", "Good sleep habits"]', '["Winter blues", "Short days"]', 'Foundation building. Good habits established.');

-- ============================================
-- LAYER 5: CALENDAR & PLANNING
-- ============================================

-- Events (Races) - Past and upcoming
INSERT INTO events (athlete_id, name, date, event_type, priority, distance_km, elevation_m, expected_duration_hours, goal_time, goal_power, goal_description, course_profile, notes, result_time, result_power, result_notes) VALUES
-- Upcoming events
('00000000-0000-0000-0000-000000000001', 'Milano-Sanremo Gran Fondo', CURRENT_DATE + 85, 'gran_fondo', 'A', 185, 2200, 6.5, '5:45:00', 220, 'Finish strong, negative split', 'rolling', 'Main A race of spring season', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Bergamo-Lecco Sportive', CURRENT_DATE + 42, 'sportive', 'B', 95, 1800, 3.5, '3:15:00', 235, 'Use as race simulation', 'hilly', 'Good prep race for Sanremo', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Club TT Championship', CURRENT_DATE + 21, 'race_tt', 'B', 25, 150, 0.6, '0:35:00', 275, 'Test TT position and pacing', 'flat', 'First TT of the season', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Summer Gran Fondo', CURRENT_DATE + 150, 'gran_fondo', 'A', 165, 3500, 6.0, '5:30:00', 225, 'Target a podium finish', 'mountainous', 'Key summer goal', NULL, NULL, NULL),
-- Past events (with results)
('00000000-0000-0000-0000-000000000001', 'Autumn Gran Fondo', CURRENT_DATE - 120, 'gran_fondo', 'A', 145, 2800, 5.5, '5:00:00', 218, 'Season finale', 'mountainous', 'End of season A race', '4:52:35', 225, 'Great race! Exceeded expectations. Strong on climbs.'),
('00000000-0000-0000-0000-000000000001', 'Lago di Como Sportive', CURRENT_DATE - 150, 'sportive', 'B', 110, 2100, 4.0, '3:45:00', 225, 'Race simulation', 'hilly', 'Prep race', '3:38:22', 232, 'Felt strong. Good climbing legs.'),
('00000000-0000-0000-0000-000000000001', 'Club Road Race', CURRENT_DATE - 180, 'race_road', 'C', 65, 850, 2.0, '1:45:00', 245, 'Practice race tactics', 'rolling', 'Local club race', '1:42:15', 252, 'Good pack riding practice. 5th place.');

-- Planned workouts for next 7 days
INSERT INTO planned_workouts (athlete_id, scheduled_date, scheduled_time, workout_type, title, description, duration_planned_minutes, tss_planned, intensity_target, structure, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '07:00', 'endurance', 'Zone 2 Base', 'Easy endurance ride focusing on aerobic base', 90, 65, 'Zone 2 (65-75% FTP)', '[{"duration": 600, "intensity": "warmup"}, {"duration": 4200, "intensity": "zone2"}, {"duration": 600, "intensity": "cooldown"}]', 'Keep HR under 145'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 2, '06:30', 'threshold', '3x12min Sweet Spot', 'Sweet spot intervals with recovery between', 75, 85, '88-93% FTP', '[{"duration": 600, "intensity": "warmup"}, {"duration": 720, "intensity": "sweetspot"}, {"duration": 300, "intensity": "recovery"}, {"duration": 720, "intensity": "sweetspot"}, {"duration": 300, "intensity": "recovery"}, {"duration": 720, "intensity": "sweetspot"}, {"duration": 600, "intensity": "cooldown"}]', 'Focus on steady power'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 3, '07:00', 'recovery', 'Recovery Spin', 'Easy recovery ride, keep power very low', 45, 25, 'Zone 1 (<55% FTP)', '[{"duration": 2700, "intensity": "recovery"}]', 'Legs should feel fresh after'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 4, '06:00', 'endurance', 'Long Ride', 'Weekend long endurance ride', 240, 155, 'Zone 2-3 (65-80% FTP)', '[{"duration": 1200, "intensity": "warmup"}, {"duration": 12000, "intensity": "endurance"}, {"duration": 1200, "intensity": "cooldown"}]', 'Bring enough nutrition - 60g carbs/hr'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 5, NULL, 'recovery', 'Rest Day', 'Complete rest or very easy walk', 0, 0, NULL, NULL, 'Full recovery day'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 6, '07:00', 'vo2max', '5x3min VO2max', 'VO2max intervals at 110-120% FTP', 60, 88, '110-120% FTP', '[{"duration": 600, "intensity": "warmup"}, {"duration": 180, "intensity": "vo2max"}, {"duration": 180, "intensity": "recovery"}, {"duration": 180, "intensity": "vo2max"}, {"duration": 180, "intensity": "recovery"}, {"duration": 180, "intensity": "vo2max"}, {"duration": 180, "intensity": "recovery"}, {"duration": 180, "intensity": "vo2max"}, {"duration": 180, "intensity": "recovery"}, {"duration": 180, "intensity": "vo2max"}, {"duration": 600, "intensity": "cooldown"}]', 'Go hard! Full gas efforts'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 7, '07:00', 'endurance', 'Endurance with Tempo', 'Endurance ride with tempo blocks', 90, 72, 'Zone 2-3', '[{"duration": 600, "intensity": "warmup"}, {"duration": 1200, "intensity": "tempo"}, {"duration": 1800, "intensity": "zone2"}, {"duration": 1200, "intensity": "tempo"}, {"duration": 600, "intensity": "cooldown"}]', 'Good intensity building session');

-- Life events
INSERT INTO life_events (athlete_id, date, end_date, event_type, title, training_impact, available_hours, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 14, CURRENT_DATE + 16, 'travel', 'Work Conference', 'reduced', 1.0, 'Limited training time - pack indoor trainer'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 60, CURRENT_DATE + 67, 'vacation', 'Family Vacation', 'reduced', 2.0, 'Beach vacation - can do some running'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 30, CURRENT_DATE - 28, 'family', 'Family Visit', 'reduced', 1.5, 'In-laws visiting');

-- ============================================
-- LAYER 6: INTELLIGENCE
-- ============================================

INSERT INTO athlete_insights (athlete_id, insight_type, category, title, description, confidence, evidence, actionable, action_suggested, valid_from, valid_until) VALUES
('00000000-0000-0000-0000-000000000001', 'strength', 'training', 'Strong Threshold Power', 'Your threshold power is well developed relative to your VO2max. This is typical of riders with good time trial abilities.', 85, '{"ftp_vo2max_ratio": 0.82, "threshold_percentile": 82}', true, 'Consider targeting hilly time trials or long breakaways', CURRENT_DATE - 30, CURRENT_DATE + 60),
('00000000-0000-0000-0000-000000000001', 'weakness', 'training', 'Neuromuscular Gap', 'Your sprint power (5s) is below average compared to your FTP. This limits finishing speed and ability to respond to attacks.', 78, '{"neuromuscular_percentile": 68, "sprint_ftp_ratio": 4.04}', true, 'Add 2x weekly sprint sessions: 6-8x 10s max efforts', CURRENT_DATE - 30, CURRENT_DATE + 60),
('00000000-0000-0000-0000-000000000001', 'pattern', 'sleep', 'Sleep Consistency Issue', 'Your sleep timing varies significantly on weekends, which may impact recovery and adaptation.', 72, '{"weekend_bedtime_variance_mins": 85, "weekday_bedtime_variance_mins": 25}', true, 'Try to maintain similar sleep/wake times on weekends', CURRENT_DATE - 14, CURRENT_DATE + 30),
('00000000-0000-0000-0000-000000000001', 'recommendation', 'nutrition', 'Increase Carbs on Long Days', 'Your carb intake on long training days is slightly below optimal. This may limit performance on longer rides.', 80, '{"avg_carbs_long_days": 380, "recommended_carbs": 450}', true, 'Target 7-8g carbs per kg on rides over 3 hours', CURRENT_DATE - 7, CURRENT_DATE + 30);

INSERT INTO training_focus (athlete_id, start_date, end_date, focus_area, priority, rationale, target_metrics, progress_notes, achieved) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 60, CURRENT_DATE + 30, 'ftp', 1, 'Build threshold power for upcoming Gran Fondo', '{"ftp_target": 290, "w_per_kg_target": 4.0}', 'Good progress - FTP now at 285W', false),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 30, CURRENT_DATE + 60, 'endurance', 2, 'Increase time to exhaustion for long events', '{"tte_target_mins": 50, "3hr_power_target": 240}', 'TTE improving, now at 42 minutes', false),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, CURRENT_DATE + 90, 'weight_loss', 3, 'Gradual weight reduction to improve W/kg', '{"weight_target": 71.0, "body_fat_target": 11.5}', 'Starting at 72.5kg', false);

-- ============================================
-- LAYER 7: EQUIPMENT & FINANCE
-- ============================================

INSERT INTO equipment (athlete_id, equipment_type, name, brand, model, purchase_date, purchase_price, currency, bike_type, frame_size, frame_material, groupset, wheelset, weight_kg, service_interval_km, last_service_date, last_service_km, total_km, total_hours, status, condition, notes) VALUES
('00000000-0000-0000-0000-000000000001', 'bike', 'Race Bike', 'Specialized', 'Tarmac SL7 Expert', '2023-03-15', 5500.00, 'EUR', 'road', '56', 'carbon', 'Shimano Ultegra Di2', 'Roval Rapide CLX', 7.2, 5000, CURRENT_DATE - 45, 12500, 15800, 520, 'active', 'good', 'Main race and training bike'),
('00000000-0000-0000-0000-000000000001', 'bike', 'Gravel Bike', 'Canyon', 'Grail CF SL 8', '2024-06-20', 3200.00, 'EUR', 'gravel', '56', 'carbon', 'Shimano GRX 810', 'DT Swiss GRC 1400', 8.1, 3000, CURRENT_DATE - 90, 2800, 4200, 180, 'active', 'excellent', 'For gravel rides and winter training'),
('00000000-0000-0000-0000-000000000001', 'trainer', 'Smart Trainer', 'Wahoo', 'KICKR V6', '2024-01-10', 1200.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 320, 'active', 'excellent', 'Indoor training setup with Zwift'),
('00000000-0000-0000-0000-000000000001', 'power_meter', 'Power Meter', 'Garmin', 'Rally XC200', '2023-03-15', 850.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 520, 'active', 'good', 'Dual-sided on Race Bike'),
('00000000-0000-0000-0000-000000000001', 'helmet', 'Aero Helmet', 'Specialized', 'S-Works Evade 3', '2024-02-28', 280.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 180, 'active', 'excellent', 'Race day helmet'),
('00000000-0000-0000-0000-000000000001', 'shoes', 'Road Shoes', 'Sidi', 'Shot 2', '2023-08-10', 350.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 400, 'active', 'good', 'Main cycling shoes');

-- Recent expenses
INSERT INTO expenses (athlete_id, date, category, subcategory, description, amount, currency, vendor, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 'nutrition', 'supplements', 'SiS Beta Fuel & Recovery', 85.00, 'EUR', 'SiS Official Store', 'Monthly gel and recovery supply'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 'equipment', 'maintenance', 'Chain and cassette replacement', 120.00, 'EUR', 'Local Bike Shop', 'Race bike maintenance'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 'race_entry', NULL, 'Milano-Sanremo Gran Fondo Entry', 95.00, 'EUR', 'GranFondo Italia', 'Early bird registration'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 35, 'membership', NULL, 'Zwift Annual Subscription', 180.00, 'EUR', 'Zwift', 'Indoor training platform'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 45, 'coaching', NULL, 'TrainingPeaks Premium', 120.00, 'EUR', 'TrainingPeaks', 'Annual subscription');

-- ============================================
-- DONE! Full demo dataset complete.
-- ============================================
