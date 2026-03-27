-- ============================================================
-- ACTIVITY TIMESERIES — Second-by-second ride data
--
-- This is the missing layer: tcx_files stores metadata,
-- but the actual point data was parsed client-side and discarded.
-- Now we persist it for cross-activity queries.
--
-- Two approaches depending on your Supabase plan:
--   A) TimescaleDB (if extension available) — hypertable + continuous aggs
--   B) Plain Postgres with proper indexes — works everywhere
--
-- We implement B first (guaranteed to work), with A as an upgrade path.
-- ============================================================

-- ── RAW POINTS TABLE ─────────────────────────────────────────
-- One row per second per activity. ~14,400 rows for a 4hr ride.

CREATE TABLE IF NOT EXISTS activity_points (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  activity_id UUID NOT NULL REFERENCES tcx_files(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  elapsed_seconds REAL NOT NULL,          -- seconds from ride start
  timestamp TIMESTAMPTZ,                   -- absolute wall-clock time
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  altitude REAL,                           -- meters
  heart_rate SMALLINT,
  cadence SMALLINT,
  power SMALLINT,                          -- watts
  speed REAL,                              -- m/s
  distance_meters REAL,                    -- cumulative from start
  temperature REAL,                        -- celsius
  gradient REAL,                           -- % (computed on insert)
  PRIMARY KEY (activity_id, elapsed_seconds)
);

-- ── INDEXES for common query patterns ────────────────────────

-- "All points for this activity, time-ordered" (the primary key covers this)
-- Already: PRIMARY KEY (activity_id, elapsed_seconds)

-- "All points where power > X" across activities
CREATE INDEX IF NOT EXISTS idx_activity_points_power
  ON activity_points (athlete_id, power)
  WHERE power IS NOT NULL AND power > 0;

-- "All points on climbs" (gradient-based queries)
CREATE INDEX IF NOT EXISTS idx_activity_points_gradient
  ON activity_points (athlete_id, gradient)
  WHERE gradient IS NOT NULL AND gradient > 0;

-- "Points in a time range for an activity"
CREATE INDEX IF NOT EXISTS idx_activity_points_time
  ON activity_points (activity_id, elapsed_seconds);

-- "Cross-activity: all points with altitude" (for climb analysis)
CREATE INDEX IF NOT EXISTS idx_activity_points_altitude
  ON activity_points (athlete_id, altitude)
  WHERE altitude IS NOT NULL;

-- ── PRECOMPUTED SEGMENTS TABLE ───────────────────────────────
-- Like continuous aggregates: pre-bucketed data at useful resolutions.
-- Computed on upload, queried instantly for dashboards / cross-ride analysis.

CREATE TABLE IF NOT EXISTS activity_segments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES tcx_files(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  segment_type TEXT NOT NULL,              -- '60s', '300s', '1km', 'climb', 'interval'
  segment_index INTEGER NOT NULL,          -- order within activity
  start_seconds REAL NOT NULL,
  end_seconds REAL NOT NULL,
  start_distance REAL,
  end_distance REAL,
  duration_seconds REAL NOT NULL,
  distance_meters REAL,
  -- Power aggregates
  avg_power SMALLINT,
  max_power SMALLINT,
  normalized_power SMALLINT,
  -- HR aggregates
  avg_hr SMALLINT,
  max_hr SMALLINT,
  -- Cadence
  avg_cadence SMALLINT,
  -- Speed
  avg_speed REAL,                          -- km/h
  max_speed REAL,
  -- Elevation
  elevation_gain REAL,
  elevation_loss REAL,
  avg_gradient REAL,
  max_gradient REAL,
  start_altitude REAL,
  end_altitude REAL,
  -- Climb-specific (segment_type = 'climb')
  climb_category TEXT,                     -- 'HC', 'Cat 1', etc.
  vam REAL,                                -- vertical ascent meters/hour
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, segment_type, segment_index)
);

-- Cross-activity segment queries
CREATE INDEX IF NOT EXISTS idx_segments_athlete_type
  ON activity_segments (athlete_id, segment_type);

-- "Best 5min power across all rides"
CREATE INDEX IF NOT EXISTS idx_segments_power
  ON activity_segments (athlete_id, segment_type, normalized_power DESC)
  WHERE normalized_power IS NOT NULL;

-- "All climbs over 5% gradient"
CREATE INDEX IF NOT EXISTS idx_segments_gradient
  ON activity_segments (athlete_id, avg_gradient)
  WHERE segment_type = 'climb' AND avg_gradient IS NOT NULL;

-- "Best efforts on climbs"
CREATE INDEX IF NOT EXISTS idx_segments_climb_power
  ON activity_segments (athlete_id, avg_gradient, normalized_power DESC)
  WHERE segment_type = 'climb';

