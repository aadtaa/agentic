-- Part 12: Daily Foods (Individual food items - 7 days detailed)
-- Realistic food logging for an endurance athlete

-- Today's Foods (Rest day)
INSERT INTO daily_foods (athlete_id, food_name, brand, serving_size, serving_unit, servings, calories, protein_g, carbs_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, food_group, is_whole_food, is_processed, glycemic_index, data_source) VALUES
-- Breakfast: Oatmeal with banana and honey
('00000000-0000-0000-0000-000000000001', 'Rolled Oats', 'Quaker', 80, 'g', 1, 300, 10, 54, 1, 8, 6, 1, 5, 'grain', true, false, 55, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Banana', NULL, 120, 'g', 1, 105, 1.3, 27, 14, 3, 0.4, 0, 1, 'fruit', true, false, 51, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Honey', NULL, 21, 'g', 1, 64, 0, 17, 17, 0, 0, 0, 1, 'other', true, false, 58, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Milk (Semi-skimmed)', NULL, 200, 'ml', 1, 100, 7, 10, 10, 0, 3.5, 2, 100, 'dairy', true, false, 30, 'manual'),
-- Lunch: Chicken salad with quinoa
('00000000-0000-0000-0000-000000000001', 'Chicken Breast (grilled)', NULL, 150, 'g', 1, 248, 46, 0, 0, 0, 5.4, 1.5, 120, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Quinoa (cooked)', NULL, 150, 'g', 1, 180, 6.6, 32, 0, 3.6, 2.7, 0.3, 10, 'grain', true, false, 53, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Mixed Salad Leaves', NULL, 80, 'g', 1, 16, 1.5, 2.5, 1, 1.5, 0.2, 0, 25, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Cherry Tomatoes', NULL, 100, 'g', 1, 18, 0.9, 3.9, 2.6, 1.2, 0.2, 0, 5, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Olive Oil', NULL, 15, 'ml', 1, 120, 0, 0, 0, 0, 14, 2, 0, 'fat', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Feta Cheese', NULL, 30, 'g', 1, 75, 4, 1, 1, 0, 6, 4, 320, 'dairy', true, false, 0, 'manual'),
-- Dinner: Salmon with roasted vegetables
('00000000-0000-0000-0000-000000000001', 'Atlantic Salmon (baked)', NULL, 180, 'g', 1, 367, 40, 0, 0, 0, 22, 4.4, 110, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Sweet Potato (roasted)', NULL, 200, 'g', 1, 180, 4, 41, 13, 6, 0.2, 0, 70, 'vegetable', true, false, 63, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Broccoli (steamed)', NULL, 150, 'g', 1, 52, 4.4, 10, 2.5, 4, 0.6, 0.1, 50, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Asparagus', NULL, 100, 'g', 1, 20, 2.2, 3.9, 1.9, 2.1, 0.1, 0, 2, 'vegetable', true, false, 15, 'manual'),
-- Snack: Greek yogurt with berries
('00000000-0000-0000-0000-000000000001', 'Greek Yogurt (0% fat)', 'Fage', 170, 'g', 1, 100, 18, 6, 4, 0, 0.7, 0, 65, 'dairy', true, false, 11, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Blueberries', NULL, 75, 'g', 1, 43, 0.6, 11, 7, 1.8, 0.2, 0, 1, 'fruit', true, false, 53, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Strawberries', NULL, 50, 'g', 1, 16, 0.3, 3.8, 2.4, 1, 0.2, 0, 1, 'fruit', true, false, 41, 'manual');

-- Yesterday's Foods (Training day - higher carbs)
INSERT INTO daily_foods (athlete_id, food_name, brand, serving_size, serving_unit, servings, calories, protein_g, carbs_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, food_group, is_whole_food, is_processed, glycemic_index, data_source) VALUES
-- Breakfast: Eggs on toast with avocado
('00000000-0000-0000-0000-000000000001', 'Eggs (scrambled)', NULL, 150, 'g', 1, 220, 15, 2, 1, 0, 17, 5, 180, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Sourdough Bread', NULL, 80, 'g', 2, 220, 8, 42, 2, 2, 2, 0.4, 380, 'grain', true, false, 54, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Avocado', NULL, 80, 'g', 1, 128, 1.6, 6.8, 0.5, 5.4, 12, 1.7, 6, 'fat', true, false, 15, 'manual'),
-- Pre-workout
('00000000-0000-0000-0000-000000000001', 'Banana', NULL, 120, 'g', 1, 105, 1.3, 27, 14, 3, 0.4, 0, 1, 'fruit', true, false, 51, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Energy Bar', 'Clif', 68, 'g', 1, 250, 9, 44, 21, 4, 6, 1.5, 140, 'other', false, true, 65, 'manual'),
-- During workout
('00000000-0000-0000-0000-000000000001', 'Energy Gel', 'SiS', 60, 'ml', 2, 180, 0, 44, 22, 0, 0, 0, 50, 'other', false, true, 95, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Sports Drink', 'SiS', 500, 'ml', 1, 72, 0, 18, 18, 0, 0, 0, 250, 'other', false, true, 90, 'manual'),
-- Post-workout
('00000000-0000-0000-0000-000000000001', 'Whey Protein Powder', 'MyProtein', 30, 'g', 1, 120, 24, 2, 1, 0, 2, 0.5, 50, 'protein', false, true, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Banana', NULL, 120, 'g', 1, 105, 1.3, 27, 14, 3, 0.4, 0, 1, 'fruit', true, false, 51, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Milk (whole)', NULL, 300, 'ml', 1, 186, 10, 15, 15, 0, 10, 6, 150, 'dairy', true, false, 30, 'manual'),
-- Lunch: Pasta with chicken and pesto
('00000000-0000-0000-0000-000000000001', 'Pasta (cooked)', 'Barilla', 200, 'g', 1, 262, 9, 52, 2, 2.5, 1.5, 0.3, 5, 'grain', true, false, 50, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Chicken Breast (grilled)', NULL, 150, 'g', 1, 248, 46, 0, 0, 0, 5.4, 1.5, 120, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Pesto', 'Sacla', 30, 'g', 1, 135, 3, 2, 1, 0.5, 13, 3, 280, 'fat', false, true, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Parmesan Cheese', NULL, 20, 'g', 1, 80, 7, 0.6, 0, 0, 5.5, 3.5, 340, 'dairy', true, false, 0, 'manual'),
-- Dinner: Steak with sweet potato
('00000000-0000-0000-0000-000000000001', 'Sirloin Steak', NULL, 200, 'g', 1, 360, 52, 0, 0, 0, 16, 6, 120, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Sweet Potato (baked)', NULL, 250, 'g', 1, 225, 5, 52, 16, 7.5, 0.3, 0, 88, 'vegetable', true, false, 63, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Green Beans', NULL, 150, 'g', 1, 47, 2.7, 10, 5, 4, 0.2, 0, 9, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Butter', NULL, 10, 'g', 1, 72, 0, 0, 0, 0, 8, 5, 80, 'fat', true, false, 0, 'manual'),
-- Snack
('00000000-0000-0000-0000-000000000001', 'Rice Cakes', 'Kallo', 30, 'g', 3, 117, 2.4, 24, 0.3, 0.9, 1.2, 0.3, 30, 'grain', false, true, 82, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Peanut Butter', NULL, 32, 'g', 1, 190, 8, 6, 2, 2, 16, 3, 140, 'fat', true, false, 14, 'manual');

-- 2 Days Ago Foods (Training day)
INSERT INTO daily_foods (athlete_id, food_name, brand, serving_size, serving_unit, servings, calories, protein_g, carbs_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, food_group, is_whole_food, is_processed, glycemic_index, data_source) VALUES
-- Breakfast: Overnight oats
('00000000-0000-0000-0000-000000000001', 'Rolled Oats', 'Quaker', 80, 'g', 1, 300, 10, 54, 1, 8, 6, 1, 5, 'grain', true, false, 55, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Whey Protein Powder', 'MyProtein', 25, 'g', 1, 100, 20, 1.5, 0.8, 0, 1.5, 0.4, 42, 'protein', false, true, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Chia Seeds', NULL, 15, 'g', 1, 73, 2.5, 6, 0, 5, 4.5, 0.5, 2, 'other', true, false, 1, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Almond Milk', 'Alpro', 200, 'ml', 1, 26, 0.8, 0.6, 0.4, 0.4, 2.2, 0.2, 100, 'dairy', false, true, 25, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Blueberries', NULL, 50, 'g', 1, 29, 0.4, 7, 5, 1.2, 0.2, 0, 1, 'fruit', true, false, 53, 'manual'),
-- Pre-workout
('00000000-0000-0000-0000-000000000001', 'Toast', NULL, 40, 'g', 2, 192, 7.2, 36, 2.6, 2.8, 2, 0.4, 300, 'grain', true, false, 75, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Jam', NULL, 20, 'g', 1, 52, 0.1, 13, 10, 0.2, 0, 0, 8, 'other', false, true, 65, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Coffee', NULL, 250, 'ml', 1, 5, 0.3, 0, 0, 0, 0, 0, 5, 'other', true, false, 0, 'manual'),
-- During workout
('00000000-0000-0000-0000-000000000001', 'Energy Gel', 'SiS', 60, 'ml', 1, 90, 0, 22, 11, 0, 0, 0, 25, 'other', false, true, 95, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Water', NULL, 750, 'ml', 1, 0, 0, 0, 0, 0, 0, 0, 0, 'other', true, false, 0, 'manual'),
-- Post-workout
('00000000-0000-0000-0000-000000000001', 'Chocolate Milk', NULL, 500, 'ml', 1, 250, 16, 40, 38, 0, 5, 3, 250, 'dairy', true, false, 35, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Banana', NULL, 120, 'g', 1, 105, 1.3, 27, 14, 3, 0.4, 0, 1, 'fruit', true, false, 51, 'manual'),
-- Lunch
('00000000-0000-0000-0000-000000000001', 'Turkey Breast', NULL, 120, 'g', 1, 135, 30, 0, 0, 0, 1.2, 0.3, 65, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Whole Wheat Bread', NULL, 80, 'g', 2, 176, 8, 32, 4, 4, 2, 0.4, 300, 'grain', true, false, 69, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Vegetable Soup', NULL, 300, 'ml', 1, 120, 4, 20, 8, 4, 2, 0.5, 600, 'vegetable', true, false, 48, 'manual'),
-- Dinner
('00000000-0000-0000-0000-000000000001', 'Chicken Breast (grilled)', NULL, 180, 'g', 1, 297, 55, 0, 0, 0, 6.5, 1.8, 144, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Basmati Rice (cooked)', NULL, 200, 'g', 1, 260, 5.4, 56, 0, 0.8, 0.6, 0.2, 2, 'grain', true, false, 58, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Mixed Vegetables (stir-fried)', NULL, 200, 'g', 1, 90, 4, 16, 8, 6, 2, 0.3, 40, 'vegetable', true, false, 35, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Soy Sauce', NULL, 15, 'ml', 1, 8, 1.3, 0.8, 0.4, 0.1, 0, 0, 879, 'other', false, true, 20, 'manual'),
-- Snack
('00000000-0000-0000-0000-000000000001', 'Protein Bar', 'Grenade', 60, 'g', 1, 220, 20, 18, 2, 7, 9, 5, 150, 'protein', false, true, 30, 'manual');

-- 3 Days Ago Foods (Rest day)
INSERT INTO daily_foods (athlete_id, food_name, brand, serving_size, serving_unit, servings, calories, protein_g, carbs_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, food_group, is_whole_food, is_processed, glycemic_index, data_source) VALUES
-- Breakfast
('00000000-0000-0000-0000-000000000001', 'Eggs (whole)', NULL, 100, 'g', 2, 286, 20, 1.4, 1, 0, 22, 7, 284, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Spinach', NULL, 60, 'g', 1, 14, 1.7, 2.2, 0.3, 1.3, 0.2, 0, 47, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Mushrooms', NULL, 80, 'g', 1, 18, 2.5, 2.6, 1.7, 0.8, 0.3, 0, 4, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Coffee', NULL, 250, 'ml', 1, 5, 0.3, 0, 0, 0, 0, 0, 5, 'other', true, false, 0, 'manual'),
-- Lunch (restaurant)
('00000000-0000-0000-0000-000000000001', 'Buddha Bowl (tofu, quinoa, vegetables)', NULL, 450, 'g', 1, 550, 28, 65, 12, 12, 20, 3, 650, 'other', true, false, 45, 'manual'),
-- Dinner
('00000000-0000-0000-0000-000000000001', 'White Fish (cod)', NULL, 180, 'g', 1, 166, 36, 0, 0, 0, 1.4, 0.3, 126, 'protein', true, false, 0, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Corn Tortillas', NULL, 60, 'g', 3, 156, 4.2, 32, 0.9, 3.6, 2.1, 0.3, 81, 'grain', true, false, 52, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Cabbage Slaw', NULL, 100, 'g', 1, 45, 1.5, 8, 4, 2.5, 1, 0.1, 30, 'vegetable', true, false, 15, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Lime', NULL, 30, 'g', 1, 9, 0.2, 3, 0.5, 0.8, 0.1, 0, 1, 'fruit', true, false, 20, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Salsa', NULL, 50, 'g', 1, 18, 0.9, 4, 2.5, 1, 0.1, 0, 480, 'vegetable', true, false, 15, 'manual'),
-- Snack
('00000000-0000-0000-0000-000000000001', 'Apple', NULL, 180, 'g', 1, 94, 0.5, 25, 19, 4.4, 0.3, 0, 2, 'fruit', true, false, 36, 'manual'),
('00000000-0000-0000-0000-000000000001', 'Almond Butter', NULL, 30, 'g', 1, 180, 6.3, 6, 1.5, 3.3, 16, 1.2, 2, 'fat', true, false, 0, 'manual');

-- Common athlete pantry items (supplements tracked)
INSERT INTO daily_foods (athlete_id, food_name, brand, serving_size, serving_unit, servings, calories, protein_g, carbs_g, sugar_g, fiber_g, fat_g, saturated_fat_g, sodium_mg, food_group, is_whole_food, is_processed, data_source, notes) VALUES
-- Supplements (today)
('00000000-0000-0000-0000-000000000001', 'Vitamin D3', 'Solgar', 1, 'tablet', 1, 0, 0, 0, 0, 0, 0, 0, 0, 'other', false, true, 'manual', '2000 IU'),
('00000000-0000-0000-0000-000000000001', 'Omega-3 Fish Oil', 'Nordic Naturals', 2, 'softgel', 1, 20, 0, 0, 0, 0, 2, 0.5, 0, 'other', false, true, 'manual', '1000mg EPA/DHA'),
('00000000-0000-0000-0000-000000000001', 'Magnesium Glycinate', 'NOW', 2, 'capsule', 1, 0, 0, 0, 0, 0, 0, 0, 0, 'other', false, true, 'manual', '400mg'),
('00000000-0000-0000-0000-000000000001', 'Creatine Monohydrate', 'MyProtein', 5, 'g', 1, 0, 0, 0, 0, 0, 0, 0, 0, 'other', false, true, 'manual', 'Daily maintenance dose'),
('00000000-0000-0000-0000-000000000001', 'Caffeine (pre-workout)', NULL, 200, 'mg', 1, 0, 0, 0, 0, 0, 0, 0, 0, 'other', false, true, 'manual', 'Training days only');
