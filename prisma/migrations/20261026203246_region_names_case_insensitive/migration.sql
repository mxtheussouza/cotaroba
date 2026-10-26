-- Region names are normalized by the application. Prevent case-only duplicates
-- at the database boundary as well, including concurrent manager submissions.
CREATE UNIQUE INDEX "Region_name_case_insensitive_key" ON "Region" (lower("name"));
