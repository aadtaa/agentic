-- Part 11: TCX Files (Activity uploads - 30 days)
-- Matches training_load data from seed.sql

INSERT INTO tcx_files (id, athlete_id, filename, file_path, file_hash, activity_date, activity_type, workout_type, title, duration_seconds, moving_time_seconds, distance_meters, elevation_meters, avg_power, max_power, normalized_power, intensity_factor, tss, avg_hr, max_hr, avg_cadence, indoor, device, notes, rpe, feeling, processed) VALUES
-- Day -29: Threshold intervals (TSS 85)
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2024_threshold_intervals.tcx', '/uploads/athlete_001/2024_threshold_intervals.tcx', 'hash_001', CURRENT_DATE - 29, 'ride', 'threshold', 'Threshold Intervals - 4x8min', 5400, 5100, 42000, 320, 245, 385, 265, 0.93, 85, 158, 178, 88, false, 'Garmin Edge 840', 'Strong session, hit all intervals', 7, 'good', true),

-- Day -27: Long endurance ride (TSS 120)
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2024_long_endurance.tcx', '/uploads/athlete_001/2024_long_endurance.tcx', 'hash_002', CURRENT_DATE - 27, 'ride', 'endurance', 'Sunday Long Ride', 7200, 6900, 85000, 650, 195, 320, 210, 0.74, 120, 138, 162, 82, false, 'Garmin Edge 840', 'Beautiful weather, felt great', 5, 'great', true),

-- Day -26: Easy recovery (TSS 65)
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2024_recovery_spin.tcx', '/uploads/athlete_001/2024_recovery_spin.tcx', 'hash_003', CURRENT_DATE - 26, 'ride', 'recovery', 'Recovery Spin', 4200, 4000, 32000, 180, 165, 245, 175, 0.61, 65, 125, 145, 78, false, 'Garmin Edge 840', 'Easy spin, legs recovering', 3, 'ok', true),

-- Day -25: Zone 2 endurance (TSS 45)
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2024_zone2_base.tcx', '/uploads/athlete_001/2024_zone2_base.tcx', 'hash_004', CURRENT_DATE - 25, 'ride', 'endurance', 'Zone 2 Base Ride', 3600, 3400, 28000, 150, 175, 265, 185, 0.65, 45, 132, 152, 80, false, 'Garmin Edge 840', 'Steady aerobic work', 4, 'good', true),

-- Day -23: Big club ride (TSS 155)
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '2024_club_ride.tcx', '/uploads/athlete_001/2024_club_ride.tcx', 'hash_005', CURRENT_DATE - 23, 'ride', 'endurance', 'Saturday Club Ride', 10800, 10200, 115000, 1200, 205, 520, 225, 0.79, 155, 145, 185, 85, false, 'Garmin Edge 840', 'Great group ride, some hard efforts on climbs', 7, 'great', true),

