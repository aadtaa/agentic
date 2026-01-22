-- Lucy AI Coach - Seed Data
-- Realistic cycling data for athlete testing
-- Run AFTER schema.sql

-- ============================================
-- ATHLETE PROFILE (Update default athlete)
-- ============================================

UPDATE athlete_profile SET
  name = 'Alex Thompson',
  preferred_name = 'Alex',
  email = 'alex@example.com',
  weight_kg = 72.5,
  height_cm = 178,
  date_of_birth = '1990-05-15',
  sex = 'male',
  competitive_level = 'amateur_elite',
  rider_type = 'All-rounder',
  rider_type_confidence = 75,
  primary_sport = 'cycling',
  training_start_date = '2019-03-01',
  timezone = 'Europe/London',
  units_preference = 'metric',
  home_location = '{"city": "London", "country": "UK", "lat": 51.5074, "lng": -0.1278, "elevation_m": 11}',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- SIGNATURE METRICS (Current power profile)
-- ============================================

INSERT INTO signature_metrics (athlete_id, recorded_at, ftp_watts, ftp_w_per_kg, critical_power_watts, critical_power_w_per_kg, w_prime_kj, w_prime_j_per_kg, pmax_watts, pmax_w_per_kg, map_watts, map_w_per_kg, max_hr, resting_hr, lthr, data_source, notes)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '7 days',
  285, 3.93,
  275, 3.79,
  22.5, 310,
  1150, 15.86,
  340, 4.69,
  192, 48, 172,
  'test',
  'Ramp test + 20min validation'
);

-- ============================================
-- POWER DURATION CURVE (Best efforts)
-- ============================================

INSERT INTO power_duration_curve (athlete_id, duration_seconds, power_watts, w_per_kg, domain, physiological_parameter, recorded_at, context) VALUES
('00000000-0000-0000-0000-000000000001', 1, 1150, 15.86, 'Extreme', 'Pmax', NOW() - INTERVAL '30 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 5, 1020, 14.07, 'Extreme', 'Sprint', NOW() - INTERVAL '45 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 15, 720, 9.93, 'Extreme', 'Anaerobic', NOW() - INTERVAL '60 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 30, 520, 7.17, 'Severe', 'Anaerobic', NOW() - INTERVAL '30 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 60, 420, 5.79, 'Severe', 'VO2max', NOW() - INTERVAL '21 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 120, 365, 5.03, 'Severe', 'VO2max', NOW() - INTERVAL '14 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 180, 340, 4.69, 'Severe', 'MAP', NOW() - INTERVAL '21 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 300, 320, 4.41, 'Heavy', 'VO2max', NOW() - INTERVAL '28 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 480, 305, 4.21, 'Heavy', 'Threshold', NOW() - INTERVAL '14 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 720, 295, 4.07, 'Heavy', 'Threshold', NOW() - INTERVAL '7 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 1200, 285, 3.93, 'Heavy', 'FTP', NOW() - INTERVAL '7 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 1800, 275, 3.79, 'Moderate', 'FTP', NOW() - INTERVAL '14 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 3600, 255, 3.52, 'Moderate', 'Endurance', NOW() - INTERVAL '30 days', 'fresh'),
('00000000-0000-0000-0000-000000000001', 5400, 240, 3.31, 'Moderate', 'Endurance', NOW() - INTERVAL '45 days', 'fatigued'),
('00000000-0000-0000-0000-000000000001', 10800, 215, 2.97, 'Moderate', 'Endurance', NOW() - INTERVAL '60 days', 'fatigued');

-- ============================================
-- SEVEN AXIS PROFILE (Radar chart data)
-- ============================================

INSERT INTO seven_axis_profile (athlete_id, recorded_at, neuromuscular_p, w_prime_p, glycolytic_p, vo2max_p, threshold_p, endurance_p, durability_p, comparison_population)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '7 days',
  65, 72, 70, 78, 82, 75, 68,
  'all'
);

-- ============================================
-- METABOLIC PROFILE
-- ============================================

INSERT INTO metabolic_profile (athlete_id, recorded_at, fractional_utilization_pct, vlamax_estimated, w_prime_cp_ratio_seconds, p1min_p20min_ratio, fat_max_watts, carb_dependency, metabolic_type)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '7 days',
  78.5, 0.45, 82, 1.47, 185,
  'Moderate', 'Balanced'
);

-- ============================================
-- DURABILITY METRICS
-- ============================================

INSERT INTO durability_metrics (athlete_id, recorded_at, retention_pct, fresh_cp_watts, fatigued_cp_watts, power_fade_5min_pct, power_fade_20min_pct, hr_power_decoupling_pct, tte_at_cp_minutes, durability_rating)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NOW() - INTERVAL '14 days',
  88.5, 275, 244, 8.2, 5.5, 4.2, 42,
  'Good'
);

