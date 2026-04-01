CREATE TABLE IF NOT EXISTS "processed_events" (
  "event_id" text PRIMARY KEY NOT NULL,
  "processed_at" timestamp NOT NULL DEFAULT now()
);
