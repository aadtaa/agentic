// Lucy AI Coach - Database Types
// Auto-generated from schema.sql

// ============================================
// ENUMS
// ============================================

export type Sex = 'male' | 'female' | 'other'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type CompetitiveLevel = 'beginner' | 'amateur' | 'amateur_elite' | 'elite' | 'pro'
export type RiderType = 'Sprinter' | 'Climber' | 'Diesel' | 'All-rounder' | 'TT Specialist'
export type UnitsPreference = 'metric' | 'imperial'
export type SyncFrequency = 'realtime' | 'hourly' | 'daily'
export type ConnectionStatus = 'connected' | 'expired' | 'error'
export type DataSource = 'test' | 'race' | 'estimated'
export type PowerDomain = 'Extreme' | 'Severe' | 'Heavy' | 'Moderate'
export type ActivityContext = 'fresh' | 'fatigued' | 'race' | 'training'
export type ActivityType = 'ride' | 'run' | 'swim' | 'strength' | 'other'
export type WorkoutType = 'endurance' | 'threshold' | 'vo2max' | 'recovery' | 'race' | 'test' | 'tempo' | 'sweet_spot' | 'anaerobic' | 'sprint' | 'strength'
export type Feeling = 'great' | 'good' | 'ok' | 'tired' | 'bad'
export type CarbDependency = 'Low' | 'Moderate' | 'High'
export type MetabolicType = 'Diesel' | 'Balanced' | 'Explosive'
export type DurabilityRating = 'Poor' | 'Fair' | 'Good' | 'Excellent'
export type ComparisonPopulation = 'all' | 'age_group' | 'competitive_level'
export type LegFeeling = 'fresh' | 'normal' | 'tired' | 'heavy' | 'dead'
export type MenstrualPhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal'
export type HRVariabilityTrend = 'increasing' | 'stable' | 'decreasing'
export type PollenLevel = 'low' | 'medium' | 'high' | 'very_high'
export type LocationType = 'home' | 'training_camp' | 'race_venue' | 'travel' | 'vacation'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'during_workout' | 'post_workout'
export type PortionSize = 'small' | 'normal' | 'large'
export type EatingSpeed = 'slow' | 'normal' | 'fast'
export type FoodGroup = 'grain' | 'protein' | 'vegetable' | 'fruit' | 'dairy' | 'fat' | 'other'
export type TssTrend = 'increasing' | 'stable' | 'decreasing'
export type HrvTrend = 'improving' | 'stable' | 'declining'
export type WeekRating = 'great' | 'good' | 'ok' | 'poor' | 'bad'
export type TrainingPhase = 'base' | 'build' | 'peak' | 'recovery' | 'off'
export type EventType = 'race_road' | 'race_crit' | 'race_tt' | 'gran_fondo' | 'sportive' | 'other'
export type EventPriority = 'A' | 'B' | 'C'
export type CourseProfile = 'flat' | 'rolling' | 'hilly' | 'mountainous'
export type LifeEventType = 'work' | 'travel' | 'family' | 'social' | 'vacation' | 'medical'
export type TrainingImpact = 'none' | 'reduced' | 'blocked'
export type TravelPurpose = 'race' | 'training_camp' | 'vacation' | 'work'
export type AccommodationType = 'hotel' | 'airbnb' | 'friends' | 'camping'
export type EquipmentType = 'bike' | 'shoes' | 'helmet' | 'power_meter' | 'trainer' | 'other'
export type BikeType = 'road' | 'tt' | 'gravel' | 'mtb' | 'track'
export type FrameMaterial = 'carbon' | 'aluminum' | 'steel' | 'titanium'
export type EquipmentStatus = 'active' | 'backup' | 'retired' | 'sold'
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'needs_service'
export type ExpenseCategory = 'equipment' | 'race_entry' | 'travel' | 'nutrition' | 'coaching' | 'membership' | 'medical' | 'other'

