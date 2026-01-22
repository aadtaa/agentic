// Lucy AI Coach - Data Collector
// Queries Supabase for athlete data

import { createClient } from '@supabase/supabase-js'

const ATHLETE_ID = '00000000-0000-0000-0000-000000000001'

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Date range helpers
function getDateRange(rangeType) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDate = (d) => d.toISOString().split('T')[0]

  switch (rangeType) {
    case 'today':
      return { startDate: formatDate(today), endDate: formatDate(today) }

    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) }
    }

    case 'last_7_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { startDate: formatDate(start), endDate: formatDate(today) }
    }

    case 'last_30_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      return { startDate: formatDate(start), endDate: formatDate(today) }
    }

    case 'this_week': {
      const start = new Date(today)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      return { startDate: formatDate(start), endDate: formatDate(today) }
    }

    case 'last_week': {
      const end = new Date(today)
      const day = end.getDay()
      const diff = end.getDate() - day + (day === 0 ? -6 : 1) - 1
      end.setDate(diff)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      return { startDate: formatDate(start), endDate: formatDate(end) }
    }

    default:
      return { startDate: formatDate(new Date(today.setDate(today.getDate() - 6))), endDate: formatDate(new Date()) }
  }
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Query functions

async function getAthleteProfile(supabase) {
  const { data, error } = await supabase
    .from('athlete_profile')
    .select('name, preferred_name, weight_kg, height_cm, date_of_birth, sex, competitive_level, rider_type, rider_type_confidence, primary_sport, home_location, training_start_date')
    .eq('id', ATHLETE_ID)
    .single()

  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'No athlete profile found' }

  const homeLocation = typeof data.home_location === 'string'
    ? JSON.parse(data.home_location)
    : data.home_location

  return {
    success: true,
    data: {
      name: data.preferred_name || data.name,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      age: calculateAge(data.date_of_birth),
      sex: data.sex,
      competitive_level: data.competitive_level,
      rider_type: data.rider_type,
      rider_type_confidence: data.rider_type_confidence,
      location: homeLocation?.city,
      years_training: data.training_start_date
        ? new Date().getFullYear() - new Date(data.training_start_date).getFullYear()
        : null
    },
    metadata: { query_type: 'profile' }
  }
}

async function getPowerMetrics(supabase) {
  // Get latest signature metrics
  const { data: sig, error: sigError } = await supabase
    .from('signature_metrics')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (sigError && sigError.code !== 'PGRST116') {
    return { success: false, error: sigError.message }
  }

  // Get power duration curve
  const { data: pdc } = await supabase
    .from('power_duration_curve')
    .select('duration_seconds, power_watts, w_per_kg, physiological_parameter')
    .eq('athlete_id', ATHLETE_ID)
    .order('duration_seconds', { ascending: true })

  // Get 7-axis profile
  const { data: axis } = await supabase
    .from('seven_axis_profile')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  // Identify strengths and weaknesses from 7-axis
  let strengths = []
  let weaknesses = []
  if (axis) {
    const axes = [
      { name: 'Neuromuscular', value: axis.neuromuscular_p },
      { name: 'W\'', value: axis.w_prime_p },
      { name: 'Glycolytic', value: axis.glycolytic_p },
      { name: 'VO2max', value: axis.vo2max_p },
      { name: 'Threshold', value: axis.threshold_p },
      { name: 'Endurance', value: axis.endurance_p },
      { name: 'Durability', value: axis.durability_p }
    ].filter(a => a.value !== null)

    strengths = axes.filter(a => a.value >= 75).map(a => `${a.name} (${a.value}th percentile)`)
    weaknesses = axes.filter(a => a.value <= 50).map(a => `${a.name} (${a.value}th percentile)`)
  }

  // Format key power curve points
  const keyDurations = [5, 60, 300, 1200, 3600]
  const powerCurveHighlights = pdc
    ?.filter(p => keyDurations.includes(p.duration_seconds))
    .map(p => ({
      duration: p.duration_seconds === 5 ? '5s' :
                p.duration_seconds === 60 ? '1min' :
                p.duration_seconds === 300 ? '5min' :
                p.duration_seconds === 1200 ? '20min' :
                p.duration_seconds === 3600 ? '1hr' : `${p.duration_seconds}s`,
      watts: p.power_watts,
      w_per_kg: p.w_per_kg
    }))

  return {
    success: true,
    data: {
      ftp: sig ? { watts: sig.ftp_watts, w_per_kg: sig.ftp_w_per_kg } : null,
      critical_power: sig ? { watts: sig.critical_power_watts, w_per_kg: sig.critical_power_w_per_kg } : null,
      w_prime_kj: sig?.w_prime_kj,
      pmax: sig ? { watts: sig.pmax_watts, w_per_kg: sig.pmax_w_per_kg } : null,
      map: sig ? { watts: sig.map_watts, w_per_kg: sig.map_w_per_kg } : null,
      max_hr: sig?.max_hr,
      resting_hr: sig?.resting_hr,
      lthr: sig?.lthr,
      power_curve_highlights: powerCurveHighlights,
      strengths: strengths.length > 0 ? strengths : null,
      weaknesses: weaknesses.length > 0 ? weaknesses : null,
      last_tested: sig?.recorded_at
    },
    metadata: { query_type: 'power_metrics' }
  }
}

