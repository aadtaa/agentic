-- Lucy AI Coach - Additional Seed Data
-- Nutrition, Meals, Weather, Location, Medical
-- Run AFTER seed.sql

-- ============================================
-- DAILY NUTRITION (30 days)
-- ============================================

INSERT INTO daily_nutrition (athlete_id, date, calories_total, calories_target, protein_g, protein_target_g, carbs_g, carbs_target_g, fat_g, fat_target_g, fiber_g, water_liters, total_fluids_liters, meals_count, snacks_count, nutrition_score, pre_workout_carbs_g, during_workout_carbs_g, post_workout_protein_g, post_workout_carbs_g, caffeine_mg, alcohol_units, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 2850, 2800, 145, 150, 380, 400, 85, 80, 32, 3.2, 4.0, 3, 2, 75, 60, 45, 30, 80, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 2400, 2200, 130, 130, 280, 280, 78, 75, 28, 2.8, 3.5, 3, 1, 80, 0, 0, 0, 0, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 3200, 3100, 155, 160, 450, 460, 90, 85, 35, 3.8, 5.0, 3, 3, 70, 80, 90, 35, 100, 160, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 2700, 2600, 140, 145, 350, 360, 82, 78, 30, 3.0, 4.2, 3, 2, 75, 50, 40, 28, 70, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 2500, 2400, 135, 140, 320, 320, 80, 75, 28, 2.8, 3.8, 3, 1, 72, 40, 30, 25, 60, 100, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 2300, 2200, 125, 130, 270, 280, 75, 72, 26, 2.5, 3.2, 3, 1, 78, 0, 0, 0, 0, 80, 2, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 3400, 3300, 165, 170, 480, 500, 95, 90, 38, 4.2, 5.5, 3, 3, 82, 100, 120, 40, 120, 180, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 2600, 2500, 138, 145, 340, 350, 80, 78, 30, 3.0, 4.0, 3, 2, 70, 50, 40, 30, 75, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 2350, 2200, 128, 130, 280, 280, 76, 72, 27, 2.6, 3.4, 3, 1, 75, 0, 0, 0, 0, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 2900, 2850, 148, 155, 390, 400, 86, 82, 33, 3.4, 4.5, 3, 2, 78, 65, 55, 32, 85, 140, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 2550, 2500, 135, 140, 330, 340, 80, 78, 29, 2.9, 3.8, 3, 2, 74, 45, 35, 28, 65, 100, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 2650, 2600, 140, 145, 350, 360, 82, 80, 31, 3.1, 4.0, 3, 2, 72, 55, 45, 30, 75, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 2400, 2200, 130, 130, 285, 280, 78, 75, 28, 2.7, 3.5, 3, 1, 78, 0, 0, 0, 0, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 3600, 3500, 175, 180, 510, 520, 100, 95, 40, 4.5, 6.0, 3, 4, 85, 110, 140, 45, 130, 200, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 2200, 2100, 118, 120, 260, 260, 72, 70, 24, 2.4, 3.0, 3, 1, 65, 30, 20, 20, 50, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 2350, 2200, 125, 130, 280, 280, 75, 72, 26, 2.6, 3.3, 3, 1, 75, 0, 0, 0, 0, 80, 1, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 2850, 2800, 145, 150, 380, 390, 85, 82, 32, 3.2, 4.2, 3, 2, 78, 60, 50, 32, 80, 140, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 2550, 2500, 135, 140, 335, 340, 80, 78, 29, 2.9, 3.8, 3, 2, 72, 45, 35, 28, 65, 100, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 2700, 2650, 142, 148, 360, 370, 84, 80, 31, 3.1, 4.0, 3, 2, 76, 55, 45, 30, 75, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 2400, 2200, 130, 130, 285, 280, 78, 75, 28, 2.7, 3.5, 3, 1, 80, 0, 0, 0, 0, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 3150, 3100, 158, 165, 440, 450, 92, 88, 36, 3.8, 5.0, 3, 3, 82, 85, 100, 38, 110, 160, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 2450, 2400, 132, 138, 315, 320, 78, 76, 28, 2.8, 3.6, 3, 1, 68, 40, 30, 25, 55, 100, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 2350, 2200, 128, 130, 280, 280, 76, 72, 27, 2.6, 3.4, 3, 1, 76, 0, 0, 0, 0, 80, 2, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 2900, 2850, 150, 155, 390, 400, 88, 84, 34, 3.4, 4.5, 3, 2, 78, 70, 60, 35, 90, 140, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 2700, 2650, 142, 148, 360, 370, 84, 80, 31, 3.1, 4.2, 3, 2, 74, 55, 45, 30, 75, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 2600, 2550, 138, 145, 345, 350, 82, 78, 30, 3.0, 4.0, 3, 2, 76, 50, 40, 28, 70, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 2400, 2200, 130, 130, 285, 280, 78, 75, 28, 2.7, 3.5, 3, 1, 82, 0, 0, 0, 0, 80, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 2950, 2900, 152, 158, 400, 410, 88, 85, 34, 3.5, 4.6, 3, 2, 85, 75, 65, 35, 95, 160, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 2650, 2600, 140, 145, 355, 360, 83, 80, 31, 3.1, 4.1, 3, 2, 76, 55, 45, 30, 75, 120, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 2350, 2200, 128, 130, 280, 280, 76, 72, 27, 2.6, 3.4, 3, 1, 78, 0, 0, 0, 0, 80, 0, 'manual');

