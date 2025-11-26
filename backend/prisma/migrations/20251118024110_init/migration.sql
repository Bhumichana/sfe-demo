-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SR', 'SUP', 'SM', 'PM', 'MM');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CallActivityType" AS ENUM ('VIRTUAL', 'FACE_TO_FACE');

-- CreateEnum
CREATE TYPE "CallReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('PRODUCT', 'POP_POSM', 'CUSTOMER', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PRE_CALL_PLAN', 'MEETING', 'TRAINING', 'LEAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PLAN_APPROVED', 'PLAN_REJECTED', 'PLAN_PENDING', 'REMINDER', 'COACHING', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "settings" JSONB,
    "storage_used_mb" INTEGER NOT NULL DEFAULT 0,
    "storage_limit_mb" INTEGER NOT NULL DEFAULT 102400,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "manager_id" TEXT,
    "company_id" TEXT NOT NULL,
    "territory_id" TEXT,
    "google_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "provinces" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "monthly_revenue" DECIMAL(12,2),
    "address" TEXT,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "district" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "territory_id" TEXT,
    "required_visits_per_month" INTEGER,
    "response_time_hours" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "sap_customer_code" TEXT,
    "sap_sync_status" TEXT,
    "sap_last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "line_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_call_plans" (
    "id" TEXT NOT NULL,
    "sr_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "plan_date" DATE NOT NULL,
    "objectives" TEXT,
    "planned_activities" JSONB,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "comments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_call_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_reports" (
    "id" TEXT NOT NULL,
    "pre_call_plan_id" TEXT,
    "sr_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "call_date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_in_lat" DECIMAL(10,8),
    "check_in_lng" DECIMAL(11,8),
    "check_out_time" TIMESTAMP(3),
    "check_out_lat" DECIMAL(10,8),
    "check_out_lng" DECIMAL(11,8),
    "call_activity_type" "CallActivityType",
    "activities_done" JSONB,
    "customer_response" TEXT,
    "customer_request" TEXT,
    "customer_objections" TEXT,
    "customer_needs" TEXT,
    "customer_complaints" TEXT,
    "next_action" TEXT,
    "status" "CallReportStatus" NOT NULL DEFAULT 'DRAFT',
    "is_planned" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "call_report_id" TEXT NOT NULL,
    "category" "PhotoCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "size_bytes" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_th" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "category" TEXT,
    "requires_photo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_records" (
    "id" TEXT NOT NULL,
    "call_report_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "rating" INTEGER,
    "coaching_points" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "reference_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sap_sync_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "sap_response" JSONB,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sap_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_territory_id_idx" ON "users"("territory_id");

-- CreateIndex
CREATE INDEX "users_manager_id_idx" ON "users"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "territories_code_key" ON "territories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_sap_customer_code_key" ON "customers"("sap_customer_code");

-- CreateIndex
CREATE INDEX "customers_territory_id_idx" ON "customers"("territory_id");

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "customers"("type");

-- CreateIndex
CREATE INDEX "customers_created_by_idx" ON "customers"("created_by");

-- CreateIndex
CREATE INDEX "contacts_customer_id_idx" ON "contacts"("customer_id");

-- CreateIndex
CREATE INDEX "pre_call_plans_sr_id_idx" ON "pre_call_plans"("sr_id");

-- CreateIndex
CREATE INDEX "pre_call_plans_customer_id_idx" ON "pre_call_plans"("customer_id");

-- CreateIndex
CREATE INDEX "pre_call_plans_plan_date_idx" ON "pre_call_plans"("plan_date");

-- CreateIndex
CREATE INDEX "pre_call_plans_status_idx" ON "pre_call_plans"("status");

-- CreateIndex
CREATE INDEX "call_reports_sr_id_idx" ON "call_reports"("sr_id");

-- CreateIndex
CREATE INDEX "call_reports_customer_id_idx" ON "call_reports"("customer_id");

-- CreateIndex
CREATE INDEX "call_reports_call_date_idx" ON "call_reports"("call_date");

-- CreateIndex
CREATE INDEX "call_reports_status_idx" ON "call_reports"("status");

-- CreateIndex
CREATE INDEX "photos_call_report_id_idx" ON "photos"("call_report_id");

-- CreateIndex
CREATE INDEX "photos_category_idx" ON "photos"("category");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_code_key" ON "activity_types"("code");

-- CreateIndex
CREATE INDEX "coaching_records_call_report_id_idx" ON "coaching_records"("call_report_id");

-- CreateIndex
CREATE INDEX "coaching_records_manager_id_idx" ON "coaching_records"("manager_id");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_start_date_idx" ON "calendar_events"("start_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "sap_sync_logs_entity_type_entity_id_idx" ON "sap_sync_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "sap_sync_logs_status_idx" ON "sap_sync_logs"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_call_plans" ADD CONSTRAINT "pre_call_plans_sr_id_fkey" FOREIGN KEY ("sr_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_call_plans" ADD CONSTRAINT "pre_call_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_call_plans" ADD CONSTRAINT "pre_call_plans_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_call_plans" ADD CONSTRAINT "pre_call_plans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_reports" ADD CONSTRAINT "call_reports_pre_call_plan_id_fkey" FOREIGN KEY ("pre_call_plan_id") REFERENCES "pre_call_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_reports" ADD CONSTRAINT "call_reports_sr_id_fkey" FOREIGN KEY ("sr_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_reports" ADD CONSTRAINT "call_reports_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_reports" ADD CONSTRAINT "call_reports_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_call_report_id_fkey" FOREIGN KEY ("call_report_id") REFERENCES "call_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_records" ADD CONSTRAINT "coaching_records_call_report_id_fkey" FOREIGN KEY ("call_report_id") REFERENCES "call_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_records" ADD CONSTRAINT "coaching_records_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
