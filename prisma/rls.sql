CREATE SCHEMA IF NOT EXISTS app;

-- Helper role assumptions:
-- - Application connects as role "app_user" with SET app.current_tenant to the tenant UUID.
-- - Admin operations use elevated role "migration_user" without RLS restrictions.

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_tenant', true)::uuid;
$$;

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_user', true)::uuid;
$$;

-- Enable RLS and default tenant policies for tenant scoped tables.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'Group', 'Church', 'User', 'UserRole', 'Form', 'FirstTimer', 'FollowUp', 'ContactAttempt',
    'FoundationCourse', 'FoundationClass', 'FoundationEnrollment', 'Department',
    'DepartmentEnrollment', 'Notification', 'AuditLog'
  ) LOOP
    EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY;', tbl);
    BEGIN
      EXECUTE format('CREATE POLICY tenant_isolation ON "%s" USING (tenantId = app.current_tenant_id());', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format('CREATE POLICY tenant_isolation_write ON "%s" FOR ALL USING (tenantId = app.current_tenant_id()) WITH CHECK (tenantId = app.current_tenant_id());', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Special cases for tables without tenantId (FormSubmission references form -> tenant).
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY form_submission_read ON "FormSubmission"
    USING (formId IN (SELECT id FROM "Form" WHERE tenantId = app.current_tenant_id()))
    WITH CHECK (formId IN (SELECT id FROM "Form" WHERE tenantId = app.current_tenant_id()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ServiceEvent" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  CREATE POLICY service_event_read ON "ServiceEvent"
    USING (churchId IN (SELECT id FROM "Church" WHERE tenantId = app.current_tenant_id()))
    WITH CHECK (churchId IN (SELECT id FROM "Church" WHERE tenantId = app.current_tenant_id()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