-- ============================================
-- DAILY MEALS (Sample meals for last 7 days)
-- ============================================

-- Today (rest day)
INSERT INTO daily_meals (athlete_id, date, meal_type, meal_time, meal_name, calories, protein_g, carbs_g, fat_g, location, homemade, quality_score) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'breakfast', CURRENT_DATE + TIME '07:30', 'Oatmeal with banana and honey', 450, 15, 78, 10, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'lunch', CURRENT_DATE + TIME '12:30', 'Chicken salad with quinoa', 620, 45, 55, 22, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'dinner', CURRENT_DATE + TIME '19:00', 'Salmon with roasted vegetables', 680, 48, 42, 32, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'snack', CURRENT_DATE + TIME '15:30', 'Greek yogurt with berries', 200, 20, 25, 4, 'home', true, 4);

-- Yesterday (training day)
INSERT INTO daily_meals (athlete_id, date, meal_type, meal_time, meal_name, calories, protein_g, carbs_g, fat_g, location, homemade, quality_score) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'breakfast', (CURRENT_DATE - 1) + TIME '06:30', 'Eggs on toast with avocado', 520, 25, 45, 28, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'pre_workout', (CURRENT_DATE - 1) + TIME '08:00', 'Banana and energy bar', 280, 6, 55, 6, 'home', false, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'during_workout', (CURRENT_DATE - 1) + TIME '09:30', 'Energy gels and sports drink', 240, 0, 60, 0, 'on_bike', false, 3),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'post_workout', (CURRENT_DATE - 1) + TIME '11:00', 'Recovery shake with banana', 380, 30, 50, 6, 'home', true, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'lunch', (CURRENT_DATE - 1) + TIME '13:00', 'Pasta with chicken and pesto', 720, 42, 85, 24, 'home', true, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'dinner', (CURRENT_DATE - 1) + TIME '19:30', 'Steak with sweet potato and greens', 750, 52, 60, 32, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'snack', (CURRENT_DATE - 1) + TIME '16:00', 'Rice cakes with peanut butter', 320, 10, 40, 14, 'home', true, 4);

