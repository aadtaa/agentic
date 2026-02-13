// Lucy Data Agent — Schema Map
// Semantic description of all data domains for the Data Planner LLM
// The Planner sees THIS, not raw SQL schemas

export const SCHEMA_MAP = {
  domains: {
    athlete_profile: {
      description: "Athlete identity, physical stats, current performance metrics (FTP, weight, zones), preferences, coach info",
      key_fields: ["ftp_watts", "ftp_wkg", "weight_kg", "threshold_hr", "max_hr", "w_prime", "rider_type", "power_zones", "hr_zones"],
      functions: ["get_athlete_profile"],
      changes: "rarely — updated on FTP tests, weight changes"
    },

    daily_wellness: {
      description: "Daily self-reported state: readiness, energy, motivation, stress, mood, soreness, legs feeling. Also objective biometrics from wearable: resting HR, HRV, recovery score, weight. And sleep: duration, stages, quality score, efficiency.",
      key_fields: ["readiness_score", "energy_level", "motivation", "stress_level", "mood", "resting_hr", "hrv_rmssd", "recovery_score", "sleep_score", "total_sleep_minutes"],
      functions: ["get_daily_wellness"],
      changes: "daily"
    },

    training_load: {
      description: "Performance Management Chart: CTL (fitness), ATL (fatigue), TSB (form/freshness), ramp rate. Daily granularity, computed from activities.",
      key_fields: ["ctl", "atl", "tsb", "ramp_rate", "daily_tss", "daily_if"],
      functions: ["get_training_load"],
      changes: "daily, after each activity"
    },

    activities: {
      description: "Individual rides/workouts: power, HR, cadence, speed, distance, elevation, TSS, IF, NP, zones, duration. Linked to equipment and calendar events.",
      key_fields: ["normalized_power", "tss", "intensity_factor", "distance_m", "elevation_gain_m", "duration_seconds", "avg_power", "avg_hr", "activity_type"],
      functions: ["get_recent_activities", "get_activity_detail"],
      changes: "per ride, several times per week"
    },

    activity_streams: {
      description: "Second-by-second time series for a single activity: power, HR, cadence, GPS, altitude, speed. Heavy data — only load when needed for detailed analysis.",
      key_fields: ["power_watts[]", "heart_rate_bpm[]", "altitudes_m[]", "latitudes[]", "longitudes[]"],
      functions: ["get_activity_streams"],
      changes: "immutable after processing",
      note: "EXPENSIVE — only request when question requires time-series analysis, segment comparison, or custom visualization"
    },

    calendar: {
      description: "Unified calendar: races (with priority A/B/C, goals, results), training events, life events (work, family, medical) with training_impact. Includes location, course files.",
      key_fields: ["event_type", "date", "priority", "goal_time", "result_time", "training_impact", "available_hours"],
      functions: ["get_calendar"],
      changes: "as events are added/updated"
    },

    nutrition: {
      description: "Daily macro tracking: calories, protein, carbs, fat. Workout fueling: pre/during/post calories and carbs, carbs per hour during ride.",
      key_fields: ["calories_total", "protein_g", "carbs_g", "during_workout_carbs_g", "post_workout_protein_g"],
      functions: ["get_nutrition"],
      changes: "daily"
    },

    power_profile: {
      description: "Power duration curve (best efforts at 1s to 3hr), seven-axis radar (neuromuscular, W', glycolytic, VO2max, threshold, endurance, durability), percentile rankings vs population.",
      key_fields: ["power_watts at duration_seconds", "axis scores", "percentiles"],
      functions: ["get_power_profile"],
      changes: "updated when new bests are set"
    },

    performance_history: {
      description: "Historical FTP tests, CP tests, weight changes over time. Tracks test type, previous value, change percentage.",
      key_fields: ["metric_type", "value", "tested_at", "change_pct"],
      functions: ["get_signature_history"],
      changes: "on FTP tests, ~monthly"
    },

    metabolic: {
      description: "Lab/field metabolic testing: fractional utilization, VLamax, fat max power, carb dependency, crossover point. May have multiple test dates.",
      key_fields: ["fractional_utilization", "vlamax", "fat_max_watts", "carb_dependency"],
      functions: ["get_metabolic_profile"],
      changes: "quarterly retesting"
    },

    durability: {
      description: "Power retention over long efforts: % power maintained, HR:power decoupling, efficiency factor change.",
      key_fields: ["power_retention_pct", "decoupling_pct", "duration_hours"],
      functions: ["get_durability_metrics"],
      changes: "computed after long rides"
    },

    equipment: {
      description: "Bikes, trainers, power meters, shoes: usage km/hours, service tracking, primary status.",
      key_fields: ["name", "equipment_type", "total_distance_km", "total_hours", "next_service_km"],
      functions: ["get_equipment"],
      changes: "updated per ride"
    },

    training_focus: {
      description: "Current training priorities with targets, progress, status. Ranked by priority. Includes key workouts, weekly volume targets.",
      key_fields: ["name", "priority", "target_metrics", "current_metrics", "status"],
      functions: ["get_training_focus"],
      changes: "updated by coach/Lucy"
    },

    training_summaries: {
      description: "Weekly and monthly aggregates: total TSS, hours, distance, elevation, compliance %, wellness averages, CTL/ATL/TSB snapshots, training phase, athlete reflections.",
      key_fields: ["total_tss", "total_hours", "compliance_pct", "avg_readiness", "training_phase", "rating"],
      functions: ["get_training_summaries"],
      changes: "weekly/monthly"
    },

    athlete_knowledge: {
      description: "Cross-conversation memory: tendencies, injuries, psychological patterns, preferences, key decisions, history, coach observations. Persistent across all conversations.",
      key_fields: ["category", "key", "value", "confidence"],
      functions: ["get_athlete_knowledge"],
      changes: "extracted after conversations"
    },

    insights: {
      description: "Lucy-generated insights: strengths, weaknesses, patterns, recommendations, risks. With confidence level and priority.",
      key_fields: ["category", "title", "detail", "priority", "confidence"],
      functions: ["get_insights"],
      changes: "regenerated periodically"
    }
  }
}