-- ============================================
-- EVENTS (Upcoming and past races)
-- ============================================

INSERT INTO events (athlete_id, name, date, event_type, priority, distance_km, elevation_m, expected_duration_hours, goal_description, course_profile) VALUES
('00000000-0000-0000-0000-000000000001', 'Spring Classic Sportive', NOW() + INTERVAL '45 days', 'sportive', 'B', 160, 2200, 5.5, 'Complete strong, negative split', 'hilly'),
('00000000-0000-0000-0000-000000000001', 'Regional Road Race', NOW() + INTERVAL '90 days', 'race_road', 'A', 120, 1800, 3.5, 'Top 10 finish', 'rolling'),
('00000000-0000-0000-0000-000000000001', 'Club TT Championship', NOW() + INTERVAL '60 days', 'race_tt', 'B', 40, 150, 1.0, 'Sub 55 minutes', 'flat'),
('00000000-0000-0000-0000-000000000001', 'Autumn Gran Fondo', NOW() - INTERVAL '120 days', 'gran_fondo', 'B', 140, 2500, 5.0, 'Complete in under 5 hours', 'mountainous');

-- Update past event with results
UPDATE events SET
  result_time = '4:52:30',
  result_power = 198,
  result_notes = 'Felt strong on climbs, paced well. Lost time on descents.'
WHERE name = 'Autumn Gran Fondo' AND athlete_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- TRAINING LOAD (30 days of PMC data)
-- ============================================