async function getTrainingLoad(supabase, dateRange) {
  const { startDate, endDate } = getDateRange(dateRange)

  const { data, error } = await supabase
    .from('training_load')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: `No training load data found for ${dateRange.replace(/_/g, ' ')}` }
  }

  const latest = data[0]
  const totalTss = data.reduce((sum, d) => sum + (d.tss_total || 0), 0)
  const avgTss = totalTss / data.length

  // Determine form status
  let formStatus = 'unknown'
  if (latest.tsb !== null) {
    if (latest.tsb >= 15) formStatus = 'very fresh (race ready)'
    else if (latest.tsb >= 5) formStatus = 'fresh (good for hard efforts)'
    else if (latest.tsb >= -10) formStatus = 'neutral (balanced)'
    else if (latest.tsb >= -25) formStatus = 'tired (building fitness)'
    else formStatus = 'very fatigued (need recovery)'
  }

  return {
    success: true,
    data: {
      current_ctl: latest.ctl,
      current_atl: latest.atl,
      current_tsb: latest.tsb,
      form_status: formStatus,
      ramp_rate: latest.ramp_rate,
      total_tss_period: Math.round(totalTss),
      avg_daily_tss: Math.round(avgTss),
      training_days: data.filter(d => d.tss_total > 0).length,
      rest_days: data.filter(d => d.tss_total === 0).length
    },
    metadata: {
      query_type: 'training_load',
      date_range: dateRange,
      records_found: data.length
    }
  }
}

async function getSleepSummary(supabase, dateRange) {
  const { startDate, endDate } = getDateRange(dateRange)

  const { data, error } = await supabase
    .from('daily_sleep')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: `No sleep data found for ${dateRange.replace(/_/g, ' ')}`, suggestion: 'Sleep data may need to be synced from your wearable device' }
  }

  const avgSleepMins = data.reduce((sum, d) => sum + (d.total_sleep_minutes || 0), 0) / data.length
  const avgScore = data.filter(d => d.sleep_score).reduce((sum, d) => sum + d.sleep_score, 0) / data.filter(d => d.sleep_score).length
  const avgHrv = data.filter(d => d.hrv_avg).reduce((sum, d) => sum + d.hrv_avg, 0) / data.filter(d => d.hrv_avg).length

  const nightsUnder7h = data.filter(d => d.total_sleep_minutes && d.total_sleep_minutes < 420).length

  // Find best and worst nights
  const withScores = data.filter(d => d.sleep_score)
  const bestNight = withScores.reduce((best, d) => (d.sleep_score > (best?.sleep_score || 0)) ? d : best, null)
  const worstNight = withScores.reduce((worst, d) => (d.sleep_score < (worst?.sleep_score || 100)) ? d : worst, null)

  return {
    success: true,
    data: {
      avg_sleep_hours: (avgSleepMins / 60).toFixed(1),
      avg_sleep_score: Math.round(avgScore) || null,
      avg_hrv: Math.round(avgHrv) || null,
      nights_under_7h: nightsUnder7h,
      best_night: bestNight ? { date: bestNight.date, score: bestNight.sleep_score, hours: (bestNight.total_sleep_minutes / 60).toFixed(1) } : null,
      worst_night: worstNight ? { date: worstNight.date, score: worstNight.sleep_score, hours: (worstNight.total_sleep_minutes / 60).toFixed(1) } : null,
      last_night: data[0] ? {
        date: data[0].date,
        hours: data[0].total_sleep_minutes ? (data[0].total_sleep_minutes / 60).toFixed(1) : null,
        score: data[0].sleep_score,
        hrv: data[0].hrv_avg
      } : null
    },
    metadata: {
      query_type: 'sleep_summary',
      date_range: dateRange,
      records_found: data.length
    }
  }
}

