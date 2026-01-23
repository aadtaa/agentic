-- Part 10: Athlete Connections (OAuth/API Integrations)
-- Demo athlete connected services

-- Clear existing connections first
DELETE FROM athlete_connections WHERE athlete_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO athlete_connections (athlete_id, provider, provider_user_id, access_token, refresh_token, token_expires_at, scopes, last_sync_at, sync_enabled, sync_frequency, connection_status) VALUES
-- Garmin Connect - Primary training device
('00000000-0000-0000-0000-000000000001', 'garmin', 'garmin_user_12345', 'encrypted_access_token_garmin', 'encrypted_refresh_token_garmin', NOW() + INTERVAL '30 days', '["activity_read", "sleep_read", "health_read"]', NOW() - INTERVAL '2 hours', true, 'hourly', 'connected'),

-- Strava - Social sharing
('00000000-0000-0000-0000-000000000001', 'strava', 'strava_athlete_67890', 'encrypted_access_token_strava', 'encrypted_refresh_token_strava', NOW() + INTERVAL '5 hours', '["activity:read_all", "profile:read_all"]', NOW() - INTERVAL '1 hour', true, 'realtime', 'connected'),

-- Wahoo - Smart trainer
('00000000-0000-0000-0000-000000000001', 'wahoo', 'wahoo_user_24680', 'encrypted_access_token_wahoo', 'encrypted_refresh_token_wahoo', NOW() + INTERVAL '60 days', '["workouts_read", "workout_write"]', NOW() - INTERVAL '3 hours', true, 'daily', 'connected'),

-- Oura Ring - Sleep and recovery
('00000000-0000-0000-0000-000000000001', 'oura', 'oura_user_13579', 'encrypted_access_token_oura', 'encrypted_refresh_token_oura', NOW() + INTERVAL '90 days', '["daily", "sleep", "workout"]', NOW() - INTERVAL '30 minutes', true, 'hourly', 'connected'),

-- MyFitnessPal - Nutrition tracking
('00000000-0000-0000-0000-000000000001', 'myfitnesspal', 'mfp_user_11223', 'encrypted_access_token_mfp', 'encrypted_refresh_token_mfp', NOW() + INTERVAL '14 days', '["diary_read"]', NOW() - INTERVAL '4 hours', true, 'daily', 'connected'),

-- TrainingPeaks - Training plan sync
('00000000-0000-0000-0000-000000000001', 'trainingpeaks', 'tp_athlete_44556', 'encrypted_access_token_tp', 'encrypted_refresh_token_tp', NOW() + INTERVAL '7 days', '["workouts", "athlete"]', NOW() - INTERVAL '6 hours', true, 'daily', 'connected'),

-- Zwift - Indoor training
('00000000-0000-0000-0000-000000000001', 'zwift', 'zwift_rider_77889', 'encrypted_access_token_zwift', 'encrypted_refresh_token_zwift', NOW() + INTERVAL '30 days', '["activity_read", "profile_read"]', NOW() - INTERVAL '1 day', true, 'daily', 'connected'),

-- Apple Health - General health data (token expired example)
('00000000-0000-0000-0000-000000000001', 'apple_health', 'apple_user_99001', 'encrypted_access_token_apple', 'encrypted_refresh_token_apple', NOW() - INTERVAL '2 days', '["health_read"]', NOW() - INTERVAL '3 days', true, 'daily', 'expired');