// Condensed function registry for the LLM (descriptions + params only, no code)
export const FUNCTION_REGISTRY_CONDENSED = [
  {
    id: "get_athlete_profile",
    description: "Core athlete profile with current metrics, zones, preferences. Fast, always useful for context.",
    params: {}
  },
  {
    id: "get_daily_wellness",
    description: "Daily biometrics (resting HR, HRV, weight), sleep (duration, stages, score), and self-reported logs (readiness, energy, mood, stress, soreness) for a date range.",
    params: {
      days: "number, default 7 — how many days back",
      date: "string (YYYY-MM-DD), optional — specific date instead of range"
    }
  },
  {
    id: "get_training_load",
    description: "PMC data: CTL (fitness), ATL (fatigue), TSB (form/freshness), ramp rate over date range. Includes 7-day deltas.",
    params: {
      days: "number, default 30 — how many days of history"
    }
  },
  {
    id: "get_recent_activities",
    description: "List of recent activities with summaries (power, HR, distance, TSS, etc). No time-series streams. Linked to equipment and calendar events.",
    params: {
      days: "number, default 14 — how many days back",
      limit: "number, default 10 — max activities to return",
      activity_type: "string, optional — filter by type (ride, run, etc.)"
    }
  },
  {
    id: "get_activity_detail",
    description: "Full single activity details including all metrics. Does NOT include streams — use get_activity_streams for second-by-second data.",
    params: {
      activity_id: "string — Activity UUID (required if no date given)",
      date: "string (YYYY-MM-DD), optional — find activity by date",
      name_contains: "string, optional — partial name match (used with date)"
    }
  },
  {
    id: "get_activity_streams",
    description: "Second-by-second time series for a single activity: power, HR, cadence, GPS, altitude. EXPENSIVE — only use when detailed time-series analysis is truly needed.",
    params: {
      activity_id: "string, required — Activity UUID"
    }
  },
  {
    id: "get_calendar",
    description: "Calendar events: races (with A/B/C priority), training events, life events. Filterable by type and date range.",
    params: {
      days_ahead: "number, default 30 — days into future",
      days_back: "number, default 0 — days into past",
      event_type: "string, optional — filter: race, sportive, work, family, medical, etc.",
      priority: "string, optional — filter: A, B, C"
    }
  },
  {
    id: "get_nutrition",
    description: "Daily nutrition data: macros (calories, protein, carbs, fat), workout fueling, hydration, targets and compliance.",
    params: {
      days: "number, default 7 — how many days back"
    }
  },
  {
    id: "get_power_profile",
    description: "Power duration curve (best efforts at key durations) and seven-axis performance profile (neuromuscular, W', glycolytic, VO2max, threshold, endurance, durability) with percentile scores.",
    params: {
      period: "string, default 'all_time' — options: all_time, 365d, 90d, 28d"
    }
  },
  {
    id: "get_signature_history",
    description: "Historical FTP, CP, W', weight, VO2max tests and changes over time.",
    params: {
      metric_type: "string, optional — ftp, cp, w_prime, weight, vo2max",
      limit: "number, default 20 — max entries"
    }
  },
  {
    id: "get_metabolic_profile",
    description: "Metabolic testing results: VLamax, fat oxidation, fractional utilization, carb dependency, metabolic type.",
    params: {}
  },
  {
    id: "get_durability_metrics",
    description: "Power retention and fatigue resistance on long efforts: power fade, HR:power decoupling, durability rating.",
    params: {
      limit: "number, default 10 — max entries"
    }
  },
  {
    id: "get_equipment",
    description: "Bikes, trainers, power meters, shoes with usage km/hours, service tracking, condition.",
    params: {
      equipment_type: "string, optional — road_bike, trainer, etc.",
      active_only: "boolean, default true — only active equipment"
    }
  },
  {
    id: "get_training_focus",
    description: "Current training priorities with targets, progress, and status. Ranked by priority.",
    params: {
      active_only: "boolean, default true"
    }
  },
  {
    id: "get_training_summaries",
    description: "Weekly or monthly training aggregates: total TSS, hours, distance, compliance, wellness averages, training phase.",
    params: {
      period_type: "string, default 'week' — week or month",
      limit: "number, default 8 — how many periods back"
    }
  },
  {
    id: "get_athlete_knowledge",
    description: "Cross-conversation memory: tendencies, injuries, psychological patterns, preferences, key decisions, coach observations.",
    params: {
      category: "string, optional — tendency, injury, psychological_pattern, preference, key_decision, history, coach_observation"
    }
  },
  {
    id: "get_insights",
    description: "Lucy-generated insights: strengths, weaknesses, patterns, recommendations, risks with confidence and priority.",
    params: {
      category: "string, optional — strength, weakness, pattern, recommendation, risk, opportunity",
      active_only: "boolean, default true"
    }
  },
  {
    id: "get_expenses",
    description: "Expense tracking: equipment, race entries, nutrition, travel costs. Linked to equipment and events.",
    params: {
      days: "number, default 90 — how many days back",
      category: "string, optional — equipment, race_entry, travel, nutrition, coaching, etc."
    }
  },
  {
    id: "get_travel_logistics",
    description: "Travel plans for races: flights, accommodation, bike transport, checklists.",
    params: {
      event_id: "string, optional — specific calendar event"
    }
  }
]

// Format the schema map for LLM injection
export function formatSchemaMapForPrompt() {
  let output = ''
  for (const [domain, info] of Object.entries(SCHEMA_MAP.domains)) {
    output += `### ${domain}\n`
    output += `${info.description}\n`
    output += `Key fields: ${info.key_fields.join(', ')}\n`
    output += `Functions: ${info.functions.join(', ')}\n`
    output += `Changes: ${info.changes}\n`
    if (info.note) output += `Note: ${info.note}\n`
    output += '\n'
  }
  return output
}

// Format the function registry for LLM injection
export function formatFunctionRegistryForPrompt() {
  return FUNCTION_REGISTRY_CONDENSED.map(fn => {
    const params = Object.keys(fn.params).length > 0
      ? Object.entries(fn.params).map(([k, v]) => `  - ${k}: ${v}`).join('\n')
      : '  (no parameters)'
    return `**${fn.id}**\n${fn.description}\nParams:\n${params}`
  }).join('\n\n')
}