async function getWellnessSummary(supabase, dateRange) {
  const { startDate, endDate } = getDateRange(dateRange)

  // Get daily wellness
  const { data: wellness, error: wellnessError } = await supabase
    .from('daily_wellness')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  // Get daily log for readiness scores
  const { data: logs, error: logsError } = await supabase
    .from('daily_log')
    .select('date, readiness_score, energy_score, motivation_score, mood_score, stress_score')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (wellnessError && logsError) {
    return { success: false, error: 'Failed to fetch wellness data' }
  }

  const data = wellness || []
  const logData = logs || []

  if (data.length === 0 && logData.length === 0) {
    return { success: false, error: `No wellness data found for ${dateRange.replace(/_/g, ' ')}` }
  }

  // Calculate averages from wellness
  const avgEnergy = data.filter(d => d.energy_level).reduce((sum, d) => sum + d.energy_level, 0) / (data.filter(d => d.energy_level).length || 1)
  const avgStress = data.filter(d => d.stress_level).reduce((sum, d) => sum + d.stress_level, 0) / (data.filter(d => d.stress_level).length || 1)
  const avgMood = data.filter(d => d.mood_score).reduce((sum, d) => sum + d.mood_score, 0) / (data.filter(d => d.mood_score).length || 1)
  const avgSoreness = data.filter(d => d.muscle_soreness).reduce((sum, d) => sum + d.muscle_soreness, 0) / (data.filter(d => d.muscle_soreness).length || 1)

  // Get readiness from logs
  const avgReadiness = logData.filter(d => d.readiness_score).reduce((sum, d) => sum + d.readiness_score, 0) / (logData.filter(d => d.readiness_score).length || 1)

  // Today's status
  const today = data[0]
  const todayLog = logData[0]

  return {
    success: true,
    data: {
      current_readiness: todayLog?.readiness_score || null,
      current_energy: today?.energy_level || todayLog?.energy_score || null,
      current_stress: today?.stress_level || todayLog?.stress_score || null,
      current_mood: today?.mood_score || todayLog?.mood_score || null,
      current_soreness: today?.muscle_soreness || null,
      legs_feeling: today?.legs_feeling || null,
      avg_readiness: Math.round(avgReadiness) || null,
      avg_energy: avgEnergy.toFixed(1),
      avg_stress: avgStress.toFixed(1),
      avg_mood: avgMood.toFixed(1),
      avg_soreness: avgSoreness.toFixed(1),
      high_stress_days: data.filter(d => d.stress_level >= 7).length,
      low_energy_days: data.filter(d => d.energy_level <= 4).length
    },
    metadata: {
      query_type: 'wellness_summary',
      date_range: dateRange,
      records_found: Math.max(data.length, logData.length)
    }
  }
}

async function getWeeklySummary(supabase, dateRange) {
  // Determine which week to fetch
  const today = new Date()
  let weekStart

  if (dateRange === 'last_week') {
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7
    weekStart = new Date(today.setDate(diff))
  } else {
    // this_week or default
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    weekStart = new Date(today)
    weekStart.setDate(diff)
  }

  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('weekly_summary')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .eq('week_start', weekStartStr)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: `No weekly summary found for ${dateRange.replace(/_/g, ' ')}`, suggestion: 'Weekly summaries are generated at the end of each week' }
  }

  return {
    success: true,
    data: {
      week_start: data.week_start,
      week_end: data.week_end,
      total_tss: data.total_tss,
      total_hours: data.total_hours,
      total_distance_km: data.total_distance_km,
      total_elevation_m: data.total_elevation_m,
      activities_count: data.activities_count,
      training_days: data.training_days,
      rest_days: data.rest_days,
      intensity_distribution: data.intensity_distribution,
      compliance_pct: data.compliance_pct,
      ctl_end: data.ctl_end,
      atl_end: data.atl_end,
      tsb_end: data.tsb_end,
      avg_sleep_hours: data.avg_sleep_hours,
      avg_hrv: data.avg_hrv,
      avg_energy: data.avg_energy,
      avg_stress: data.avg_stress,
      week_rating: data.week_rating,
      biggest_win: data.biggest_win,
      biggest_challenge: data.biggest_challenge,
      lucy_summary: data.lucy_summary
    },
    metadata: {
      query_type: 'weekly_summary',
      date_range: dateRange
    }
  }
}

