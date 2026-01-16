-- =============================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- =============================================

TABLE users {
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT, -- NULL if using Google Auth
  name            TEXT,
  tel             TEXT,
  picture_path    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ -- Soft Delete
}

TABLE google_accounts {
  google_user_id  TEXT PRIMARY KEY, -- Subject ID
  user_id         INT NOT NULL REFERENCES users(id),
  email           TEXT NOT NULL,
  access_token    TEXT,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
}

-- =============================================
-- 2. CLASSROOM MANAGEMENT
-- =============================================

TABLE classroom {
  id                SERIAL PRIMARY KEY,
  owner_id          INT NOT NULL REFERENCES users(id),
  topic             TEXT NOT NULL,
  description       TEXT,
  status            INT NOT NULL DEFAULT 0, -- 0=Public, 1=Private, 2=Archived
  google_course_id  TEXT, -- Reference for Google Classroom Sync
  google_course_link TEXT,
  google_synced_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
}

TABLE member {
  classroom_id  INT NOT NULL REFERENCES classroom(id),
  user_id       INT NOT NULL REFERENCES users(id),
  joined_at     TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (classroom_id, user_id)
}

TABLE invitations {
  id                    SERIAL PRIMARY KEY,
  class_id              INT NOT NULL REFERENCES classroom(id),
  invited_email         TEXT NOT NULL,
  invited_user_id       INT REFERENCES users(id), -- Nullable if user not registered yet
  google_invitation_id  TEXT,
  status                TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
  token                 TEXT,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
}

TABLE google_course_sync_log {
  id          SERIAL PRIMARY KEY,
  class_id    INT NOT NULL REFERENCES classroom(id),
  action      TEXT NOT NULL, -- 'create', 'update', 'delete'
  response    JSONB, -- Full API Response from Google
  status      TEXT NOT NULL, -- 'success', 'error'
  create_at   TIMESTAMPTZ NOT NULL DEFAULT now()
}

-- =============================================
-- 3. ASSIGNMENT & TESTING SYSTEM
-- =============================================

TABLE assignments {
  id            SERIAL PRIMARY KEY,
  class_id      INT REFERENCES classroom(id),
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      TIMESTAMPTZ,
  max_attempts  INT NOT NULL DEFAULT 0, -- 0 = Unlimited
  grade         INT NOT NULL DEFAULT 100,
  
  -- JSONB: Grading Policy
  -- Structure: { "grade_policy": { "weight": { "test_case": 70, "node_count": 30 } }, "fe_behavior": {...} }
  setting       JSONB, 

  -- JSONB: Constraints & Initial State
  -- Structure: { "allowed_instructions": {"MOV":1, "ADD":1}, "execution_constraints": {"max_nodes": 10}, "initial_state": {...} }
  condition     JSONB,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
}

TABLE test_suites {
  id             SERIAL PRIMARY KEY,
  assignment_id  INT NOT NULL REFERENCES assignments(id),
  name           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
}

TABLE test_case {
  id             SERIAL PRIMARY KEY,
  test_suite_id  INT NOT NULL REFERENCES test_suites(id),
  name           TEXT,
  
  -- JSONB: Initial Machine State
  -- Structure: { "registers": {"R0":0}, "memory": {}, "io_input": "..." }
  init           JSONB NOT NULL,

  -- JSONB: Expected State (Assertion)
  -- Structure: { "registers": {"R0":5}, "halted": true, "io_output": "..." }
  assert         JSONB NOT NULL,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
}

-- =============================================
-- 4. PLAYGROUND & SUBMISSION (CORE ENGINE)
-- =============================================

TABLE playgrounds {
  id             SERIAL PRIMARY KEY,
  assignment_id  INT NOT NULL REFERENCES assignments(id),
  user_id        INT NOT NULL REFERENCES users(id),
  
  -- JSONB: React Flow Graph Data
  -- Structure: { "nodes": [{ "id": "1", "data": { "opcode": "ADD" } }], "edges": [...] }
  item           JSONB NOT NULL,

  status         TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'submitted'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
}

TABLE submission {
  id              SERIAL PRIMARY KEY,
  submission_uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id         INT NOT NULL REFERENCES users(id),
  assignment_id   INT NOT NULL REFERENCES assignments(id),
  playground_id   INT REFERENCES playgrounds(id),
  attempt_number  INT,
  
  -- JSONB: Snapshot of the code/graph at submission time
  item_snapshot   JSONB, 

  -- JSONB: Result computed by Client (Browser)
  -- Structure: { "is_pass": true, "user_claimed_score": 100, "test_results": [...] }
  client_result   JSONB,

  -- JSONB: Result verified by Server
  -- Structure: { "is_pass": true, "verified_score": 100, "score_breakdown": {...} }
  server_result   JSONB,

  score           FLOAT,
  status          TEXT, -- 'submitted', 'verified', 'error'
  is_verified     BOOLEAN DEFAULT FALSE,
  duration_ms     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
}

-- =============================================
-- 5. USER ACTIVITY & NOTIFICATIONS
-- =============================================

TABLE bookmark {
  id        SERIAL PRIMARY KEY,
  user_id   INT NOT NULL REFERENCES users(id),
  class_id  INT NOT NULL REFERENCES classroom(id)
}

TABLE recent_view_class {
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id),
  class_id        INT NOT NULL REFERENCES classroom(id),
  last_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
}

TABLE notifications {
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL, -- 'submission_graded', 'assignment_due', 'class_invite'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  
  -- JSONB: Metadata for action/redirect
  -- Structure: { "submission_uuid": "...", "assignment_id": 101, "score": 85 }
  data        JSONB,

  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
}