INSERT INTO training_load (athlete_id, date, tss_total, duration_total_seconds, activities_count, atl, ctl, tsb, ramp_rate, intensity_distribution) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 85, 5400, 1, 62, 58, -4, 4.2, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 0, 0, 0, 53, 57, 4, 4.0, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 120, 7200, 1, 68, 59, -9, 4.5, '{"z1": 1200, "z2": 3600, "z3": 1800, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 65, 4200, 1, 64, 59, -5, 4.3, '{"z1": 600, "z2": 2400, "z3": 900, "z4": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 45, 3600, 1, 58, 59, 1, 4.1, '{"z1": 1800, "z2": 1500, "z3": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 0, 0, 0, 50, 58, 8, 3.8, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 155, 10800, 1, 72, 60, -12, 4.8, '{"z1": 3600, "z2": 5400, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 75, 5400, 1, 68, 61, -7, 5.0, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 0, 0, 0, 58, 60, 2, 4.5, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 95, 6300, 1, 64, 61, -3, 4.8, '{"z1": 1200, "z2": 3000, "z3": 1500, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 55, 4200, 1, 60, 61, 1, 4.5, '{"z1": 1200, "z2": 2400, "z3": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 70, 5400, 1, 60, 61, 1, 4.2, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 0, 0, 0, 51, 60, 9, 3.8, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 180, 14400, 1, 78, 63, -15, 5.5, '{"z1": 5400, "z2": 7200, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 40, 3600, 1, 68, 63, -5, 5.2, '{"z1": 1800, "z2": 1500, "z3": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 0, 0, 0, 58, 62, 4, 4.8, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 90, 6000, 1, 65, 63, -2, 5.0, '{"z1": 1200, "z2": 2700, "z3": 1500, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 60, 4500, 1, 62, 63, 1, 4.8, '{"z1": 900, "z2": 2400, "z3": 900, "z4": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 75, 5400, 1, 62, 63, 1, 4.5, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 0, 0, 0, 53, 62, 9, 4.0, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 140, 9000, 1, 72, 64, -8, 4.8, '{"z1": 2700, "z2": 4500, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 50, 4200, 1, 65, 64, -1, 4.5, '{"z1": 1500, "z2": 2100, "z3": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 0, 0, 0, 56, 63, 7, 4.0, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 85, 6000, 1, 62, 64, 2, 4.2, '{"z1": 1200, "z2": 2700, "z3": 1500, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 70, 5400, 1, 62, 64, 2, 4.0, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 55, 4500, 1, 59, 64, 5, 3.8, '{"z1": 1200, "z2": 2400, "z3": 600, "z4": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 0, 0, 0, 51, 63, 12, 3.5, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 95, 6300, 1, 60, 64, 4, 3.8, '{"z1": 1200, "z2": 3000, "z3": 1500, "z4": 600}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 65, 5100, 1, 58, 64, 6, 3.5, '{"z1": 900, "z2": 2700, "z3": 1200, "z4": 300}'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 0, 0, 0, 50, 63, 13, 3.2, NULL);

-- ============================================
-- DAILY LOG (30 days)
-- ============================================

INSERT INTO daily_log (athlete_id, date, readiness_score, energy_score, motivation_score, mood_score, stress_score, sleep_score, nutrition_score, recovery_score, trained, tss_total, duration_total_minutes, activities_count, rest_day, morning_notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 72, 7, 8, 7, 4, 78, 75, 70, true, 85, 90, 1, false, 'Legs feel ready for intervals'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 85, 8, 7, 8, 3, 82, 80, 85, false, 0, 0, 0, true, 'Good rest day, walked the dog'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 68, 7, 8, 7, 5, 72, 70, 65, true, 120, 120, 1, false, 'Long ride day, weather looks good'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 65, 6, 7, 7, 4, 70, 75, 62, true, 65, 70, 1, false, 'Bit tired but manageable'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 70, 7, 6, 7, 3, 75, 72, 68, true, 45, 60, 1, false, 'Easy spin recovery'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 82, 8, 7, 8, 3, 85, 78, 80, false, 0, 0, 0, true, 'Full rest, catching up on sleep'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 75, 8, 9, 8, 3, 80, 82, 75, true, 155, 180, 1, false, 'Big ride planned with club'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 62, 6, 7, 7, 5, 68, 70, 58, true, 75, 90, 1, false, 'Legs heavy from yesterday'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 78, 7, 6, 7, 4, 80, 75, 75, false, 0, 0, 0, true, 'Rest and recovery'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 74, 7, 8, 8, 4, 76, 78, 72, true, 95, 105, 1, false, 'Threshold intervals today'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 70, 7, 7, 7, 4, 72, 74, 68, true, 55, 70, 1, false, 'Easy endurance spin'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 68, 6, 7, 7, 5, 70, 72, 65, true, 70, 90, 1, false, 'Tempo work, felt OK'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 80, 8, 7, 8, 3, 82, 78, 78, false, 0, 0, 0, true, 'Much needed rest'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 78, 8, 9, 8, 3, 80, 85, 76, true, 180, 240, 1, false, 'Epic long ride day!'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 55, 5, 5, 6, 6, 62, 65, 52, true, 40, 60, 1, false, 'Very tired, just easy spin'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 75, 7, 6, 7, 4, 78, 75, 72, false, 0, 0, 0, true, 'Recovery day'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 72, 7, 8, 7, 4, 75, 78, 70, true, 90, 100, 1, false, 'Intervals session'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 68, 6, 7, 7, 5, 70, 72, 65, true, 60, 75, 1, false, 'Easy Z2 ride'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 70, 7, 7, 7, 4, 74, 76, 68, true, 75, 90, 1, false, 'Sweet spot work'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 82, 8, 7, 8, 3, 85, 80, 80, false, 0, 0, 0, true, 'Rest day, feeling good'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 76, 8, 8, 8, 3, 78, 82, 74, true, 140, 150, 1, false, 'Group ride with climbs'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 65, 6, 6, 7, 5, 68, 70, 62, true, 50, 70, 1, false, 'Recovery spin'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 78, 7, 7, 8, 4, 80, 76, 75, false, 0, 0, 0, true, 'Full rest'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 74, 7, 8, 7, 4, 76, 78, 72, true, 85, 100, 1, false, 'VO2max intervals'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 70, 7, 7, 7, 4, 72, 74, 68, true, 70, 90, 1, false, 'Endurance ride'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 72, 7, 7, 7, 4, 75, 76, 70, true, 55, 75, 1, false, 'Easy tempo'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 85, 8, 8, 8, 3, 88, 82, 82, false, 0, 0, 0, true, 'Rest day before weekend'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 78, 8, 9, 8, 3, 80, 85, 76, true, 95, 105, 1, false, 'Strong intervals session'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 72, 7, 7, 7, 4, 74, 76, 70, true, 65, 85, 1, false, 'Moderate endurance'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 80, 8, 7, 8, 3, 82, 78, 78, false, 0, 0, 0, true, 'Rest day, good form');

-- ============================================
-- DAILY SLEEP (30 days)
-- ============================================

INSERT INTO daily_sleep (athlete_id, date, time_in_bed_minutes, total_sleep_minutes, sleep_efficiency_pct, deep_sleep_minutes, rem_sleep_minutes, light_sleep_minutes, awake_minutes, sleep_score, restfulness_score, awakenings_count, avg_hr_sleeping, lowest_hr, hrv_avg, hrv_rmssd, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 480, 425, 88.5, 85, 95, 245, 25, 78, 75, 2, 52, 45, 55, 48.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 510, 465, 91.2, 95, 110, 260, 20, 82, 80, 1, 50, 44, 62, 55.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 450, 380, 84.4, 70, 85, 225, 30, 72, 68, 3, 54, 47, 48, 42.1, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 465, 395, 84.9, 75, 90, 230, 28, 70, 67, 2, 53, 46, 50, 44.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 480, 420, 87.5, 80, 95, 245, 22, 75, 72, 2, 51, 45, 54, 47.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 540, 495, 91.7, 100, 115, 280, 18, 85, 83, 1, 49, 43, 65, 58.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 495, 440, 88.9, 88, 100, 252, 23, 80, 77, 2, 51, 44, 58, 51.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 450, 375, 83.3, 68, 82, 225, 32, 68, 64, 3, 55, 48, 45, 39.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 510, 460, 90.2, 92, 108, 260, 20, 80, 78, 1, 50, 44, 60, 53.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 480, 425, 88.5, 85, 98, 242, 22, 76, 74, 2, 52, 45, 55, 48.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 465, 400, 86.0, 78, 92, 230, 25, 72, 70, 2, 53, 46, 52, 46.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 450, 385, 85.6, 72, 88, 225, 28, 70, 68, 2, 54, 47, 50, 44.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 525, 480, 91.4, 98, 112, 270, 18, 82, 80, 1, 49, 43, 63, 56.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 510, 455, 89.2, 90, 105, 260, 22, 80, 77, 2, 50, 44, 58, 51.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 420, 345, 82.1, 62, 78, 205, 35, 62, 58, 4, 56, 49, 42, 37.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 495, 445, 89.9, 90, 105, 250, 20, 78, 76, 1, 51, 44, 58, 51.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 480, 420, 87.5, 82, 96, 242, 24, 75, 72, 2, 52, 45, 54, 48.0, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 450, 385, 85.6, 72, 88, 225, 28, 70, 67, 2, 53, 46, 50, 44.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 480, 425, 88.5, 85, 98, 242, 22, 74, 72, 2, 52, 45, 53, 47.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 540, 500, 92.6, 102, 118, 280, 15, 85, 84, 1, 48, 42, 68, 60.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 495, 438, 88.5, 88, 102, 248, 24, 78, 75, 2, 51, 44, 56, 49.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 450, 378, 84.0, 70, 85, 223, 30, 68, 65, 3, 54, 47, 47, 41.8, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 510, 465, 91.2, 95, 108, 262, 18, 80, 78, 1, 50, 43, 62, 55.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 480, 422, 87.9, 84, 98, 240, 23, 76, 74, 2, 52, 45, 55, 48.9, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 465, 402, 86.5, 78, 92, 232, 26, 72, 70, 2, 53, 46, 52, 46.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 480, 428, 89.2, 86, 100, 242, 20, 75, 73, 2, 51, 45, 54, 48.0, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 540, 505, 93.5, 105, 120, 280, 12, 88, 86, 0, 47, 41, 72, 64.2, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 495, 445, 89.9, 90, 105, 250, 20, 80, 78, 1, 50, 44, 60, 53.5, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 480, 420, 87.5, 82, 96, 242, 24, 74, 72, 2, 52, 45, 54, 48.0, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 510, 468, 91.8, 95, 110, 263, 18, 82, 80, 1, 49, 43, 64, 57.0, 'oura');

-- ============================================
-- DAILY BIOMETRICS (30 days)
-- ============================================

INSERT INTO daily_biometrics (athlete_id, date, resting_hr, hrv_rmssd, hrv_score, weight_kg, body_fat_pct, steps_count, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 48, 48.5, 70, 72.8, 12.5, 8500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 46, 55.2, 78, 72.6, 12.4, 12000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 50, 42.1, 62, 72.4, 12.3, 6500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 49, 44.5, 65, 72.5, 12.4, 7200, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 48, 47.8, 68, 72.6, 12.4, 9000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 45, 58.2, 82, 72.5, 12.3, 11500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 47, 51.5, 74, 72.3, 12.2, 7800, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 51, 39.8, 58, 72.4, 12.3, 6200, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 46, 53.5, 76, 72.5, 12.3, 10500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 48, 48.8, 70, 72.4, 12.2, 8200, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 49, 46.2, 66, 72.5, 12.3, 7500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 50, 44.5, 64, 72.6, 12.4, 6800, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 45, 56.2, 80, 72.4, 12.2, 12500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 47, 51.5, 74, 72.2, 12.1, 5500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 53, 37.2, 54, 72.5, 12.3, 5800, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 47, 51.8, 74, 72.6, 12.4, 11000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 48, 48.0, 69, 72.5, 12.3, 8000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 49, 44.5, 64, 72.6, 12.4, 7200, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 48, 47.2, 68, 72.5, 12.3, 7800, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 44, 60.5, 85, 72.4, 12.2, 13000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 47, 49.8, 72, 72.3, 12.1, 7500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 51, 41.8, 60, 72.5, 12.3, 6500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 46, 55.2, 78, 72.6, 12.4, 11500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 48, 48.9, 70, 72.5, 12.3, 8200, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 49, 46.2, 66, 72.4, 12.2, 7800, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 48, 48.0, 69, 72.5, 12.3, 8500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 43, 64.2, 88, 72.4, 12.2, 14000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 47, 53.5, 76, 72.3, 12.1, 8000, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 48, 48.0, 70, 72.4, 12.2, 7500, 'oura'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 46, 57.0, 80, 72.5, 12.3, 9500, 'oura');

-- ============================================
-- DAILY WELLNESS (30 days)
-- ============================================

INSERT INTO daily_wellness (athlete_id, date, mood_score, stress_level, energy_level, motivation_training, muscle_soreness, legs_feeling, recovery_score, readiness_to_train, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 7, 4, 7, 8, 4, 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 8, 3, 8, 7, 2, 'fresh', 85, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 7, 5, 7, 8, 5, 'tired', 65, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 7, 4, 6, 7, 5, 'tired', 62, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 7, 3, 7, 6, 4, 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 8, 3, 8, 7, 2, 'fresh', 80, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 8, 3, 8, 9, 3, 'fresh', 75, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 7, 5, 6, 7, 6, 'heavy', 58, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 7, 4, 7, 6, 4, 'normal', 75, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 8, 4, 7, 8, 4, 'normal', 72, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 7, 4, 7, 7, 4, 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 7, 5, 6, 7, 5, 'tired', 65, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 8, 3, 8, 7, 2, 'fresh', 78, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 8, 3, 8, 9, 3, 'fresh', 76, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 6, 6, 5, 5, 7, 'dead', 52, 5, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 7, 4, 7, 6, 4, 'normal', 72, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 7, 4, 7, 8, 4, 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 7, 5, 6, 7, 5, 'tired', 65, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 7, 4, 7, 7, 4, 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 8, 3, 8, 7, 2, 'fresh', 80, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 8, 3, 8, 8, 3, 'fresh', 74, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 7, 5, 6, 6, 5, 'tired', 62, 6, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 8, 4, 7, 7, 3, 'normal', 75, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 7, 4, 7, 8, 4, 'normal', 72, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 7, 4, 7, 7, 4, 'normal', 68, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 7, 4, 7, 7, 4, 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 8, 3, 8, 8, 2, 'fresh', 82, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 8, 3, 8, 9, 3, 'fresh', 76, 8, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 7, 4, 7, 7, 4, 'normal', 70, 7, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 8, 3, 8, 7, 2, 'fresh', 78, 8, 'manual');

-- ============================================
-- WEEKLY SUMMARIES (52 weeks / 1 year)
-- ============================================

INSERT INTO weekly_summary (athlete_id, week_start, week_end, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, training_days, rest_days, avg_daily_tss, atl_end, ctl_end, tsb_end, avg_sleep_hours, avg_hrv, avg_energy, avg_stress, week_rating, lucy_summary) VALUES
-- Recent 4 weeks (detailed)
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, CURRENT_DATE, 465, 9.5, 285, 2800, 5, 5, 2, 66, 58, 64, 6, 7.5, 54, 7.4, 3.6, 'good', 'Solid training week with good recovery. TSB positive heading into next block.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, CURRENT_DATE - 7, 520, 10.2, 310, 3200, 5, 5, 2, 74, 65, 63, -2, 7.2, 50, 7.0, 4.2, 'good', 'Progressive overload week. Slight fatigue accumulation but manageable.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, CURRENT_DATE - 14, 580, 11.5, 345, 3800, 6, 6, 1, 83, 72, 62, -10, 7.0, 48, 6.8, 4.5, 'ok', 'Big volume week. Need to watch fatigue levels.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, CURRENT_DATE - 21, 485, 9.8, 295, 2900, 5, 5, 2, 69, 62, 60, -2, 7.3, 52, 7.2, 4.0, 'good', 'Balanced week with quality intervals.'),
-- Weeks 5-12
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 34, CURRENT_DATE - 28, 450, 9.0, 270, 2600, 5, 5, 2, 64, 58, 58, 0, 7.4, 53, 7.3, 3.8, 'good', 'Recovery week paying dividends.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 41, CURRENT_DATE - 35, 380, 7.5, 225, 2100, 4, 4, 3, 54, 52, 56, 4, 7.8, 58, 7.8, 3.2, 'great', 'Planned recovery week. Feeling fresh.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 48, CURRENT_DATE - 42, 540, 10.8, 325, 3400, 5, 5, 2, 77, 68, 55, -13, 7.0, 46, 6.6, 4.8, 'ok', 'Hard training block. Accumulated fatigue.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 55, CURRENT_DATE - 49, 510, 10.2, 305, 3100, 5, 5, 2, 73, 65, 52, -13, 7.1, 48, 6.8, 4.5, 'ok', 'Continuing build phase.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 62, CURRENT_DATE - 56, 480, 9.5, 285, 2800, 5, 5, 2, 69, 60, 50, -10, 7.2, 50, 7.0, 4.2, 'good', 'Good progression week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 69, CURRENT_DATE - 63, 420, 8.2, 250, 2400, 4, 4, 3, 60, 55, 48, -7, 7.5, 54, 7.4, 3.8, 'good', 'Moderate week with focus on intensity.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 76, CURRENT_DATE - 70, 350, 7.0, 210, 1900, 4, 4, 3, 50, 48, 46, -2, 7.8, 58, 7.8, 3.4, 'great', 'Recovery week before build.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 83, CURRENT_DATE - 77, 520, 10.5, 315, 3300, 5, 5, 2, 74, 62, 45, -17, 7.0, 45, 6.5, 4.8, 'ok', 'Peak volume week of block.'),
-- Weeks 13-24
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 90, CURRENT_DATE - 84, 490, 9.8, 295, 3000, 5, 5, 2, 70, 58, 42, -16, 7.1, 47, 6.7, 4.6, 'ok', 'High load week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 97, CURRENT_DATE - 91, 460, 9.2, 275, 2700, 5, 5, 2, 66, 55, 40, -15, 7.2, 49, 6.9, 4.4, 'good', 'Building fitness.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 104, CURRENT_DATE - 98, 320, 6.5, 195, 1800, 4, 4, 3, 46, 45, 38, -7, 7.9, 60, 8.0, 3.2, 'great', 'Recovery week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 111, CURRENT_DATE - 105, 480, 9.5, 285, 2900, 5, 5, 2, 69, 58, 38, -20, 7.0, 46, 6.6, 4.7, 'ok', 'Hard block week 3.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 118, CURRENT_DATE - 112, 450, 9.0, 270, 2700, 5, 5, 2, 64, 54, 36, -18, 7.1, 48, 6.8, 4.5, 'ok', 'Hard block week 2.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 125, CURRENT_DATE - 119, 420, 8.5, 255, 2500, 5, 5, 2, 60, 50, 35, -15, 7.3, 50, 7.0, 4.3, 'good', 'Starting build block.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 132, CURRENT_DATE - 126, 350, 7.0, 210, 2000, 4, 4, 3, 50, 45, 34, -11, 7.6, 55, 7.5, 3.8, 'good', 'Base maintenance.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 139, CURRENT_DATE - 133, 380, 7.5, 225, 2200, 4, 4, 3, 54, 46, 33, -13, 7.5, 54, 7.4, 3.9, 'good', 'Steady base work.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 146, CURRENT_DATE - 140, 400, 8.0, 240, 2300, 4, 4, 3, 57, 48, 32, -16, 7.4, 52, 7.2, 4.0, 'good', 'Building aerobic base.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 153, CURRENT_DATE - 147, 280, 5.5, 165, 1500, 3, 3, 4, 40, 40, 32, -8, 8.0, 62, 8.2, 3.0, 'great', 'Easy recovery week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 160, CURRENT_DATE - 154, 420, 8.5, 255, 2400, 5, 5, 2, 60, 50, 32, -18, 7.2, 50, 7.0, 4.2, 'good', 'Good base volume.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 167, CURRENT_DATE - 161, 390, 7.8, 235, 2200, 4, 4, 3, 56, 48, 31, -17, 7.3, 52, 7.2, 4.0, 'good', 'Consistent base work.'),
-- Weeks 25-36
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 174, CURRENT_DATE - 168, 360, 7.2, 215, 2000, 4, 4, 3, 51, 45, 30, -15, 7.5, 54, 7.4, 3.8, 'good', 'Base phase continues.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 181, CURRENT_DATE - 175, 320, 6.4, 190, 1800, 4, 4, 3, 46, 42, 30, -12, 7.7, 56, 7.6, 3.6, 'good', 'Moderate base week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 188, CURRENT_DATE - 182, 280, 5.5, 165, 1500, 3, 3, 4, 40, 38, 30, -8, 8.0, 60, 8.0, 3.2, 'great', 'Recovery focus.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 195, CURRENT_DATE - 189, 380, 7.6, 230, 2100, 4, 4, 3, 54, 46, 30, -16, 7.4, 53, 7.3, 3.9, 'good', 'Building back up.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 202, CURRENT_DATE - 196, 350, 7.0, 210, 1900, 4, 4, 3, 50, 44, 29, -15, 7.5, 54, 7.4, 3.8, 'good', 'Steady progress.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 209, CURRENT_DATE - 203, 320, 6.4, 190, 1700, 4, 4, 3, 46, 42, 28, -14, 7.6, 55, 7.5, 3.7, 'good', 'Consistent training.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 216, CURRENT_DATE - 210, 300, 6.0, 180, 1600, 4, 4, 3, 43, 40, 28, -12, 7.7, 56, 7.6, 3.6, 'good', 'Base maintenance.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 223, CURRENT_DATE - 217, 250, 5.0, 150, 1300, 3, 3, 4, 36, 36, 28, -8, 8.0, 60, 8.0, 3.2, 'great', 'Light week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 230, CURRENT_DATE - 224, 340, 6.8, 205, 1850, 4, 4, 3, 49, 43, 28, -15, 7.5, 54, 7.4, 3.8, 'good', 'Resuming training.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 237, CURRENT_DATE - 231, 310, 6.2, 185, 1700, 4, 4, 3, 44, 41, 27, -14, 7.6, 55, 7.5, 3.7, 'good', 'Solid week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 244, CURRENT_DATE - 238, 280, 5.6, 170, 1500, 3, 3, 4, 40, 38, 27, -11, 7.8, 57, 7.7, 3.5, 'good', 'Easy week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 251, CURRENT_DATE - 245, 320, 6.4, 195, 1750, 4, 4, 3, 46, 42, 27, -15, 7.5, 54, 7.4, 3.8, 'good', 'Good training.'),
-- Weeks 37-48
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 258, CURRENT_DATE - 252, 290, 5.8, 175, 1600, 4, 4, 3, 41, 40, 26, -14, 7.6, 55, 7.5, 3.7, 'good', 'Moderate volume.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 265, CURRENT_DATE - 259, 260, 5.2, 155, 1400, 3, 3, 4, 37, 37, 26, -11, 7.8, 58, 7.8, 3.4, 'good', 'Recovery focus.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 272, CURRENT_DATE - 266, 310, 6.2, 185, 1650, 4, 4, 3, 44, 41, 26, -15, 7.5, 54, 7.4, 3.8, 'good', 'Building volume.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 279, CURRENT_DATE - 273, 280, 5.6, 170, 1500, 4, 4, 3, 40, 39, 25, -14, 7.6, 55, 7.5, 3.7, 'good', 'Steady week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 286, CURRENT_DATE - 280, 240, 4.8, 145, 1300, 3, 3, 4, 34, 35, 25, -10, 7.9, 59, 7.9, 3.3, 'great', 'Easy week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 293, CURRENT_DATE - 287, 300, 6.0, 180, 1600, 4, 4, 3, 43, 40, 25, -15, 7.5, 54, 7.4, 3.8, 'good', 'Good progress.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 300, CURRENT_DATE - 294, 270, 5.4, 165, 1450, 3, 3, 4, 39, 38, 24, -14, 7.7, 56, 7.6, 3.6, 'good', 'Moderate week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 307, CURRENT_DATE - 301, 230, 4.6, 140, 1200, 3, 3, 4, 33, 34, 24, -10, 7.9, 59, 7.9, 3.3, 'great', 'Recovery week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 314, CURRENT_DATE - 308, 290, 5.8, 175, 1550, 4, 4, 3, 41, 39, 24, -15, 7.6, 55, 7.5, 3.7, 'good', 'Building back.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 321, CURRENT_DATE - 315, 260, 5.2, 155, 1400, 3, 3, 4, 37, 37, 23, -14, 7.7, 56, 7.6, 3.6, 'good', 'Consistent.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 328, CURRENT_DATE - 322, 220, 4.4, 130, 1150, 3, 3, 4, 31, 33, 23, -10, 8.0, 60, 8.0, 3.2, 'great', 'Light week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 335, CURRENT_DATE - 329, 280, 5.6, 170, 1500, 4, 4, 3, 40, 38, 23, -15, 7.6, 55, 7.5, 3.7, 'good', 'Good week.'),
-- Weeks 49-52
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 342, CURRENT_DATE - 336, 250, 5.0, 150, 1350, 3, 3, 4, 36, 36, 22, -14, 7.8, 57, 7.7, 3.5, 'good', 'Moderate volume.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 349, CURRENT_DATE - 343, 200, 4.0, 120, 1050, 3, 3, 4, 29, 32, 22, -10, 8.1, 62, 8.1, 3.1, 'great', 'Easy week.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 356, CURRENT_DATE - 350, 260, 5.2, 155, 1400, 4, 4, 3, 37, 36, 22, -14, 7.7, 56, 7.6, 3.6, 'good', 'Building.'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 363, CURRENT_DATE - 357, 230, 4.6, 140, 1250, 3, 3, 4, 33, 34, 21, -13, 7.8, 58, 7.8, 3.4, 'good', 'Start of year.');

-- ============================================
-- MONTHLY SUMMARIES (12 months / 1 year)
-- ============================================

INSERT INTO monthly_summary (athlete_id, month, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, avg_weekly_tss, training_consistency_pct, ftp_start, ftp_end, ftp_change, weight_start_kg, weight_end_kg, weight_change_kg, avg_sleep_hours, avg_hrv, phase, month_rating, lucy_summary) VALUES
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE), 1550, 31, 930, 9500, 18, 388, 85, 280, 285, 5, 72.8, 72.5, -0.3, 7.4, 52, 'build', 'good', 'Strong month with FTP gains. Managing fatigue well.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 1680, 34, 1010, 10200, 20, 420, 88, 275, 280, 5, 73.2, 72.8, -0.4, 7.2, 50, 'build', 'good', 'Peak volume month. Good adaptation.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months'), 1450, 29, 870, 8800, 17, 363, 82, 272, 275, 3, 73.5, 73.2, -0.3, 7.3, 51, 'build', 'good', 'Consistent training with steady gains.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'), 1280, 26, 770, 7600, 15, 320, 78, 270, 272, 2, 73.8, 73.5, -0.3, 7.5, 54, 'base', 'good', 'Transitioning to build phase.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '4 months'), 1150, 23, 690, 6800, 14, 288, 75, 268, 270, 2, 74.0, 73.8, -0.2, 7.6, 55, 'base', 'good', 'Solid base building month.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'), 1050, 21, 630, 6200, 13, 263, 72, 265, 268, 3, 74.2, 74.0, -0.2, 7.7, 56, 'base', 'good', 'Aerobic foundation work.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months'), 980, 20, 590, 5800, 12, 245, 70, 262, 265, 3, 74.5, 74.2, -0.3, 7.8, 58, 'base', 'good', 'Starting structured base phase.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '7 months'), 850, 17, 510, 5000, 11, 213, 65, 260, 262, 2, 74.8, 74.5, -0.3, 7.9, 59, 'recovery', 'good', 'Transition month, lighter load.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '8 months'), 750, 15, 450, 4400, 10, 188, 60, 265, 260, -5, 74.2, 74.8, 0.6, 8.0, 62, 'recovery', 'ok', 'Off-season recovery. Slight detraining.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '9 months'), 920, 18, 550, 5400, 12, 230, 68, 270, 265, -5, 73.8, 74.2, 0.4, 7.8, 58, 'peak', 'good', 'Race month - tapered for events.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '10 months'), 1350, 27, 810, 8100, 16, 338, 80, 268, 270, 2, 73.5, 73.8, 0.3, 7.4, 52, 'build', 'good', 'Final build before peak.'),
('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'), 1250, 25, 750, 7500, 15, 313, 78, 265, 268, 3, 73.8, 73.5, -0.3, 7.5, 54, 'build', 'good', 'Build phase continues.');