async function getUpcomingEvents(supabase) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(5)

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: 'No upcoming events found', suggestion: 'Add your target races and events to get personalized training recommendations' }
  }

  const events = data.map(e => ({
    name: e.name,
    date: e.date,
    days_until: Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)),
    priority: e.priority,
    event_type: e.event_type,
    distance_km: e.distance_km,
    elevation_m: e.elevation_m,
    goal_time: e.goal_time,
    goal_power: e.goal_power,
    goal_description: e.goal_description,
    course_profile: e.course_profile
  }))

  const nextAEvent = events.find(e => e.priority === 'A')

  return {
    success: true,
    data: {
      total_upcoming: events.length,
      next_event: events[0],
      next_a_race: nextAEvent || null,
      all_events: events
    },
    metadata: {
      query_type: 'upcoming_events',
      events_found: events.length
    }
  }
}

async function getNutritionSummary(supabase, dateRange) {
  const { startDate, endDate } = getDateRange(dateRange)

  const { data, error } = await supabase
    .from('daily_nutrition')
    .select('*')
    .eq('athlete_id', ATHLETE_ID)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) return { success: false, error: error.message }
  if (!data || data.length === 0) {
    return { success: false, error: `No nutrition data found for ${dateRange.replace(/_/g, ' ')}`, suggestion: 'Nutrition data can be synced from MyFitnessPal or entered manually' }
  }

  const avgCalories = data.reduce((sum, d) => sum + (d.calories_total || 0), 0) / data.length
  const avgProtein = data.reduce((sum, d) => sum + (d.protein_g || 0), 0) / data.length
  const avgCarbs = data.reduce((sum, d) => sum + (d.carbs_g || 0), 0) / data.length
  const avgFat = data.reduce((sum, d) => sum + (d.fat_g || 0), 0) / data.length
  const avgWater = data.reduce((sum, d) => sum + (d.water_liters || 0), 0) / data.length

  // Check targets
  const latestWithTarget = data.find(d => d.calories_target)
  const calorieCompliance = latestWithTarget
    ? Math.round((avgCalories / latestWithTarget.calories_target) * 100)
    : null

  const proteinCompliance = latestWithTarget?.protein_target_g
    ? Math.round((avgProtein / latestWithTarget.protein_target_g) * 100)
    : null

  return {
    success: true,
    data: {
      avg_calories: Math.round(avgCalories),
      avg_protein_g: Math.round(avgProtein),
      avg_carbs_g: Math.round(avgCarbs),
      avg_fat_g: Math.round(avgFat),
      avg_water_liters: avgWater.toFixed(1),
      calorie_target: latestWithTarget?.calories_target,
      protein_target_g: latestWithTarget?.protein_target_g,
      calorie_compliance_pct: calorieCompliance,
      protein_compliance_pct: proteinCompliance,
      yesterday: data[0] ? {
        date: data[0].date,
        calories: data[0].calories_total,
        protein_g: data[0].protein_g,
        carbs_g: data[0].carbs_g,
        fat_g: data[0].fat_g,
        water_liters: data[0].water_liters,
        nutrition_score: data[0].nutrition_score
      } : null
    },
    metadata: {
      query_type: 'nutrition_summary',
      date_range: dateRange,
      records_found: data.length
    }
  }
}

// Main dispatcher
export async function queryAthleteData(queryType, dateRange = null) {
  try {
    const supabase = getSupabaseClient()

    switch (queryType) {
      case 'profile':
        return await getAthleteProfile(supabase)

      case 'power_metrics':
        return await getPowerMetrics(supabase)

      case 'training_load':
        return await getTrainingLoad(supabase, dateRange || 'last_7_days')

      case 'sleep_summary':
        return await getSleepSummary(supabase, dateRange || 'last_7_days')

      case 'wellness_summary':
        return await getWellnessSummary(supabase, dateRange || 'last_7_days')

      case 'weekly_summary':
        return await getWeeklySummary(supabase, dateRange || 'this_week')

      case 'upcoming_events':
        return await getUpcomingEvents(supabase)

      case 'nutrition_summary':
        return await getNutritionSummary(supabase, dateRange || 'last_7_days')

      default:
        return { success: false, error: `Unknown query type: ${queryType}` }
    }
  } catch (error) {
    console.error('Data collector error:', error)
    return { success: false, error: error.message || 'Failed to query data' }
  }
}