-- Day -22: Sweet spot (TSS 75)
('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '2024_sweetspot.tcx', '/uploads/athlete_001/2024_sweetspot.tcx', 'hash_006', CURRENT_DATE - 22, 'ride', 'threshold', 'Sweet Spot 3x15min', 5400, 5100, 40000, 280, 235, 365, 255, 0.89, 75, 155, 172, 86, false, 'Garmin Edge 840', 'Solid sweet spot session', 6, 'good', true),

-- Day -20: VO2max intervals (TSS 95)
('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '2024_vo2max.tcx', '/uploads/athlete_001/2024_vo2max.tcx', 'hash_007', CURRENT_DATE - 20, 'ride', 'vo2max', 'VO2max 5x4min', 6300, 5900, 48000, 350, 255, 420, 280, 0.98, 95, 165, 188, 92, false, 'Garmin Edge 840', 'Hard intervals, lungs burning', 8, 'ok', true),

-- Day -19: Easy spin (TSS 55)
('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '2024_easy_spin.tcx', '/uploads/athlete_001/2024_easy_spin.tcx', 'hash_008', CURRENT_DATE - 19, 'ride', 'recovery', 'Easy Spin', 4200, 4000, 30000, 160, 160, 235, 170, 0.60, 55, 122, 142, 76, false, 'Garmin Edge 840', 'Legs still tired from yesterday', 3, 'tired', true),

-- Day -18: Tempo ride (TSS 70)
('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '2024_tempo.tcx', '/uploads/athlete_001/2024_tempo.tcx', 'hash_009', CURRENT_DATE - 18, 'ride', 'endurance', 'Tempo Blocks', 5400, 5100, 42000, 300, 215, 325, 235, 0.82, 70, 148, 168, 84, false, 'Garmin Edge 840', 'Good tempo work', 5, 'good', true),

-- Day -16: Epic long ride (TSS 180)
('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '2024_epic_ride.tcx', '/uploads/athlete_001/2024_epic_ride.tcx', 'hash_010', CURRENT_DATE - 16, 'ride', 'endurance', 'Epic Mountain Ride', 14400, 13500, 145000, 2200, 195, 485, 215, 0.75, 180, 142, 182, 80, false, 'Garmin Edge 840', 'Massive day out! Beautiful views', 8, 'great', true),

-- Day -15: Recovery (TSS 40)
('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '2024_recovery_easy.tcx', '/uploads/athlete_001/2024_recovery_easy.tcx', 'hash_011', CURRENT_DATE - 15, 'ride', 'recovery', 'Recovery After Epic', 3600, 3400, 25000, 120, 145, 215, 155, 0.54, 40, 118, 138, 74, false, 'Garmin Edge 840', 'Very tired from yesterday, just spinning', 2, 'tired', true),

-- Day -13: Intervals (TSS 90)
('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '2024_intervals.tcx', '/uploads/athlete_001/2024_intervals.tcx', 'hash_012', CURRENT_DATE - 13, 'ride', 'threshold', 'Threshold Intervals', 6000, 5700, 45000, 340, 248, 395, 268, 0.94, 90, 160, 180, 88, false, 'Garmin Edge 840', 'Strong intervals, feeling recovered', 7, 'good', true),

-- Day -12: Zone 2 (TSS 60)
('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '2024_zone2.tcx', '/uploads/athlete_001/2024_zone2.tcx', 'hash_013', CURRENT_DATE - 12, 'ride', 'endurance', 'Zone 2 Endurance', 4500, 4300, 35000, 220, 180, 275, 195, 0.68, 60, 135, 155, 80, false, 'Garmin Edge 840', 'Steady Z2 work', 4, 'good', true),

-- Day -11: Sweet spot indoor (TSS 75)
('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '2024_zwift_sweetspot.tcx', '/uploads/athlete_001/2024_zwift_sweetspot.tcx', 'hash_014', CURRENT_DATE - 11, 'ride', 'threshold', 'Zwift Sweet Spot', 5400, 5400, 38000, 450, 240, 355, 260, 0.91, 75, 156, 174, 87, true, 'Wahoo KICKR', 'Indoor session, weather bad outside', 6, 'ok', true),

-- Day -9: Group ride with climbs (TSS 140)
('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '2024_saturday_hills.tcx', '/uploads/athlete_001/2024_saturday_hills.tcx', 'hash_015', CURRENT_DATE - 9, 'ride', 'endurance', 'Saturday Hilly Ride', 9000, 8500, 95000, 1500, 210, 495, 230, 0.81, 140, 148, 186, 82, false, 'Garmin Edge 840', 'Great climbing, legs felt good', 7, 'great', true),

-- Day -8: Recovery spin (TSS 50)
('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', '2024_sunday_recovery.tcx', '/uploads/athlete_001/2024_sunday_recovery.tcx', 'hash_016', CURRENT_DATE - 8, 'ride', 'recovery', 'Sunday Recovery', 4200, 4000, 30000, 150, 155, 235, 165, 0.58, 50, 120, 140, 75, false, 'Garmin Edge 840', 'Easy spin after yesterday', 3, 'ok', true),

-- Day -6: VO2max (TSS 85)
('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', '2024_vo2max_tuesday.tcx', '/uploads/athlete_001/2024_vo2max_tuesday.tcx', 'hash_017', CURRENT_DATE - 6, 'ride', 'vo2max', 'VO2max Intervals', 6000, 5700, 46000, 380, 250, 415, 275, 0.96, 85, 162, 186, 90, false, 'Garmin Edge 840', 'Hard session, felt strong', 8, 'good', true),

-- Day -5: Endurance (TSS 70)
('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', '2024_endurance_wed.tcx', '/uploads/athlete_001/2024_endurance_wed.tcx', 'hash_018', CURRENT_DATE - 5, 'ride', 'endurance', 'Endurance Ride', 5400, 5100, 42000, 280, 190, 295, 205, 0.72, 70, 138, 158, 81, false, 'Garmin Edge 840', 'Steady ride, good weather', 5, 'good', true),

-- Day -4: Tempo (TSS 55)
('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', '2024_tempo_thursday.tcx', '/uploads/athlete_001/2024_tempo_thursday.tcx', 'hash_019', CURRENT_DATE - 4, 'ride', 'endurance', 'Easy Tempo', 4500, 4300, 34000, 200, 185, 285, 200, 0.70, 55, 140, 160, 82, false, 'Garmin Edge 840', 'Light tempo work', 4, 'good', true),

-- Day -2: Strong intervals (TSS 95)
('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', '2024_saturday_intervals.tcx', '/uploads/athlete_001/2024_saturday_intervals.tcx', 'hash_020', CURRENT_DATE - 2, 'ride', 'threshold', 'Saturday Intervals', 6300, 6000, 50000, 420, 252, 405, 275, 0.96, 95, 162, 182, 89, false, 'Garmin Edge 840', 'Great session, felt powerful', 7, 'great', true),

-- Day -1: Moderate endurance (TSS 65)
('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', '2024_sunday_endurance.tcx', '/uploads/athlete_001/2024_sunday_endurance.tcx', 'hash_021', CURRENT_DATE - 1, 'ride', 'endurance', 'Sunday Endurance', 5100, 4800, 40000, 260, 185, 305, 200, 0.70, 65, 136, 156, 80, false, 'Garmin Edge 840', 'Nice moderate ride', 5, 'good', true),

-- Historical activities (older than 30 days for yearly context)
-- Month -2
('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', '2024_ftp_test.tcx', '/uploads/athlete_001/2024_ftp_test.tcx', 'hash_022', CURRENT_DATE - 45, 'ride', 'test', 'FTP Test - Ramp', 3600, 3400, 32000, 180, 265, 385, 285, 1.00, 95, 172, 192, 92, true, 'Wahoo KICKR', 'New FTP: 285W! PR!', 10, 'great', true),

-- Month -3 Race
('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '2024_autumn_granfondo.tcx', '/uploads/athlete_001/2024_autumn_granfondo.tcx', 'hash_023', CURRENT_DATE - 120, 'ride', 'race', 'Autumn Gran Fondo', 17553, 16800, 140000, 2500, 198, 545, 218, 0.76, 185, 152, 188, 84, false, 'Garmin Edge 840', 'Great race! Finished 4:52:35', 9, 'great', true),

-- Month -4 Training Camp Day
('10000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', '2024_camp_day1.tcx', '/uploads/athlete_001/2024_camp_day1.tcx', 'hash_024', CURRENT_DATE - 150, 'ride', 'endurance', 'Training Camp Day 1', 18000, 17200, 165000, 2800, 185, 425, 205, 0.72, 195, 140, 175, 78, false, 'Garmin Edge 840', 'First big day at camp, amazing roads', 7, 'great', true),

-- Strength training sessions
('10000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', '2024_strength_1.tcx', '/uploads/athlete_001/2024_strength_1.tcx', 'hash_025', CURRENT_DATE - 14, 'strength', 'recovery', 'Gym Session - Legs', 3600, 3600, 0, 0, NULL, NULL, NULL, NULL, 35, 125, 155, NULL, true, 'Garmin Fenix 7', 'Squats, lunges, core work', 6, 'good', true),

('10000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', '2024_strength_2.tcx', '/uploads/athlete_001/2024_strength_2.tcx', 'hash_026', CURRENT_DATE - 7, 'strength', 'recovery', 'Gym Session - Upper + Core', 3000, 3000, 0, 0, NULL, NULL, NULL, NULL, 30, 118, 145, NULL, true, 'Garmin Fenix 7', 'Upper body and core stability', 5, 'good', true);
