-- Part 9: Monthly Summaries + Events + Equipment

-- Monthly Summaries (12 months)
INSERT INTO monthly_summary (athlete_id, month, total_tss, total_hours, total_distance_km, total_elevation_m, activities_count, avg_weekly_tss, training_consistency_pct, ftp_start, ftp_end, ftp_change, weight_start_kg, weight_end_kg, weight_change_kg, avg_sleep_hours, avg_hrv, avg_stress, phase, month_rating, highlights, challenges, lucy_summary) VALUES
('00000000-0000-0000-0000-000000000001', date_trunc('month', CURRENT_DATE)::date, 1850, 42.5, 1180, 9200, 22, 462, 88, 280, 285, 5, 72.5, 72.5, 0, 7.5, 58, 4.0, 'build', 'great', '["FTP test - new PR at 285W", "5hr hill ride", "Consistent VO2max work"]', '["Post-holiday fatigue", "Cold weather"]', 'Excellent start to the year! FTP breakthrough to 285W.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date, 1680, 38.8, 1050, 7800, 20, 420, 82, 275, 280, 5, 72.8, 72.5, -0.3, 7.6, 56, 3.8, 'base', 'good', '["Good holiday balance", "Maintained fitness"]', '["Holiday schedule disruptions", "Travel"]', 'Solid month considering holidays.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::date, 1820, 42.0, 1165, 8900, 22, 455, 85, 272, 275, 3, 73.0, 72.8, -0.2, 7.5, 55, 4.0, 'build', 'good', '["Strong threshold work", "Good indoor sessions"]', '["Weather limited outdoor rides", "Work stress"]', 'Good progression despite weather.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '3 months')::date, 1950, 45.0, 1280, 10200, 24, 488, 88, 268, 272, 4, 73.2, 73.0, -0.2, 7.4, 54, 4.2, 'build', 'great', '["Big volume week", "Autumn colors ride"]', '["Shorter days", "Rain"]', 'Excellent build month.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '4 months')::date, 2100, 48.5, 1420, 11500, 26, 525, 92, 265, 268, 3, 72.8, 73.2, 0.4, 7.3, 52, 4.5, 'peak', 'great', '["Gran Fondo race - PB!", "Peak form achieved"]', '["Managing fatigue", "Race travel"]', 'Outstanding month! Peak form.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date, 2250, 52.0, 1550, 12800, 28, 563, 94, 262, 265, 3, 72.5, 72.8, 0.3, 7.2, 50, 4.8, 'peak', 'great', '["Highest volume month", "Training camp success"]', '["Heat", "Accumulated fatigue"]', 'Peak training month!'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '6 months')::date, 2050, 47.5, 1380, 11200, 25, 513, 90, 258, 262, 4, 72.8, 72.5, -0.3, 7.3, 52, 4.5, 'build', 'great', '["Mountain stage simulation", "Good climbing form"]', '["Summer heat", "Work-life balance"]', 'Strong build phase.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '7 months')::date, 1920, 44.5, 1290, 10400, 24, 480, 88, 255, 258, 3, 73.0, 72.8, -0.2, 7.4, 54, 4.2, 'build', 'good', '["First B race", "Good progression"]', '["Early heat wave", "Recovery issues"]', 'Good progression with first race.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '8 months')::date, 1750, 40.5, 1150, 9000, 22, 438, 85, 252, 255, 3, 73.2, 73.0, -0.2, 7.5, 56, 4.0, 'build', 'good', '["Outdoor season started", "Group rides resumed"]', '["Weather variability", "Pollen allergies"]', 'Good transition to outdoor.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '9 months')::date, 1620, 37.5, 1050, 7800, 20, 405, 82, 250, 252, 2, 73.5, 73.2, -0.3, 7.6, 58, 3.8, 'base', 'good', '["FTP test - baseline", "First outdoor rides"]', '["Cold snaps", "Equipment issues"]', 'Good base month.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '10 months')::date, 1480, 34.2, 950, 6800, 18, 370, 78, 248, 250, 2, 74.0, 73.5, -0.5, 7.7, 60, 3.5, 'base', 'good', '["Consistent indoor training", "Weight coming down"]', '["Indoor monotony", "Motivation dips"]', 'Solid base building.'),
('00000000-0000-0000-0000-000000000001', (date_trunc('month', CURRENT_DATE) - INTERVAL '11 months')::date, 1350, 31.2, 870, 5900, 17, 338, 75, 245, 248, 3, 74.5, 74.0, -0.5, 7.8, 62, 3.2, 'base', 'ok', '["Started structured plan", "Good sleep habits"]', '["Winter blues", "Short days"]', 'Foundation building.');

