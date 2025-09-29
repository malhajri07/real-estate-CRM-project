DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_available_extensions WHERE name = 'postgis') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS postgis';
  ELSE
    RAISE NOTICE 'PostGIS extension not available, skipping creation.';
  END IF;
END
$$;