-- Day before (training day)
INSERT INTO daily_meals (athlete_id, date, meal_type, meal_time, meal_name, calories, protein_g, carbs_g, fat_g, location, homemade, quality_score) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'breakfast', (CURRENT_DATE - 2) + TIME '06:00', 'Overnight oats with protein powder', 480, 32, 62, 12, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'pre_workout', (CURRENT_DATE - 2) + TIME '07:30', 'Toast with jam and coffee', 250, 5, 48, 4, 'home', true, 3),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'during_workout', (CURRENT_DATE - 2) + TIME '09:00', 'Energy gels and water', 180, 0, 45, 0, 'on_bike', false, 3),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'post_workout', (CURRENT_DATE - 2) + TIME '10:30', 'Chocolate milk and banana', 340, 18, 55, 8, 'home', false, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'lunch', (CURRENT_DATE - 2) + TIME '12:30', 'Turkey sandwich with soup', 650, 38, 72, 22, 'work', false, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'dinner', (CURRENT_DATE - 2) + TIME '19:00', 'Grilled chicken with rice and vegetables', 680, 48, 68, 18, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'snack', (CURRENT_DATE - 2) + TIME '15:00', 'Protein bar', 220, 20, 25, 8, 'work', false, 3);

-- 3 days ago (rest day)
INSERT INTO daily_meals (athlete_id, date, meal_type, meal_time, meal_name, calories, protein_g, carbs_g, fat_g, location, homemade, quality_score) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 'breakfast', (CURRENT_DATE - 3) + TIME '08:00', 'Scrambled eggs with spinach', 380, 28, 8, 26, 'home', true, 5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 'lunch', (CURRENT_DATE - 3) + TIME '12:30', 'Buddha bowl with tofu', 550, 28, 65, 20, 'restaurant', false, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 'dinner', (CURRENT_DATE - 3) + TIME '19:00', 'Fish tacos with slaw', 620, 35, 58, 28, 'home', true, 4),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 'snack', (CURRENT_DATE - 3) + TIME '16:00', 'Apple with almond butter', 250, 6, 30, 14, 'home', true, 5);

-- ============================================
-- DAILY WEATHER (30 days)
-- ============================================

INSERT INTO daily_weather (athlete_id, date, location, condition, temp_high_c, temp_low_c, temp_avg_c, humidity_pct, wind_speed_kmh, precipitation_mm, uv_index, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 12, 6, 9, 75, 18, 2.5, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 14, 7, 10, 65, 12, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 13, 8, 10, 70, 15, 0, 3, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 11, 5, 8, 78, 20, 1.2, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'rainy', 10, 6, 8, 85, 22, 8.5, 1, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 11, 5, 8, 80, 18, 0.5, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 15, 8, 12, 62, 10, 0, 5, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 14, 7, 11, 68, 14, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 16, 9, 12, 60, 8, 0, 5, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 13, 7, 10, 72, 16, 0.8, 3, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'rainy', 11, 6, 8, 88, 25, 12.3, 1, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 12, 5, 9, 76, 20, 1.5, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 15, 8, 11, 64, 12, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 17, 10, 14, 58, 8, 0, 6, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 14, 8, 11, 70, 14, 0, 3, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 12, 6, 9, 75, 18, 2.0, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 13, 7, 10, 72, 16, 0, 3, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'rainy', 10, 5, 7, 90, 28, 15.6, 1, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 11, 6, 8, 78, 22, 3.2, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 16, 9, 12, 62, 10, 0, 5, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 15, 8, 11, 66, 12, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 13, 7, 10, 74, 18, 1.0, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 17, 10, 13, 60, 8, 0, 5, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 15, 9, 12, 68, 14, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 13, 7, 10, 72, 16, 0.5, 3, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'rainy', 11, 6, 8, 85, 24, 9.8, 1, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'cloudy', 12, 6, 9, 78, 20, 2.5, 2, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 16, 9, 12, 64, 10, 0, 5, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'partly_cloudy', 14, 8, 11, 68, 14, 0, 4, 'openweather'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, '{"city": "London", "lat": 51.5074, "lng": -0.1278}', 'sunny', 15, 8, 12, 65, 12, 0, 4, 'openweather');

-- ============================================
-- DAILY LOCATION (30 days)
-- ============================================

