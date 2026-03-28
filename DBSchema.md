// --- USER & AUTHENTICATION ---
Table user {
  id bigint [primary key, increment]
  email text [unique, not null]
  password_hash text [note: "NULL if login via Google"]
  name text
  picture_path text
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone" [note: "Soft Delete"]
}

Table google_account {
  google_user_id text [primary key, note: "Subject ID"]
  user_id bigint [ref: > user.id, not null]
  access_token text
  refresh_token text
  expired_at "timestamp with time zone"
  created_at "timestamp with time zone" [default: `now()`]
}

Table member {
  user_id bigint [primary key, ref: > user.id]
  class_id bigint [primary key, ref: > classroom.id]
  role text
  join_at "timestamp with time zone" [default: `now()`]
}

// --- CLASSROOM MANAGEMENT ---
Table classroom {
  id bigint [primary key, increment]
  owner_id bigint [ref: > user.id, not null]
  topic text [not null]
  description text
  status bigint [default: 0, note: "0='Public', 1='Private', 2='Archived'"]
  code text
  favorite bigint [default: 0]
  banner_id bigint
  google_course_id text
  google_course_link text
  google_synced_at text
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table google_course_sync_log {
  id bigint [primary key, increment]
  class_id bigint [ref: > classroom.id, not null]
  action text [default: 'create']
  response jsonb
  status text
  create_at "timestamp with time zone"
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table invitation {
  id bigint [primary key, increment]
  class_id bigint [ref: > classroom.id, not null]
  invited_email text [not null]
  invited_user_id bigint [ref: > user.id, note: "NULL if not yet registered"]
  google_invitation_id text
  token text
  status text [default: 'pending']
  updated_at "timestamp with time zone" [default: `now()`]
  created_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table bookmark {
  user_id bigint [primary key, ref: > user.id, not null]
  class_id bigint [primary key, ref: > classroom.id, not null]
}

Table recent_view_class {
  id bigint [primary key, increment]
  user_id bigint [ref: > user.id, not null]
  class_id bigint [ref: > classroom.id, not null]
  last_viewed_at "timestamp with time zone" [not null]
}

// --- ASSIGNMENT & TESTS ---
Table assignment {
  id bigint [primary key, increment]
  class_id bigint [ref: > classroom.id]
  title text [not null]
  description text
  due_date "timestamp with time zone"
  max_attempt bigint [default: 0, note: "0 = Unlimited"]
  setting jsonb [note: "Grading Policy & Protection"]
  condition jsonb [note: "Constraints"]
  grade bigint [default: 1, note: "Full Score"]
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table test_suite {
  id bigint [primary key, increment]
  assignment_id bigint [ref: > assignment.id, not null]
  name text
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table test_case {
  id bigint [primary key, increment]
  test_suite_id bigint [ref: > test_suite.id, not null]
  name text
  init jsonb [not null]
  assert jsonb [not null]
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

// --- PLAYGROUND & SUBMISSION ---
Table playground {
  id bigint [primary key, increment]
  assignment_id bigint [ref: > assignment.id, not null]
  user_id bigint [ref: > user.id, not null]
  item jsonb [not null]
  status text [default: 'in_progress']
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Table submission {
  id bigint [primary key, increment]
  user_id bigint [ref: > user.id]
  assignment_id bigint [ref: > assignment.id]
  playground_id bigint [ref: > playground.id]
  attempt_number bigint
  item_snapshot jsonb
  client_result jsonb
  server_result jsonb
  score numeric
  feed_back text
  status text
  is_verified boolean
  duration_ms bigint
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

// --- NOTIFICATIONS ---
Table notification {
  id bigint [primary key, increment]
  user_id bigint [ref: > user.id, not null]
  type text [not null]
  title text [not null]
  message text [not null]
  data jsonb
  is_read boolean [default: false]
  created_at "timestamp with time zone" [default: `now()`]
  updated_at "timestamp with time zone" [default: `now()`]
  deleted_at "timestamp with time zone"
}

Ref: "recent_view_class"."last_viewed_at" < "recent_view_class"."id"