/** DDL local SQLite — espelha o modelo Dexie / StoragePort. */

export const SQLITE_SCHEMA = `
PRAGMA journal_mode = MEMORY;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS sync_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 8,
  next_retry_at   INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  case_id         TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox (status);
CREATE INDEX IF NOT EXISTS idx_outbox_retry ON outbox (next_retry_at);

CREATE TABLE IF NOT EXISTS cases (
  id            TEXT PRIMARY KEY,
  plate         TEXT,
  chassis       TEXT,
  make          TEXT,
  model         TEXT,
  current_stage TEXT,
  snapshot_json TEXT,
  rev           INTEGER NOT NULL DEFAULT 1,
  updated_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  sync_status   TEXT NOT NULL DEFAULT 'local'
);
CREATE INDEX IF NOT EXISTS idx_cases_plate ON cases (plate);

CREATE TABLE IF NOT EXISTS photos (
  id             TEXT PRIMARY KEY,
  case_id        TEXT NOT NULL,
  stage          TEXT NOT NULL,
  slot_id        TEXT NOT NULL,
  data_url       TEXT,
  hash           TEXT,
  validation_ok  INTEGER NOT NULL DEFAULT 0,
  width          INTEGER,
  height         INTEGER,
  created_at     TEXT NOT NULL,
  uploaded       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_photos_case ON photos (case_id);

CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id               TEXT PRIMARY KEY,
  plate            TEXT,
  chassis          TEXT,
  make             TEXT,
  model            TEXT,
  last_odometer_km REAL,
  first_seen_at    TEXT NOT NULL,
  last_seen_at     TEXT NOT NULL,
  visit_count      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS diagnosis_events (
  id               TEXT PRIMARY KEY,
  vehicle_id       TEXT NOT NULL,
  plate            TEXT,
  chassis          TEXT,
  case_id          TEXT,
  at               TEXT NOT NULL,
  odometer_km      REAL,
  problem_name     TEXT,
  severity         TEXT,
  codes_json       TEXT,
  parts_json       TEXT,
  source           TEXT,
  notes            TEXT
);
CREATE INDEX IF NOT EXISTS idx_diag_vehicle ON diagnosis_events (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_diag_at ON diagnosis_events (at);

CREATE TABLE IF NOT EXISTS pid_baselines (
  id          TEXT PRIMARY KEY,
  vehicle_id  TEXT NOT NULL,
  pid_id      TEXT NOT NULL,
  pid_name    TEXT,
  unit        TEXT,
  samples     INTEGER NOT NULL DEFAULT 0,
  mean        REAL NOT NULL DEFAULT 0,
  min         REAL NOT NULL DEFAULT 0,
  max         REAL NOT NULL DEFAULT 0,
  m2          REAL NOT NULL DEFAULT 0,
  last_value  REAL NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pid_vehicle ON pid_baselines (vehicle_id);
`;