-- ── BEST EFFORTS TABLE ───────────────────────────────────────
-- Pre-extracted: best power over standard durations per activity.
-- Enables instant "best 5min power ever" without scanning all points.

CREATE TABLE IF NOT EXISTS activity_best_efforts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES tcx_files(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athlete_profile(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,       -- 1, 5, 15, 30, 60, 120, 300, 600, 1200, 3600
  watts SMALLINT NOT NULL,
  watts_per_kg REAL,
  start_seconds REAL,                      -- where in the ride this effort started
  end_seconds REAL,
  -- Context: what was happening during this effort
  avg_hr SMALLINT,
  avg_cadence SMALLINT,
  avg_gradient REAL,                       -- were they climbing?
  avg_altitude REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, duration_seconds)
);

-- "Best 5min power ever" — single index scan
CREATE INDEX IF NOT EXISTS idx_best_efforts_duration_watts
  ON activity_best_efforts (athlete_id, duration_seconds, watts DESC);

-- "Best efforts on climbs"
CREATE INDEX IF NOT EXISTS idx_best_efforts_gradient
  ON activity_best_efforts (athlete_id, duration_seconds, avg_gradient, watts DESC)
  WHERE avg_gradient IS NOT NULL;


-- ── RLS POLICIES ─────────────────────────────────────────────

ALTER TABLE activity_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_best_efforts ENABLE ROW LEVEL SECURITY;

-- For MVP: allow all access (same pattern as existing schema)
CREATE POLICY "Allow all activity_points" ON activity_points FOR ALL USING (true);
CREATE POLICY "Allow all activity_segments" ON activity_segments FOR ALL USING (true);
CREATE POLICY "Allow all activity_best_efforts" ON activity_best_efforts FOR ALL USING (true);


-- ── EXAMPLE QUERIES THIS ENABLES ─────────────────────────────
--
-- 1. Best 5-minute power on climbs over 5% gradient:
--
--    SELECT be.watts, be.avg_gradient, tf.title, tf.activity_date
--    FROM activity_best_efforts be
--    JOIN tcx_files tf ON tf.id = be.activity_id
--    WHERE be.athlete_id = $1
--      AND be.duration_seconds = 300
--      AND be.avg_gradient >= 5.0
--    ORDER BY be.watts DESC
--    LIMIT 10;
--
-- 2. All climbs ranked by VAM:
--
--    SELECT s.*, tf.title, tf.activity_date
--    FROM activity_segments s
--    JOIN tcx_files tf ON tf.id = s.activity_id
--    WHERE s.athlete_id = $1
--      AND s.segment_type = 'climb'
--    ORDER BY s.vam DESC;
--
-- 3. Power trend: average NP per ride over last 90 days:
--
--    SELECT tf.activity_date, tf.normalized_power, tf.tss
--    FROM tcx_files tf
--    WHERE tf.athlete_id = $1
--      AND tf.activity_date >= CURRENT_DATE - 90
--    ORDER BY tf.activity_date;
--
-- 4. "Time at threshold on climbs" — how much climbing did I do above FTP?
--
--    SELECT SUM(ap.elapsed_seconds) as seconds_above_ftp
--    FROM activity_points ap
--    WHERE ap.athlete_id = $1
--      AND ap.gradient >= 5.0
--      AND ap.power >= 250  -- FTP
--
-- 5. Average power by gradient bucket (how do I respond to steepness?):
--
--    SELECT
--      FLOOR(gradient / 2) * 2 as gradient_bucket,
--      AVG(power) as avg_power,
--      COUNT(*) as seconds
--    FROM activity_points
--    WHERE athlete_id = $1 AND gradient IS NOT NULL AND power > 0
--    GROUP BY 1
--    ORDER BY 1;
--
-- ── TIMESCALEDB UPGRADE PATH ─────────────────────────────────
-- If TimescaleDB extension is available on your Supabase plan:
--
--   CREATE EXTENSION IF NOT EXISTS timescaledb;
--
--   -- Convert activity_points to a hypertable (partitioned by time)
--   SELECT create_hypertable('activity_points', 'timestamp',
--     chunk_time_interval => INTERVAL '7 days',
--     if_not_exists => TRUE);
--
--   -- Continuous aggregate: 1-minute power/HR averages
--   CREATE MATERIALIZED VIEW activity_1min
--   WITH (timescaledb.continuous) AS
--   SELECT
--     activity_id,
--     time_bucket('1 minute', timestamp) AS bucket,
--     avg(power) AS avg_power,
--     max(power) AS max_power,
--     avg(heart_rate) AS avg_hr,
--     avg(cadence) AS avg_cadence,
--     avg(speed) AS avg_speed
--   FROM activity_points
--   GROUP BY activity_id, bucket;
--
-- This would make timeBucket() queries instant at any resolution.
