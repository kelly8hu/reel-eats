-- 002_fix_recipes_columns.sql
-- Add missing columns and rename source_url → instagram_url

alter table recipes
  add column if not exists instagram_url    text,
  add column if not exists servings         integer,
  add column if not exists prep_time_minutes integer,
  add column if not exists cook_time_minutes integer;

-- Migrate existing data if any rows exist
update recipes set instagram_url = source_url where instagram_url is null;

-- Drop old column
alter table recipes drop column if exists source_url;

-- Change health_notes from text to jsonb array
alter table recipes alter column health_notes type jsonb using
  case
    when health_notes is null then '[]'::jsonb
    else to_jsonb(array[health_notes])
  end;