// ============================================
// JSON TYPES
// ============================================

export interface HomeLocation {
  city: string
  country: string
  lat: number
  lng: number
  elevation_m: number
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface IntensityDistribution {
  z1?: number
  z2?: number
  z3?: number
  z4?: number
  z5?: number
  z6?: number
  z7?: number
}

export interface WorkoutStructure {
  duration: number
  intensity: string
  description?: string
}

export interface Flight {
  airline: string
  flight_number: string
  departure_airport: string
  arrival_airport: string
  departure_time: string
  arrival_time: string
  booking_ref?: string
  seat?: string
}

export interface GroundTransport {
  type: string
  details: string
  booking_ref?: string
}

export interface CostsBreakdown {
  flights?: number
  hotel?: number
  transport?: number
  food?: number
  race_entry?: number
  other?: number
}

export interface Medication {
  name: string
  dose: string
  frequency: string
}

export interface Supplement {
  name: string
  dose: string
}

// ============================================
// LAYER 1: ATHLETE IDENTITY
// ============================================

export interface AthleteProfile {
  id: string
  name: string
  preferred_name: string | null
  email: string | null
  phone: string | null
  weight_kg: number | null
  height_cm: number | null
  date_of_birth: string | null
  sex: Sex | null
  blood_type: BloodType | null
  competitive_level: CompetitiveLevel | null
  rider_type: RiderType | null
  rider_type_confidence: number | null
  primary_sport: string | null
  secondary_sports: string[]
  training_start_date: string | null
  coach_name: string | null
  coach_email: string | null
  timezone: string
  units_preference: UnitsPreference
  language: string
  home_location: HomeLocation | null
  passport_country: string | null
  dietary_restrictions: string[]
  allergies: string[]
  emergency_contact: EmergencyContact | null
  created_at: string
  updated_at: string
}

export interface AthleteConnection {
  id: string
  athlete_id: string
  provider: string
  provider_user_id: string | null
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string[]
  last_sync_at: string | null
  sync_enabled: boolean
  sync_frequency: SyncFrequency
  connection_status: ConnectionStatus
  error_message: string | null
  created_at: string
}

// ============================================
// LAYER 2: POWER PROFILE
// ============================================

export interface SignatureMetrics {
  id: string
  athlete_id: string
  recorded_at: string
  ftp_watts: number | null
  ftp_w_per_kg: number | null
  critical_power_watts: number | null
  critical_power_w_per_kg: number | null
  w_prime_kj: number | null
  w_prime_j_per_kg: number | null
  pmax_watts: number | null
  pmax_w_per_kg: number | null
  map_watts: number | null
  map_w_per_kg: number | null
  max_hr: number | null
  resting_hr: number | null
  lthr: number | null
  data_source: DataSource | null
  notes: string | null
  created_at: string
}

export interface PowerDurationCurve {
  id: string
  athlete_id: string
  duration_seconds: number
  power_watts: number
  w_per_kg: number | null
  domain: PowerDomain | null
  physiological_parameter: string | null
  recorded_at: string
  tcx_file_id: string | null
  context: ActivityContext | null
  created_at: string
}

export interface SevenAxisProfile {
  id: string
  athlete_id: string
  recorded_at: string
  neuromuscular_p: number | null
  w_prime_p: number | null
  glycolytic_p: number | null
  vo2max_p: number | null
  threshold_p: number | null
  endurance_p: number | null
  durability_p: number | null
  comparison_population: ComparisonPopulation
  created_at: string
}

export interface MetabolicProfile {
  id: string
  athlete_id: string
  recorded_at: string
  fractional_utilization_pct: number | null
  vlamax_estimated: number | null
  w_prime_cp_ratio_seconds: number | null
  p1min_p20min_ratio: number | null
  fat_max_watts: number | null
  carb_dependency: CarbDependency | null
  metabolic_type: MetabolicType | null
  created_at: string
}

export interface DurabilityMetrics {
  id: string
  athlete_id: string
  recorded_at: string
  retention_pct: number | null
  fresh_cp_watts: number | null
  fatigued_cp_watts: number | null
  power_fade_5min_pct: number | null
  power_fade_20min_pct: number | null
  hr_power_decoupling_pct: number | null
  tte_at_cp_minutes: number | null
  durability_rating: DurabilityRating | null
  created_at: string
}

// ============================================
// LAYER 3: TRAINING DATA
// ============================================

export interface TcxFile {
  id: string
  athlete_id: string
  filename: string
  file_path: string
  file_hash: string | null
  uploaded_at: string
  activity_date: string
  activity_type: ActivityType | null
  workout_type: WorkoutType | null
  title: string | null
  duration_seconds: number | null
  moving_time_seconds: number | null
  distance_meters: number | null
  elevation_meters: number | null
  avg_power: number | null
  max_power: number | null
  normalized_power: number | null
  intensity_factor: number | null
  tss: number | null
  avg_hr: number | null
  max_hr: number | null
  avg_cadence: number | null
  indoor: boolean
  device: string | null
  notes: string | null
  rpe: number | null
  feeling: Feeling | null
  processed: boolean
  processing_error: string | null
  created_at: string
}

export interface TrainingLoad {
  id: string
  athlete_id: string
  date: string
  tss_total: number
  duration_total_seconds: number
  activities_count: number
  atl: number | null
  ctl: number | null
  tsb: number | null
  ramp_rate: number | null
  intensity_distribution: IntensityDistribution | null
  created_at: string
  updated_at: string
}

// ============================================
// LAYER 4: THREE-BLOCK SYSTEM
// ============================================

export interface DailyLog {
  id: string
  athlete_id: string
  date: string
  readiness_score: number | null
  energy_score: number | null
  motivation_score: number | null
  mood_score: number | null
  stress_score: number | null
  sleep_score: number | null
  nutrition_score: number | null
  recovery_score: number | null
  trained: boolean
  tss_total: number
  duration_total_minutes: number
  activities_count: number
  rest_day: boolean
  sick: boolean
  injured: boolean
  travel_day: boolean
  race_day: boolean
  morning_notes: string | null
  evening_notes: string | null
  coach_notes: string | null
  completed_at: string | null
  data_completeness: number | null
  created_at: string
  updated_at: string
}

export interface DailySleep {
  id: string
  athlete_id: string
  date: string
  time_in_bed_minutes: number | null
  total_sleep_minutes: number | null
  sleep_efficiency_pct: number | null
  bedtime: string | null
  sleep_onset: string | null
  wake_time: string | null
  sleep_latency_minutes: number | null
  deep_sleep_minutes: number | null
  rem_sleep_minutes: number | null
  light_sleep_minutes: number | null
  awake_minutes: number | null
  sleep_score: number | null
  restfulness_score: number | null
  awakenings_count: number | null
  avg_hr_sleeping: number | null
  lowest_hr: number | null
  hrv_avg: number | null
  hrv_rmssd: number | null
  respiratory_rate: number | null
  skin_temperature_deviation: number | null
  blood_oxygen_avg_pct: number | null
  room_temperature_c: number | null
  room_humidity_pct: number | null
  sleep_quality_feel: number | null
  dream_recall: boolean | null
  notes: string | null
  data_source: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface DailyNutrition {
  id: string
  athlete_id: string
  date: string
  calories_total: number | null
  calories_target: number | null
  protein_g: number | null
  protein_target_g: number | null
  carbs_g: number | null
  carbs_target_g: number | null
  fat_g: number | null
  fat_target_g: number | null
  fiber_g: number | null
  sodium_mg: number | null
  potassium_mg: number | null
  magnesium_mg: number | null
  calcium_mg: number | null
  iron_mg: number | null
  zinc_mg: number | null
  vitamin_d_iu: number | null
  vitamin_b12_mcg: number | null
  vitamin_c_mg: number | null
  omega_3_g: number | null
  water_liters: number | null
  total_fluids_liters: number | null
  electrolytes_mg: number | null
  meals_count: number | null
  snacks_count: number | null
  processed_food_pct: number | null
  whole_foods_pct: number | null
  vegetables_servings: number | null
  fruits_servings: number | null
  nutrition_score: number | null
  pre_workout_carbs_g: number | null
  during_workout_carbs_g: number | null
  during_workout_fluids_ml: number | null
  post_workout_protein_g: number | null
  post_workout_carbs_g: number | null
  fueling_compliance: number | null
  alcohol_units: number | null
  caffeine_mg: number | null
  supplements_taken: Supplement[]
  fasting_hours: number | null
  notes: string | null
  data_source: string | null
  created_at: string
}

export interface DailyMeal {
  id: string
  athlete_id: string
  date: string
  daily_nutrition_id: string | null
  meal_type: MealType | null
  meal_time: string | null
  meal_name: string | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  fiber_g: number | null
  location: string | null
  restaurant_name: string | null
  homemade: boolean | null
  meal_prep: boolean | null
  quality_score: number | null
  portion_size: PortionSize | null
  eating_speed: EatingSpeed | null
  mindful_eating: boolean | null
  photo_url: string | null
  data_source: string | null
  notes: string | null
  created_at: string
}

export interface DailyFood {
  id: string
  athlete_id: string
  meal_id: string | null
  food_name: string
  brand: string | null
  barcode: string | null
  food_database_id: string | null
  serving_size: number | null
  serving_unit: string | null
  servings: number | null
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  sugar_g: number | null
  fiber_g: number | null
  fat_g: number | null
  saturated_fat_g: number | null
  trans_fat_g: number | null
  sodium_mg: number | null
  cholesterol_mg: number | null
  potassium_mg: number | null
  vitamin_a_iu: number | null
  vitamin_c_mg: number | null
  calcium_mg: number | null
  iron_mg: number | null
  food_group: FoodGroup | null
  is_whole_food: boolean | null
  is_processed: boolean | null
  glycemic_index: number | null
  data_source: string | null
  notes: string | null
  created_at: string
}

export interface DailyWellness {
  id: string
  athlete_id: string
  date: string
  mood_score: number | null
  anxiety_level: number | null
  stress_level: number | null
  motivation_training: number | null
  motivation_life: number | null
  focus_level: number | null
  irritability: number | null
  confidence: number | null
  energy_level: number | null
  fatigue_level: number | null
  muscle_soreness: number | null
  soreness_locations: string[]
  pain_level: number | null
  pain_locations: string[]
  legs_feeling: LegFeeling | null
  recovery_score: number | null
  readiness_to_train: number | null
  menstrual_cycle_day: number | null
  menstrual_phase: MenstrualPhase | null
  menstrual_symptoms: Record<string, unknown> | null
  contraceptive_type: string | null
  gratitude: string | null
  wins: string | null
  challenges: string | null
  journal_entry: string | null
  data_source: string | null
  created_at: string
}

export interface DailyBiometrics {
  id: string
  athlete_id: string
  date: string
  measurement_time: string | null
  resting_hr: number | null
  hrv_rmssd: number | null
  hrv_score: number | null
  hr_variability_trend: HRVariabilityTrend | null
  weight_kg: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bone_mass_kg: number | null
  water_pct: number | null
  visceral_fat: number | null
  metabolic_age: number | null
  bmr_kcal: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  blood_oxygen_pct: number | null
  respiratory_rate: number | null
  body_temperature_c: number | null
  glucose_mg_dl: number | null
  ketones_mmol: number | null
  lactate_mmol: number | null
  skin_temperature_c: number | null
  core_temperature_c: number | null
  steps_count: number | null
  standing_hours: number | null
  data_source: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface DailyWeather {
  id: string
  athlete_id: string
  date: string
  location: { city: string; lat: number; lng: number } | null
  condition: string | null
  condition_code: string | null
  description: string | null
  temp_high_c: number | null
  temp_low_c: number | null
  temp_avg_c: number | null
  feels_like_c: number | null
  wind_speed_kmh: number | null
  wind_gust_kmh: number | null
  wind_direction: string | null
  precipitation_mm: number | null
  precipitation_probability_pct: number | null
  snow_cm: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  uv_index: number | null
  visibility_km: number | null
  air_quality_index: number | null
  pollen_level: PollenLevel | null
  sunrise: string | null
  sunset: string | null
  daylight_hours: number | null
  data_source: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface DailyLocation {
  id: string
  athlete_id: string
  date: string
  city: string | null
  region: string | null
  country: string | null
  country_code: string | null
  lat: number | null
  lng: number | null
  elevation_m: number | null
  timezone: string | null
  location_type: LocationType | null
  is_altitude_training: boolean
  days_at_altitude: number | null
  travel_day: boolean
  travel_hours: number | null
  time_zone_change: number | null
  jet_lag_severity: number | null
  data_source: string | null
  created_at: string
}

export interface DailyMedical {
  id: string
  athlete_id: string
  date: string
  sick: boolean
  illness_type: string | null
  illness_severity: number | null
  illness_symptoms: string[]
  fever_c: number | null
  illness_day: number | null
  injured: boolean
  injury_type: string | null
  injury_location: string | null
  injury_severity: number | null
  injury_limiting_training: boolean | null
  treatment: string | null
  medications: Medication[]
  supplements: Supplement[]
  new_medication_started: boolean
  doctor_visit: boolean
  appointment_type: string | null
  appointment_notes: string | null
  blood_test: boolean
  blood_test_results: Record<string, unknown> | null
  other_tests: Record<string, unknown> | null
  medical_notes: string | null
  created_at: string
}

export interface WeeklySummary {
  id: string
  athlete_id: string
  week_start: string
  week_end: string
  total_tss: number | null
  total_hours: number | null
  total_distance_km: number | null
  total_elevation_m: number | null
  activities_count: number | null
  training_days: number | null
  rest_days: number | null
  longest_activity_hours: number | null
  highest_tss_day: number | null
  intensity_distribution: IntensityDistribution | null
  compliance_pct: number | null
  avg_daily_tss: number | null
  tss_trend: TssTrend | null
  week_vs_last_week_pct: number | null
  atl_end: number | null
  ctl_end: number | null
  tsb_end: number | null
  avg_sleep_hours: number | null
  avg_sleep_score: number | null
  total_sleep_debt_hours: number | null
  nights_below_7h: number | null
  avg_hrv: number | null
  hrv_trend: HrvTrend | null
  sleep_consistency_score: number | null
  avg_calories: number | null
  avg_protein_g: number | null
  avg_carbs_g: number | null
  nutrition_compliance_pct: number | null
  avg_hydration_liters: number | null
  alcohol_total_units: number | null
  avg_energy: number | null
  avg_stress: number | null
  avg_mood: number | null
  avg_soreness: number | null
  avg_readiness: number | null
  high_stress_days: number | null
  low_energy_days: number | null
  sick_days: number | null
  injury_days: number | null
  weight_start_kg: number | null
  weight_end_kg: number | null
  weight_change_kg: number | null
  avg_resting_hr: number | null
  resting_hr_trend: HRVariabilityTrend | null
  avg_temp_c: number | null
  rainy_days: number | null
  indoor_training_days: number | null
  travel_days: number | null
  locations_visited: string[]
  time_at_altitude_days: number | null
  week_rating: WeekRating | null
  biggest_win: string | null
  biggest_challenge: string | null
  lucy_summary: string | null
  coach_notes: string | null
  athlete_reflection: string | null
  data_completeness_pct: number | null
  generated_at: string | null
  created_at: string
}

export interface MonthlySummary {
  id: string
  athlete_id: string
  month: string
  total_tss: number | null
  total_hours: number | null
  total_distance_km: number | null
  total_elevation_m: number | null
  activities_count: number | null
  avg_weekly_tss: number | null
  training_consistency_pct: number | null
  biggest_week_tss: number | null
  ftp_start: number | null
  ftp_end: number | null
  ftp_change: number | null
  weight_start_kg: number | null
  weight_end_kg: number | null
  weight_change_kg: number | null
  w_per_kg_change: number | null
  avg_sleep_hours: number | null
  avg_hrv: number | null
  avg_stress: number | null
  limiting_factors: string[]
  best_training_type: string | null
  sick_days_total: number | null
  injury_days_total: number | null
  phase: TrainingPhase | null
  month_rating: WeekRating | null
  highlights: string[]
  challenges: string[]
  lucy_summary: string | null
  athlete_reflection: string | null
  goals_next_month: string | null
  generated_at: string | null
  created_at: string
}

// ============================================
// LAYER 5: CALENDAR & PLANNING
// ============================================

export interface Event {
  id: string
  athlete_id: string
  name: string
  date: string
  event_type: EventType | null
  priority: EventPriority | null
  distance_km: number | null
  elevation_m: number | null
  expected_duration_hours: number | null
  goal_time: string | null
  goal_power: number | null
  goal_description: string | null
  course_profile: CourseProfile | null
  notes: string | null
  result_time: string | null
  result_power: number | null
  result_notes: string | null
  tcx_file_id: string | null
  created_at: string
}

export interface PlannedWorkout {
  id: string
  athlete_id: string
  scheduled_date: string
  scheduled_time: string | null
  workout_type: WorkoutType | null
  title: string
  description: string | null
  duration_planned_minutes: number | null
  tss_planned: number | null
  intensity_target: string | null
  structure: WorkoutStructure[] | null
  notes: string | null
  completed: boolean
  skipped_reason: string | null
  actual_tcx_file_id: string | null
  compliance_score: number | null
  created_at: string
}

export interface LifeEvent {
  id: string
  athlete_id: string
  date: string
  end_date: string | null
  event_type: LifeEventType | null
  title: string
  training_impact: TrainingImpact | null
  available_hours: number | null
  notes: string | null
  created_at: string
}

export interface Travel {
  id: string
  athlete_id: string
  trip_name: string
  purpose: TravelPurpose | null
  departure_date: string
  return_date: string
  total_days: number | null
  destination_city: string | null
  destination_country: string | null
  destination_lat: number | null
  destination_lng: number | null
  destination_elevation_m: number | null
  destination_timezone: string | null
  flights: Flight[]
  total_flight_hours: number | null
  timezone_change_hours: number | null
  accommodation_type: AccommodationType | null
  accommodation_name: string | null
  accommodation_address: string | null
  check_in: string | null
  check_out: string | null
  booking_ref: string | null
  ground_transport: GroundTransport[]
  bike_transport: string | null
  event_id: string | null
  registration_confirmed: boolean | null
  race_number: string | null
  start_time: string | null
  travel_checklist: string[]
  documents_needed: string[]
  bike_box_booked: boolean | null
  travel_insurance: boolean | null
  total_cost_estimate: number | null
  currency: string
  costs_breakdown: CostsBreakdown | null
  notes: string | null
  lucy_travel_tips: string | null
  booked_via: string | null
  booking_data: Record<string, unknown> | null
  created_at: string
}

// ============================================
// LAYER 6: INTELLIGENCE
// ============================================

export interface AthleteInsight {
  id: string
  athlete_id: string
  insight_type: string
  category: string | null
  title: string
  description: string
  confidence: number | null
  evidence: Record<string, unknown> | null
  actionable: boolean
  action_suggested: string | null
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

export interface TrainingFocus {
  id: string
  athlete_id: string
  start_date: string
  end_date: string | null
  focus_area: string
  priority: number | null
  rationale: string | null
  target_metrics: Record<string, unknown> | null
  progress_notes: string | null
  achieved: boolean
  created_at: string
}

// ============================================
// LAYER 7: EQUIPMENT & FINANCE
// ============================================

export interface Equipment {
  id: string
  athlete_id: string
  equipment_type: string
  name: string
  brand: string | null
  model: string | null
  purchase_date: string | null
  purchase_price: number | null
  currency: string
  bike_type: BikeType | null
  frame_size: string | null
  frame_material: FrameMaterial | null
  groupset: string | null
  wheelset: string | null
  weight_kg: number | null
  service_interval_km: number | null
  last_service_date: string | null
  last_service_km: number | null
  total_km: number
  total_hours: number
  status: EquipmentStatus
  condition: EquipmentCondition | null
  notes: string | null
  photo_url: string | null
  created_at: string
}

export interface EquipmentUsage {
  id: string
  equipment_id: string
  tcx_file_id: string
  date: string
  distance_km: number | null
  duration_hours: number | null
  elevation_m: number | null
  created_at: string
}

export interface Expense {
  id: string
  athlete_id: string
  date: string
  category: ExpenseCategory
  subcategory: string | null
  description: string
  amount: number
  currency: string
  vendor: string | null
  receipt_url: string | null
  event_id: string | null
  travel_id: string | null
  equipment_id: string | null
  notes: string | null
  created_at: string
}

// ============================================
// DATABASE TYPE (Supabase convention)
// ============================================

export interface Database {
  public: {
    Tables: {
      athlete_profile: {
        Row: AthleteProfile
        Insert: Partial<AthleteProfile> & { name: string }
        Update: Partial<AthleteProfile>
      }
      athlete_connections: {
        Row: AthleteConnection
        Insert: Partial<AthleteConnection> & { athlete_id: string; provider: string }
        Update: Partial<AthleteConnection>
      }
      signature_metrics: {
        Row: SignatureMetrics
        Insert: Partial<SignatureMetrics> & { athlete_id: string }
        Update: Partial<SignatureMetrics>
      }
      power_duration_curve: {
        Row: PowerDurationCurve
        Insert: Partial<PowerDurationCurve> & { athlete_id: string; duration_seconds: number; power_watts: number }
        Update: Partial<PowerDurationCurve>
      }
      seven_axis_profile: {
        Row: SevenAxisProfile
        Insert: Partial<SevenAxisProfile> & { athlete_id: string }
        Update: Partial<SevenAxisProfile>
      }
      metabolic_profile: {
        Row: MetabolicProfile
        Insert: Partial<MetabolicProfile> & { athlete_id: string }
        Update: Partial<MetabolicProfile>
      }
      durability_metrics: {
        Row: DurabilityMetrics
        Insert: Partial<DurabilityMetrics> & { athlete_id: string }
        Update: Partial<DurabilityMetrics>
      }
      tcx_files: {
        Row: TcxFile
        Insert: Partial<TcxFile> & { athlete_id: string; filename: string; file_path: string; activity_date: string }
        Update: Partial<TcxFile>
      }
      training_load: {
        Row: TrainingLoad
        Insert: Partial<TrainingLoad> & { athlete_id: string; date: string }
        Update: Partial<TrainingLoad>
      }
      daily_log: {
        Row: DailyLog
        Insert: Partial<DailyLog> & { athlete_id: string; date: string }
        Update: Partial<DailyLog>
      }
      daily_sleep: {
        Row: DailySleep
        Insert: Partial<DailySleep> & { athlete_id: string; date: string }
        Update: Partial<DailySleep>
      }
      daily_nutrition: {
        Row: DailyNutrition
        Insert: Partial<DailyNutrition> & { athlete_id: string; date: string }
        Update: Partial<DailyNutrition>
      }
      daily_meals: {
        Row: DailyMeal
        Insert: Partial<DailyMeal> & { athlete_id: string; date: string }
        Update: Partial<DailyMeal>
      }
      daily_foods: {
        Row: DailyFood
        Insert: Partial<DailyFood> & { athlete_id: string; food_name: string }
        Update: Partial<DailyFood>
      }
      daily_wellness: {
        Row: DailyWellness
        Insert: Partial<DailyWellness> & { athlete_id: string; date: string }
        Update: Partial<DailyWellness>
      }
      daily_biometrics: {
        Row: DailyBiometrics
        Insert: Partial<DailyBiometrics> & { athlete_id: string; date: string }
        Update: Partial<DailyBiometrics>
      }
      daily_weather: {
        Row: DailyWeather
        Insert: Partial<DailyWeather> & { athlete_id: string; date: string }
        Update: Partial<DailyWeather>
      }
      daily_location: {
        Row: DailyLocation
        Insert: Partial<DailyLocation> & { athlete_id: string; date: string }
        Update: Partial<DailyLocation>
      }
      daily_medical: {
        Row: DailyMedical
        Insert: Partial<DailyMedical> & { athlete_id: string; date: string }
        Update: Partial<DailyMedical>
      }
      weekly_summary: {
        Row: WeeklySummary
        Insert: Partial<WeeklySummary> & { athlete_id: string; week_start: string; week_end: string }
        Update: Partial<WeeklySummary>
      }
      monthly_summary: {
        Row: MonthlySummary
        Insert: Partial<MonthlySummary> & { athlete_id: string; month: string }
        Update: Partial<MonthlySummary>
      }
      events: {
        Row: Event
        Insert: Partial<Event> & { athlete_id: string; name: string; date: string }
        Update: Partial<Event>
      }
      planned_workouts: {
        Row: PlannedWorkout
        Insert: Partial<PlannedWorkout> & { athlete_id: string; scheduled_date: string; title: string }
        Update: Partial<PlannedWorkout>
      }
      life_events: {
        Row: LifeEvent
        Insert: Partial<LifeEvent> & { athlete_id: string; date: string; title: string }
        Update: Partial<LifeEvent>
      }
      travel: {
        Row: Travel
        Insert: Partial<Travel> & { athlete_id: string; trip_name: string; departure_date: string; return_date: string }
        Update: Partial<Travel>
      }
      athlete_insights: {
        Row: AthleteInsight
        Insert: Partial<AthleteInsight> & { athlete_id: string; insight_type: string; title: string; description: string }
        Update: Partial<AthleteInsight>
      }
      training_focus: {
        Row: TrainingFocus
        Insert: Partial<TrainingFocus> & { athlete_id: string; start_date: string; focus_area: string }
        Update: Partial<TrainingFocus>
      }
      equipment: {
        Row: Equipment
        Insert: Partial<Equipment> & { athlete_id: string; equipment_type: string; name: string }
        Update: Partial<Equipment>
      }
      equipment_usage: {
        Row: EquipmentUsage
        Insert: Partial<EquipmentUsage> & { equipment_id: string; tcx_file_id: string; date: string }
        Update: Partial<EquipmentUsage>
      }
      expenses: {
        Row: Expense
        Insert: Partial<Expense> & { athlete_id: string; date: string; category: ExpenseCategory; description: string; amount: number }
        Update: Partial<Expense>
      }
    }
  }
}

// ============================================
// HELPER TYPES
// ============================================

// Default athlete ID for single-user MVP
export const DEFAULT_ATHLETE_ID = '00000000-0000-0000-0000-000000000001'

// Type helpers for Supabase queries
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
export type Insert<T extends TableName> = Tables[T]['Insert']
export type Update<T extends TableName> = Tables[T]['Update']
