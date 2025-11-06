-- Add activities_visibility and distance_unit to users (if not exists)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS activities_visibility text CHECK (activities_visibility IN ('public','private')) DEFAULT 'public';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS distance_unit text CHECK (distance_unit IN ('km','mi')) DEFAULT 'km';

-- Optional: master push enabled at user level (minimal solution)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_enabled boolean DEFAULT true;