INSERT INTO daily_location (athlete_id, date, city, country, country_code, lat, lng, elevation_m, timezone, location_type, is_altitude_training, travel_day, data_source) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 11, 'Europe/London', 'home', false, false, 'manual');

-- ============================================
-- DAILY MEDICAL (30 days - mostly healthy)
-- ============================================

INSERT INTO daily_medical (athlete_id, date, sick, injured, medications, supplements, doctor_visit, medical_notes) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 29, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 28, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 27, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 26, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 25, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, 'Slight knee niggle after intervals, monitoring'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 24, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, 'Knee feeling better after rest'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 23, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 22, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 21, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 20, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 19, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 18, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 17, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 16, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 15, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, 'Very fatigued after big ride, need extra recovery'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 14, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 13, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 12, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 11, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 9, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 8, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 7, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 6, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 5, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 3, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 2, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, false, false, '[]', '[{"name": "Vitamin D", "dose": "2000 IU"}, {"name": "Omega-3", "dose": "1000mg"}, {"name": "Magnesium", "dose": "400mg"}]', false, NULL);

-- ============================================
-- PLANNED WORKOUTS (Next 7 days)
-- ============================================

INSERT INTO planned_workouts (athlete_id, scheduled_date, workout_type, title, description, duration_planned_minutes, tss_planned, intensity_target, structure) VALUES
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, 'endurance', 'Easy Endurance Ride', 'Zone 2 spin to recover from weekend', 75, 55, 'Zone 2 (56-75% FTP)', '[{"duration": 600, "intensity": "warmup"}, {"duration": 3600, "intensity": "z2"}, {"duration": 300, "intensity": "cooldown"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 2, 'threshold', 'Sweet Spot Intervals', '3x15min at 88-93% FTP with 5min recovery', 90, 85, '88-93% FTP', '[{"duration": 900, "intensity": "warmup"}, {"duration": 900, "intensity": "sweetspot"}, {"duration": 300, "intensity": "recovery"}, {"duration": 900, "intensity": "sweetspot"}, {"duration": 300, "intensity": "recovery"}, {"duration": 900, "intensity": "sweetspot"}, {"duration": 600, "intensity": "cooldown"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 3, 'recovery', 'Recovery Spin', 'Very easy spin, keep HR low', 45, 25, 'Zone 1 (<55% FTP)', '[{"duration": 2700, "intensity": "z1"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 4, 'vo2max', 'VO2max Intervals', '5x4min at 105-115% FTP with 4min recovery', 75, 90, '105-115% FTP', '[{"duration": 600, "intensity": "warmup"}, {"duration": 240, "intensity": "vo2max"}, {"duration": 240, "intensity": "recovery"}, {"duration": 240, "intensity": "vo2max"}, {"duration": 240, "intensity": "recovery"}, {"duration": 240, "intensity": "vo2max"}, {"duration": 240, "intensity": "recovery"}, {"duration": 240, "intensity": "vo2max"}, {"duration": 240, "intensity": "recovery"}, {"duration": 240, "intensity": "vo2max"}, {"duration": 600, "intensity": "cooldown"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 5, 'endurance', 'Endurance with Tempo', 'Long ride with tempo blocks', 150, 120, 'Zone 2-3', '[{"duration": 900, "intensity": "warmup"}, {"duration": 3600, "intensity": "z2"}, {"duration": 1200, "intensity": "tempo"}, {"duration": 1800, "intensity": "z2"}, {"duration": 1200, "intensity": "tempo"}, {"duration": 300, "intensity": "cooldown"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 6, 'recovery', 'Active Recovery', 'Easy spin or rest day', 30, 15, 'Zone 1', '[{"duration": 1800, "intensity": "z1"}]'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE + 7, 'endurance', 'Long Endurance Ride', 'Weekend long ride, steady pace', 180, 140, 'Zone 2', '[{"duration": 900, "intensity": "warmup"}, {"duration": 9000, "intensity": "z2"}, {"duration": 900, "intensity": "cooldown"}]');
