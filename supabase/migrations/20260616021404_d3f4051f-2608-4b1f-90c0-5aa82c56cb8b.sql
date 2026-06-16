
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS section text;

-- Backfill name from first_name + last_name where empty
UPDATE public.teachers
SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE name IS NULL OR name = '';