-- ============================================
-- EQUIPMENT
-- ============================================

INSERT INTO equipment (athlete_id, equipment_type, name, brand, model, purchase_date, purchase_price, bike_type, frame_size, frame_material, groupset, wheelset, weight_kg, total_km, total_hours, status, condition) VALUES
('00000000-0000-0000-0000-000000000001', 'bike', 'Primary Road Bike', 'Canyon', 'Ultimate CF SLX', '2023-03-15', 4500, 'road', '56cm', 'carbon', 'Shimano Ultegra Di2', 'DT Swiss ARC 1400', 7.2, 12500, 520, 'active', 'excellent'),
('00000000-0000-0000-0000-000000000001', 'bike', 'Training Bike', 'Giant', 'TCR Advanced Pro', '2021-06-01', 2800, 'road', '56cm', 'carbon', 'Shimano 105', 'Giant SLR 1', 8.1, 18000, 780, 'active', 'good'),
('00000000-0000-0000-0000-000000000001', 'trainer', 'Smart Trainer', 'Wahoo', 'KICKR V6', '2023-11-01', 1200, NULL, NULL, NULL, NULL, NULL, NULL, 0, 150, 'active', 'excellent'),
('00000000-0000-0000-0000-000000000001', 'power_meter', 'Power Meter', 'Quarq', 'DZero', '2022-08-15', 850, NULL, NULL, NULL, NULL, NULL, NULL, 15000, 620, 'active', 'good');