-- Events (Races)
INSERT INTO events (athlete_id, name, date, event_type, priority, distance_km, elevation_m, expected_duration_hours, goal_time, goal_power, goal_description, course_profile, notes, result_time, result_power, result_notes) VALUES
('00000000-0000-0000-0000-000000000001', 'Milano-Sanremo Gran Fondo', CURRENT_DATE + 85, 'gran_fondo', 'A', 185, 2200, 6.5, '5:45:00', 220, 'Finish strong, negative split', 'rolling', 'Main A race', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Bergamo-Lecco Sportive', CURRENT_DATE + 42, 'sportive', 'B', 95, 1800, 3.5, '3:15:00', 235, 'Race simulation', 'hilly', 'Prep race', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Club TT Championship', CURRENT_DATE + 21, 'race_tt', 'B', 25, 150, 0.6, '0:35:00', 275, 'Test TT position', 'flat', 'First TT', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Summer Gran Fondo', CURRENT_DATE + 150, 'gran_fondo', 'A', 165, 3500, 6.0, '5:30:00', 225, 'Target podium', 'mountainous', 'Key summer goal', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000001', 'Autumn Gran Fondo', CURRENT_DATE - 120, 'gran_fondo', 'A', 145, 2800, 5.5, '5:00:00', 218, 'Season finale', 'mountainous', 'End of season', '4:52:35', 225, 'Great race!'),
('00000000-0000-0000-0000-000000000001', 'Lago di Como Sportive', CURRENT_DATE - 150, 'sportive', 'B', 110, 2100, 4.0, '3:45:00', 225, 'Race simulation', 'hilly', 'Prep race', '3:38:22', 232, 'Felt strong.'),
('00000000-0000-0000-0000-000000000001', 'Club Road Race', CURRENT_DATE - 180, 'race_road', 'C', 65, 850, 2.0, '1:45:00', 245, 'Practice tactics', 'rolling', 'Local race', '1:42:15', 252, '5th place.');

-- Planned workouts (next 7 days)
INSERT INTO planned_workouts (athlete_id, scheduled_date, scheduled_time, workout_type, title, description, duration_planned_minutes, tss_planned, intensity_target, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, '07:00', 'endurance', 'Zone 2 Base', 'Easy endurance ride', 90, 65, 'Zone 2', 'Keep HR under 145'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 2, '06:30', 'threshold', '3x12min Sweet Spot', 'Sweet spot intervals', 75, 85, '88-93% FTP', 'Focus on steady power'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 3, '07:00', 'recovery', 'Recovery Spin', 'Easy recovery ride', 45, 25, 'Zone 1', 'Very easy'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 4, '06:00', 'endurance', 'Long Ride', 'Weekend long ride', 240, 155, 'Zone 2-3', 'Bring nutrition'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 5, NULL, 'recovery', 'Rest Day', 'Complete rest', 0, 0, NULL, 'Full rest'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 6, '07:00', 'vo2max', '5x3min VO2max', 'VO2max intervals', 60, 88, '110-120% FTP', 'Go hard!'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 7, '07:00', 'endurance', 'Endurance with Tempo', 'Endurance with tempo blocks', 90, 72, 'Zone 2-3', 'Good building session');

-- Equipment
INSERT INTO equipment (athlete_id, equipment_type, name, brand, model, purchase_date, purchase_price, currency, bike_type, frame_size, frame_material, groupset, wheelset, weight_kg, service_interval_km, last_service_date, last_service_km, total_km, total_hours, status, condition, notes) VALUES
('00000000-0000-0000-0000-000000000001', 'bike', 'Race Bike', 'Specialized', 'Tarmac SL7 Expert', '2023-03-15', 5500.00, 'EUR', 'road', '56', 'carbon', 'Shimano Ultegra Di2', 'Roval Rapide CLX', 7.2, 5000, CURRENT_DATE - 45, 12500, 15800, 520, 'active', 'good', 'Main race bike'),
('00000000-0000-0000-0000-000000000001', 'bike', 'Gravel Bike', 'Canyon', 'Grail CF SL 8', '2024-06-20', 3200.00, 'EUR', 'gravel', '56', 'carbon', 'Shimano GRX 810', 'DT Swiss GRC 1400', 8.1, 3000, CURRENT_DATE - 90, 2800, 4200, 180, 'active', 'excellent', 'Winter training'),
('00000000-0000-0000-0000-000000000001', 'trainer', 'Smart Trainer', 'Wahoo', 'KICKR V6', '2024-01-10', 1200.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 320, 'active', 'excellent', 'Indoor setup'),
('00000000-0000-0000-0000-000000000001', 'power_meter', 'Power Meter', 'Garmin', 'Rally XC200', '2023-03-15', 850.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 520, 'active', 'good', 'Dual-sided'),
('00000000-0000-0000-0000-000000000001', 'helmet', 'Aero Helmet', 'Specialized', 'S-Works Evade 3', '2024-02-28', 280.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 180, 'active', 'excellent', 'Race helmet'),
('00000000-0000-0000-0000-000000000001', 'shoes', 'Road Shoes', 'Sidi', 'Shot 2', '2023-08-10', 350.00, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 400, 'active', 'good', 'Main shoes');

-- Expenses
INSERT INTO expenses (athlete_id, date, category, subcategory, description, amount, currency, vendor, notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 'nutrition', 'supplements', 'SiS Beta Fuel & Recovery', 85.00, 'EUR', 'SiS Official Store', 'Monthly supply'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 'equipment', 'maintenance', 'Chain and cassette replacement', 120.00, 'EUR', 'Local Bike Shop', 'Race bike maintenance'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 'race_entry', NULL, 'Milano-Sanremo Gran Fondo Entry', 95.00, 'EUR', 'GranFondo Italia', 'Early bird'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 35, 'membership', NULL, 'Zwift Annual Subscription', 180.00, 'EUR', 'Zwift', 'Indoor platform'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 45, 'coaching', NULL, 'TrainingPeaks Premium', 120.00, 'EUR', 'TrainingPeaks', 'Annual subscription');
