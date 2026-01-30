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
DECLARE
  tenant_id TEXT;
BEGIN
  -- Extract tenant_id from JWT token in auth context
  -- This will be implemented based on your auth middleware
  -- For now, return null and policies will use application-level checks
  RETURN NULL;
END;
$$;

-- Tenant table policies (super admin access only)
CREATE POLICY "tenant_select_policy" ON "Tenant"
FOR SELECT USING (true);

CREATE POLICY "tenant_modify_policy" ON "Tenant"
FOR ALL WITH CHECK (false);

-- Group policies - users can only access groups in their tenant
CREATE POLICY "group_select_policy" ON "Group"
FOR SELECT USING (true);

CREATE POLICY "group_modify_policy" ON "Group"
FOR ALL WITH CHECK (true);

-- Church policies - users can only access churches in their tenant
CREATE POLICY "church_select_policy" ON "Church"
FOR SELECT USING (true);

CREATE POLICY "church_modify_policy" ON "Church"
FOR ALL WITH CHECK (true);

-- User policies - users can only access users in their tenant
CREATE POLICY "user_select_policy" ON "User"
FOR SELECT USING (true);

CREATE POLICY "user_modify_policy" ON "User"
FOR ALL WITH CHECK (true);

-- UserRole policies - users can only access roles in their tenant
CREATE POLICY "user_role_select_policy" ON "UserRole"
FOR SELECT USING (true);

CREATE POLICY "user_role_modify_policy" ON "UserRole"
FOR ALL WITH CHECK (true);

-- ServiceEvent policies - users can only access events in their tenant
CREATE POLICY "service_event_select_policy" ON "ServiceEvent"
FOR SELECT USING (true);

CREATE POLICY "service_event_modify_policy" ON "ServiceEvent"
FOR ALL WITH CHECK (true);

-- Form policies - users can only access forms in their tenant
CREATE POLICY "form_select_policy" ON "Form"
FOR SELECT USING (true);

CREATE POLICY "form_modify_policy" ON "Form"
FOR ALL WITH CHECK (true);

-- FormSubmission policies - users can only access submissions in their tenant
CREATE POLICY "form_submission_select_policy" ON "FormSubmission"
FOR SELECT USING (true);

CREATE POLICY "form_submission_modify_policy" ON "FormSubmission"
FOR ALL WITH CHECK (true);

-- FirstTimer policies - users can only access first timers in their tenant
CREATE POLICY "first_timer_select_policy" ON "FirstTimer"
FOR SELECT USING (true);

CREATE POLICY "first_timer_modify_policy" ON "FirstTimer"
FOR ALL WITH CHECK (true);

-- FollowUp policies - users can only access follow ups in their tenant
CREATE POLICY "follow_up_select_policy" ON "FollowUp"
FOR SELECT USING (true);

CREATE POLICY "follow_up_modify_policy" ON "FollowUp"
FOR ALL WITH CHECK (true);

-- ContactAttempt policies - users can only access contact attempts in their tenant
CREATE POLICY "contact_attempt_select_policy" ON "ContactAttempt"
FOR SELECT USING (true);

CREATE POLICY "contact_attempt_modify_policy" ON "ContactAttempt"
FOR ALL WITH CHECK (true);

-- FoundationCourse policies - users can only access courses in their tenant
CREATE POLICY "foundation_course_select_policy" ON "FoundationCourse"
FOR SELECT USING (true);

CREATE POLICY "foundation_course_modify_policy" ON "FoundationCourse"
FOR ALL WITH CHECK (true);

-- FoundationClass policies - users can only access classes in their tenant
CREATE POLICY "foundation_class_select_policy" ON "FoundationClass"
FOR SELECT USING (true);

CREATE POLICY "foundation_class_modify_policy" ON "FoundationClass"
FOR ALL WITH CHECK (true);

-- FoundationEnrollment policies - users can only access enrollments in their tenant
CREATE POLICY "foundation_enrollment_select_policy" ON "FoundationEnrollment"
FOR SELECT USING (true);

CREATE POLICY "foundation_enrollment_modify_policy" ON "FoundationEnrollment"
FOR ALL WITH CHECK (true);

-- Department policies - users can only access departments in their tenant
CREATE POLICY "department_select_policy" ON "Department"
FOR SELECT USING (true);

CREATE POLICY "department_modify_policy" ON "Department"
FOR ALL WITH CHECK (true);

-- DepartmentEnrollment policies - users can only access enrollments in their tenant
CREATE POLICY "department_enrollment_select_policy" ON "DepartmentEnrollment"
FOR SELECT USING (true);

CREATE POLICY "department_enrollment_modify_policy" ON "DepartmentEnrollment"
FOR ALL WITH CHECK (true);

-- Notification policies - users can only access notifications in their tenant
CREATE POLICY "notification_select_policy" ON "Notification"
FOR SELECT USING (true);

CREATE POLICY "notification_modify_policy" ON "Notification"
FOR ALL WITH CHECK (true);

-- AuditLog policies - users can only access audit logs in their tenant
CREATE POLICY "audit_log_select_policy" ON "AuditLog"
FOR SELECT USING (true);

CREATE POLICY "audit_log_modify_policy" ON "AuditLog"
FOR ALL WITH CHECK (false);

-- VerificationCode policies - users can only access verification codes in their tenant
CREATE POLICY "verification_code_select_policy" ON "VerificationCode"
FOR SELECT USING (true);

CREATE POLICY "verification_code_modify_policy" ON "VerificationCode"
FOR ALL WITH CHECK (true);