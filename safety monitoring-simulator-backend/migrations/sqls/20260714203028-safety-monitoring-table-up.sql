CREATE TABLE IF NOT EXISTS "safety-monitoring-table" (
    "id" SERIAL PRIMARY KEY,
    "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vibrations" varchar(255) NOT NULL,
    "flameData" varchar(255) NOT NULL
);