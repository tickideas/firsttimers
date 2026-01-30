-- Enable RLS on all tenant-isolated tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Church" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FirstTimer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FollowUp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FoundationCourse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FoundationClass" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FoundationEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DepartmentEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationCode" ENABLE ROW LEVEL SECURITY;

-- Create function to get current user tenant_id from JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Extract tenant_id from JWT claims set by application
  RETURN current_setting('app.current_tenant_id', true);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Tenant table policies - users can only access their own tenant
CREATE POLICY "tenant_select_policy" ON "Tenant"
FOR SELECT USING (id = get_current_tenant_id());

CREATE POLICY "tenant_modify_policy" ON "Tenant"
FOR ALL WITH CHECK (id = get_current_tenant_id());

-- Group policies - users can only access groups in their tenant
CREATE POLICY "group_select_policy" ON "Group"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "group_modify_policy" ON "Group"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- Church policies - users can only access churches in their tenant
CREATE POLICY "church_select_policy" ON "Church"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "church_modify_policy" ON "Church"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- User policies - users can only access users in their tenant
CREATE POLICY "user_select_policy" ON "User"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "user_modify_policy" ON "User"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- UserRole policies - users can only access roles in their tenant
CREATE POLICY "user_role_select_policy" ON "UserRole"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" WHERE "User".id = "UserRole"."userId" AND "User"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "user_role_modify_policy" ON "UserRole"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" WHERE "User".id = "UserRole"."userId" AND "User"."tenantId" = get_current_tenant_id()
  )
);

-- ServiceEvent policies - users can only access events in their tenant
CREATE POLICY "service_event_select_policy" ON "ServiceEvent"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "service_event_modify_policy" ON "ServiceEvent"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- Form policies - users can only access forms in their tenant
CREATE POLICY "form_select_policy" ON "Form"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "form_modify_policy" ON "Form"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- FormSubmission policies - users can only access submissions in their tenant
CREATE POLICY "form_submission_select_policy" ON "FormSubmission"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Form" WHERE "Form".id = "FormSubmission"."formId" AND "Form"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "form_submission_modify_policy" ON "FormSubmission"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Form" WHERE "Form".id = "FormSubmission"."formId" AND "Form"."tenantId" = get_current_tenant_id()
  )
);

-- FirstTimer policies - users can only access first timers in their tenant
CREATE POLICY "first_timer_select_policy" ON "FirstTimer"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "first_timer_modify_policy" ON "FirstTimer"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- FollowUp policies - users can only access follow ups in their tenant
CREATE POLICY "follow_up_select_policy" ON "FollowUp"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "FollowUp"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "follow_up_modify_policy" ON "FollowUp"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "FollowUp"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

-- ContactAttempt policies - users can only access contact attempts in their tenant
CREATE POLICY "contact_attempt_select_policy" ON "ContactAttempt"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "FollowUp" 
    JOIN "FirstTimer" ON "FirstTimer".id = "FollowUp"."firstTimerId"
    WHERE "FollowUp".id = "ContactAttempt"."followUpId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "contact_attempt_modify_policy" ON "ContactAttempt"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "FollowUp" 
    JOIN "FirstTimer" ON "FirstTimer".id = "FollowUp"."firstTimerId"
    WHERE "FollowUp".id = "ContactAttempt"."followUpId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

-- FoundationCourse policies - users can only access courses in their tenant
CREATE POLICY "foundation_course_select_policy" ON "FoundationCourse"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "foundation_course_modify_policy" ON "FoundationCourse"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- FoundationClass policies - users can only access classes in their tenant
CREATE POLICY "foundation_class_select_policy" ON "FoundationClass"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "FoundationCourse" WHERE "FoundationCourse".id = "FoundationClass"."courseId" AND "FoundationCourse"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "foundation_class_modify_policy" ON "FoundationClass"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "FoundationCourse" WHERE "FoundationCourse".id = "FoundationClass"."courseId" AND "FoundationCourse"."tenantId" = get_current_tenant_id()
  )
);

-- FoundationEnrollment policies - users can only access enrollments in their tenant
CREATE POLICY "foundation_enrollment_select_policy" ON "FoundationEnrollment"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "FoundationEnrollment"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "foundation_enrollment_modify_policy" ON "FoundationEnrollment"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "FoundationEnrollment"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

-- Department policies - users can only access departments in their tenant
CREATE POLICY "department_select_policy" ON "Department"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "department_modify_policy" ON "Department"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- DepartmentEnrollment policies - users can only access enrollments in their tenant
CREATE POLICY "department_enrollment_select_policy" ON "DepartmentEnrollment"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "DepartmentEnrollment"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

CREATE POLICY "department_enrollment_modify_policy" ON "DepartmentEnrollment"
FOR ALL WITH CHECK (
  EXISTS (
    SELECT 1 FROM "FirstTimer" WHERE "FirstTimer".id = "DepartmentEnrollment"."firstTimerId" AND "FirstTimer"."tenantId" = get_current_tenant_id()
  )
);

-- Notification policies - users can only access notifications in their tenant
CREATE POLICY "notification_select_policy" ON "Notification"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "notification_modify_policy" ON "Notification"
FOR ALL WITH CHECK ("tenantId" = get_current_tenant_id());

-- AuditLog policies - users can only access audit logs in their tenant, read-only
CREATE POLICY "audit_log_select_policy" ON "AuditLog"
FOR SELECT USING ("tenantId" = get_current_tenant_id());

CREATE POLICY "audit_log_modify_policy" ON "AuditLog"
FOR ALL WITH CHECK (false);

-- VerificationCode policies - users can only access verification codes in their tenant
CREATE POLICY "verification_code_select_policy" ON "VerificationCode"
FOR SELECT USING (
  "tenantId" = get_current_tenant_id() OR 
  "tenantId" IS NULL  -- Allow for public form submissions before tenant is known
);

CREATE POLICY "verification_code_modify_policy" ON "VerificationCode"
FOR ALL WITH CHECK (
  "tenantId" = get_current_tenant_id() OR 
  "tenantId" IS NULL
);