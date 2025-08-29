/*
  Warnings:

  - You are about to drop the column `userId` on the `password_reset_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `operator_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payer_name` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `branch` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,branch_code]` on the table `expenditure_heads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,branch_code]` on the table `revenue_heads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `expenditure_heads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `revenue_heads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency_code` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch_code` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AgeCategory" AS ENUM ('ADULT', 'YOUTH', 'CHILD', 'ELDERLY');

-- CreateEnum
CREATE TYPE "public"."PaymentPattern" AS ENUM ('RECURRING', 'FREQUENT', 'OCCASIONAL', 'ONE_TIME', 'SEASONAL', 'PLEDGE_BASED');

-- CreateEnum
CREATE TYPE "public"."PaymentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'BI_MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('CONTRIBUTION_DUE', 'OVERDUE_PAYMENT', 'UPCOMING_PAYMENT', 'PLEDGE_REMINDER', 'BALANCE_LOW');

-- CreateEnum
CREATE TYPE "public"."NotificationMethod" AS ENUM ('EMAIL', 'SMS', 'PHONE_CALL', 'IN_PERSON', 'PUSH_NOTIFICATION');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BalanceType" AS ENUM ('CREDIT', 'DEBIT', 'PLEDGE', 'PREPAID');

-- CreateEnum
CREATE TYPE "public"."AdjustmentType" AS ENUM ('REFUND', 'CREDIT', 'DEBIT', 'TRANSFER', 'CORRECTION', 'WRITE_OFF');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."UpdateType" AS ENUM ('PROGRESS', 'MILESTONE', 'ISSUE', 'GENERAL', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'IMAGE', 'VIDEO', 'AUDIO', 'ARCHIVE', 'CODE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('GENERAL', 'CONTRACTS', 'PERMITS', 'ARCHITECTURAL_PLANS', 'BUDGET_DOCUMENTS', 'PROGRESS_REPORTS', 'MEETING_MINUTES', 'CORRESPONDENCE', 'TECHNICAL_SPECS', 'PHOTOS', 'VIDEOS', 'AUDIO_RECORDINGS', 'PRESENTATIONS', 'MARKETING_MATERIALS');

-- CreateEnum
CREATE TYPE "public"."RateSource" AS ENUM ('MANUAL', 'BANK_API', 'CENTRAL_BANK', 'FOREX_API', 'CRYPTO_API', 'INTERNAL_CALC');

-- CreateEnum
CREATE TYPE "public"."ContributionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExpenditureCategory" AS ENUM ('OPERATIONAL', 'PROJECT', 'CAPITAL', 'MAINTENANCE', 'UTILITIES', 'PERSONNEL', 'MINISTRY', 'OUTREACH', 'EMERGENCY', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "public"."ExpenseFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'IRREGULAR');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."ExpenseUrgency" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."ReceiptType" AS ENUM ('INVOICE', 'RECEIPT', 'VOUCHER', 'BANK_STATEMENT', 'CONTRACT', 'QUOTE', 'PURCHASE_ORDER', 'DELIVERY_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED', 'UNDER_REVIEW', 'PROBATION');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SupplierType" AS ENUM ('VENDOR', 'CONTRACTOR', 'SERVICE_PROVIDER', 'CONSULTANT', 'UTILITY_COMPANY', 'GOVERNMENT_AGENCY');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PENDING_SIGNATURE', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('SERVICE', 'SUPPLY', 'CONSTRUCTION', 'MAINTENANCE', 'CONSULTING', 'LEASE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AssetCategory" AS ENUM ('FURNITURE', 'EQUIPMENT', 'ELECTRONICS', 'VEHICLES', 'PROPERTY', 'INSTRUMENTS', 'SOFTWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'UPGRADE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "public"."BudgetType" AS ENUM ('ANNUAL', 'QUARTERLY', 'MONTHLY', 'PROJECT_BASED', 'EVENT_BASED');

-- CreateEnum
CREATE TYPE "public"."BudgetStatus" AS ENUM ('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED', 'REVISED');

-- DropForeignKey
ALTER TABLE "public"."password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- AlterTable
ALTER TABLE "public"."branches" ADD COLUMN     "address" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."expenditure_heads" ADD COLUMN     "approval_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "budget_limit" DECIMAL(120,2),
ADD COLUMN     "category" "public"."ExpenditureCategory" NOT NULL DEFAULT 'OPERATIONAL',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."password_reset_tokens" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."refresh_tokens" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."revenue_heads" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "currency",
DROP COLUMN "operator_name",
DROP COLUMN "payer_name",
DROP COLUMN "payment_method",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency_code" TEXT NOT NULL,
ADD COLUMN     "member_id" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payment_method_id" INTEGER NOT NULL,
ADD COLUMN     "reference_number" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(120,2);

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "branch",
DROP COLUMN "role",
ADD COLUMN     "branch_code" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login" TIMESTAMPTZ(6),
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "role_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."members" (
    "id" SERIAL NOT NULL,
    "member_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "age_category" "public"."AgeCategory" NOT NULL DEFAULT 'ADULT',
    "phone_number" TEXT,
    "email" TEXT,
    "address" TEXT,
    "branch_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contribution_plans" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "revenue_head_code" TEXT,
    "plan_name" TEXT NOT NULL,
    "payment_pattern" "public"."PaymentPattern" NOT NULL,
    "frequency" "public"."PaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "next_payment_date" TIMESTAMP(3),
    "reminder_days" INTEGER NOT NULL DEFAULT 7,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribution_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_reminders" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "contribution_plan_id" INTEGER,
    "reminder_type" "public"."ReminderType" NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "message" TEXT,
    "sent_at" TIMESTAMP(3),
    "method" "public"."NotificationMethod" NOT NULL DEFAULT 'EMAIL',
    "status" "public"."ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_balances" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "balance_type" "public"."BalanceType" NOT NULL,
    "balance" DECIMAL(120,2) NOT NULL,
    "credit_limit" DECIMAL(120,2),
    "currency_code" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."balance_adjustments" (
    "id" SERIAL NOT NULL,
    "member_balance_id" INTEGER NOT NULL,
    "adjustment_type" "public"."AdjustmentType" NOT NULL,
    "amount" DECIMAL(120,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "reference_number" TEXT,
    "processed_by" INTEGER NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "balance_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_pattern_history" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "previous_pattern" "public"."PaymentPattern" NOT NULL,
    "new_pattern" "public"."PaymentPattern" NOT NULL,
    "analysis_date" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reason_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pattern_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "actual_start_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "priority" "public"."ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_milestones" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "budget_allocation" DECIMAL(120,2),
    "actual_cost" DECIMAL(120,2),
    "status" "public"."MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dependencies" JSONB,
    "deliverables" TEXT,
    "completion_criteria" TEXT,
    "notes" TEXT,
    "completed_by" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_tasks" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "milestone_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" INTEGER,
    "due_date" TIMESTAMP(3),
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimated_hours" INTEGER,
    "actual_hours" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_updates" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "update_type" "public"."UpdateType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_documents" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_type" "public"."DocumentType" NOT NULL,
    "category" "public"."DocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "tags" TEXT[],
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "thumbnail_path" TEXT,
    "duration" INTEGER,
    "dimensions" TEXT,
    "checksum" TEXT,
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3),
    "version_number" INTEGER NOT NULL DEFAULT 1,
    "parent_doc_id" INTEGER,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_base_currency" BOOLEAN NOT NULL DEFAULT false,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."exchange_rates" (
    "id" SERIAL NOT NULL,
    "base_currency_code" TEXT NOT NULL,
    "target_currency_code" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "inverse_rate" DECIMAL(20,10),
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "source" "public"."RateSource" NOT NULL DEFAULT 'MANUAL',
    "source_reference" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currency_conversion_history" (
    "id" SERIAL NOT NULL,
    "exchange_rate_id" INTEGER NOT NULL,
    "original_amount" DECIMAL(120,2) NOT NULL,
    "original_currency_code" TEXT NOT NULL,
    "converted_amount" DECIMAL(120,2) NOT NULL,
    "converted_currency_code" TEXT NOT NULL,
    "conversion_rate" DECIMAL(20,10) NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "converted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "converted_by" INTEGER NOT NULL,

    CONSTRAINT "currency_conversion_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exchange_rate_history" (
    "id" SERIAL NOT NULL,
    "base_currency_code" TEXT NOT NULL,
    "target_currency_code" TEXT NOT NULL,
    "rate" DECIMAL(20,10) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "high_rate" DECIMAL(20,10),
    "low_rate" DECIMAL(20,10),
    "open_rate" DECIMAL(20,10),
    "close_rate" DECIMAL(20,10),
    "volume" DECIMAL(20,10),
    "source" "public"."RateSource" NOT NULL DEFAULT 'FOREX_API',
    "source_reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budget_allocations" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "allocated_amount" DECIMAL(120,2) NOT NULL,
    "spent_amount" DECIMAL(120,2) NOT NULL DEFAULT 0,
    "currency_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_projects" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "required_amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "is_exempt" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_contributions" (
    "id" SERIAL NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "member_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "reference_number" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_by" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "public"."ContributionStatus" NOT NULL DEFAULT 'COMPLETED',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_plan_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenditures" (
    "id" SERIAL NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "expenditure_head_code" TEXT NOT NULL,
    "project_id" INTEGER,
    "milestone_id" INTEGER,
    "supplier_id" INTEGER,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(120,2) NOT NULL,
    "tax_amount" DECIMAL(120,2) DEFAULT 0,
    "total_amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "reference_number" TEXT,
    "branch_code" TEXT NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "frequency" "public"."ExpenseFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "urgency" "public"."ExpenseUrgency" NOT NULL DEFAULT 'NORMAL',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_until" TIMESTAMP(3),
    "approval_status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "requested_by" INTEGER NOT NULL,
    "processed_by" INTEGER,
    "notes" TEXT,
    "internal_notes" TEXT,
    "tags" TEXT[],
    "is_reimbursement" BOOLEAN NOT NULL DEFAULT false,
    "reimbursed_to" INTEGER,
    "budget_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenditures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expenditure_line_items" (
    "id" SERIAL NOT NULL,
    "expenditure_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(120,2) NOT NULL,
    "total_price" DECIMAL(120,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "expenditure_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_receipts" (
    "id" SERIAL NOT NULL,
    "expenditure_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "receipt_type" "public"."ReceiptType" NOT NULL,
    "receipt_number" TEXT,
    "merchant_name" TEXT,
    "receipt_date" TIMESTAMP(3),
    "ocr_text" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" INTEGER,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "expense_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "business_name" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "address" TEXT,
    "tax_number" TEXT,
    "bank_account" TEXT,
    "payment_terms" INTEGER DEFAULT 30,
    "credit_limit" DECIMAL(120,2),
    "supplier_type" "public"."SupplierType" NOT NULL DEFAULT 'VENDOR',
    "rating" INTEGER DEFAULT 5,
    "status" "public"."SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "banned_reason" TEXT,
    "banned_by" INTEGER,
    "banned_at" TIMESTAMP(3),
    "blacklist_until" TIMESTAMP(3),
    "risk_level" "public"."RiskLevel" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier_status_history" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "old_status" "public"."SupplierStatus" NOT NULL,
    "new_status" "public"."SupplierStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_date" TIMESTAMP(3),

    CONSTRAINT "supplier_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier_evaluations" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "evaluated_by" INTEGER NOT NULL,
    "quality_rating" INTEGER NOT NULL,
    "timeliness_rating" INTEGER NOT NULL,
    "value_rating" INTEGER NOT NULL,
    "service_rating" INTEGER NOT NULL,
    "overall_rating" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "would_recommend" BOOLEAN NOT NULL DEFAULT true,
    "evaluation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" SERIAL NOT NULL,
    "contract_number" TEXT NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contract_value" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "renewal_date" TIMESTAMP(3),
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contract_type" "public"."ContractType" NOT NULL,
    "payment_terms" TEXT,
    "deliverables" TEXT,
    "penalties" TEXT,
    "signed_by" INTEGER,
    "signed_date" TIMESTAMP(3),
    "document_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contract_milestones" (
    "id" SERIAL NOT NULL,
    "contract_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(120,2),
    "status" "public"."MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "contract_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assets" (
    "id" SERIAL NOT NULL,
    "asset_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."AssetCategory" NOT NULL,
    "expenditure_id" INTEGER,
    "branch_code" TEXT NOT NULL,
    "purchase_price" DECIMAL(120,2) NOT NULL,
    "current_value" DECIMAL(120,2),
    "currency_code" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "warranty_expiry" TIMESTAMP(3),
    "condition" "public"."AssetCondition" NOT NULL DEFAULT 'EXCELLENT',
    "location" TEXT,
    "assigned_to" INTEGER,
    "depreciation_rate" DECIMAL(5,2),
    "is_insured" BOOLEAN NOT NULL DEFAULT false,
    "insurance_expiry" TIMESTAMP(3),
    "serial_number" TEXT,
    "barcode" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_records" (
    "id" SERIAL NOT NULL,
    "asset_id" INTEGER NOT NULL,
    "maintenance_type" "public"."MaintenanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(120,2),
    "currency_code" TEXT,
    "supplier_id" INTEGER,
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "next_service_date" TIMESTAMP(3),
    "performed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approval_history" (
    "id" SERIAL NOT NULL,
    "expenditure_id" INTEGER NOT NULL,
    "approver_level" INTEGER NOT NULL,
    "approved_by" INTEGER NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL,
    "comments" TEXT,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budget_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "budget_type" "public"."BudgetType" NOT NULL,
    "status" "public"."BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "total_budget" DECIMAL(120,2) NOT NULL,
    "actual_spent" DECIMAL(120,2) NOT NULL DEFAULT 0,
    "currency_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."budget_lines" (
    "id" SERIAL NOT NULL,
    "budget_period_id" INTEGER NOT NULL,
    "expenditure_head_code" TEXT NOT NULL,
    "project_id" INTEGER,
    "budgeted_amount" DECIMAL(120,2) NOT NULL,
    "actual_amount" DECIMAL(120,2) NOT NULL DEFAULT 0,
    "variance" DECIMAL(120,2) NOT NULL DEFAULT 0,
    "variance_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" DECIMAL(120,2) NOT NULL,
    "currency_code" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "processed_by_id" INTEGER NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_methods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currency_payment_methods" (
    "currency_code" TEXT NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "currency_payment_methods_pkey" PRIMARY KEY ("currency_code","payment_method_id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "username" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CurrencyToCurrencyConversionHistory" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CurrencyToCurrencyConversionHistory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_number_key" ON "public"."members"("member_number");

-- CreateIndex
CREATE UNIQUE INDEX "member_balances_member_id_project_id_balance_type_key" ON "public"."member_balances"("member_id", "project_id", "balance_type");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_name_key" ON "public"."currencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_base_currency_code_target_currency_code_effe_key" ON "public"."exchange_rates"("base_currency_code", "target_currency_code", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rate_history_base_currency_code_target_currency_co_key" ON "public"."exchange_rate_history"("base_currency_code", "target_currency_code", "date");

-- CreateIndex
CREATE UNIQUE INDEX "member_projects_member_id_project_id_key" ON "public"."member_projects"("member_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_contributions_receipt_number_key" ON "public"."member_contributions"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "expenditures_voucher_number_key" ON "public"."expenditures"("voucher_number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "public"."suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "public"."contracts"("contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_number_key" ON "public"."assets"("asset_number");

-- CreateIndex
CREATE UNIQUE INDEX "assets_expenditure_id_key" ON "public"."assets"("expenditure_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_budget_period_id_expenditure_head_code_project_key" ON "public"."budget_lines"("budget_period_id", "expenditure_head_code", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "public"."payment_methods"("name");

-- CreateIndex
CREATE INDEX "_CurrencyToCurrencyConversionHistory_B_index" ON "public"."_CurrencyToCurrencyConversionHistory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "expenditure_heads_name_branch_code_key" ON "public"."expenditure_heads"("name", "branch_code");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_heads_name_branch_code_key" ON "public"."revenue_heads"("name", "branch_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_branch_code_fkey" FOREIGN KEY ("branch_code") REFERENCES "public"."branches"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_branch_code_fkey" FOREIGN KEY ("branch_code") REFERENCES "public"."branches"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contribution_plans" ADD CONSTRAINT "contribution_plans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contribution_plans" ADD CONSTRAINT "contribution_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contribution_plans" ADD CONSTRAINT "contribution_plans_revenue_head_code_fkey" FOREIGN KEY ("revenue_head_code") REFERENCES "public"."revenue_heads"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contribution_plans" ADD CONSTRAINT "contribution_plans_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contribution_plans" ADD CONSTRAINT "contribution_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reminders" ADD CONSTRAINT "payment_reminders_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reminders" ADD CONSTRAINT "payment_reminders_contribution_plan_id_fkey" FOREIGN KEY ("contribution_plan_id") REFERENCES "public"."contribution_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reminders" ADD CONSTRAINT "payment_reminders_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reminders" ADD CONSTRAINT "payment_reminders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_balances" ADD CONSTRAINT "member_balances_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_balances" ADD CONSTRAINT "member_balances_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_balances" ADD CONSTRAINT "member_balances_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."balance_adjustments" ADD CONSTRAINT "balance_adjustments_member_balance_id_fkey" FOREIGN KEY ("member_balance_id") REFERENCES "public"."member_balances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."balance_adjustments" ADD CONSTRAINT "balance_adjustments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_pattern_history" ADD CONSTRAINT "payment_pattern_history_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_branch_code_fkey" FOREIGN KEY ("branch_code") REFERENCES "public"."branches"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_milestones" ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_tasks" ADD CONSTRAINT "project_tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_updates" ADD CONSTRAINT "project_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_documents" ADD CONSTRAINT "project_documents_parent_doc_id_fkey" FOREIGN KEY ("parent_doc_id") REFERENCES "public"."project_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_base_currency_code_fkey" FOREIGN KEY ("base_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_target_currency_code_fkey" FOREIGN KEY ("target_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_conversion_history" ADD CONSTRAINT "currency_conversion_history_exchange_rate_id_fkey" FOREIGN KEY ("exchange_rate_id") REFERENCES "public"."exchange_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_conversion_history" ADD CONSTRAINT "currency_conversion_history_original_currency_code_fkey" FOREIGN KEY ("original_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_conversion_history" ADD CONSTRAINT "currency_conversion_history_converted_currency_code_fkey" FOREIGN KEY ("converted_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_conversion_history" ADD CONSTRAINT "currency_conversion_history_converted_by_fkey" FOREIGN KEY ("converted_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rate_history" ADD CONSTRAINT "exchange_rate_history_base_currency_code_fkey" FOREIGN KEY ("base_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exchange_rate_history" ADD CONSTRAINT "exchange_rate_history_target_currency_code_fkey" FOREIGN KEY ("target_currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_allocations" ADD CONSTRAINT "budget_allocations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_allocations" ADD CONSTRAINT "budget_allocations_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_projects" ADD CONSTRAINT "member_projects_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_projects" ADD CONSTRAINT "member_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_projects" ADD CONSTRAINT "member_projects_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_contributions" ADD CONSTRAINT "member_contributions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_contributions" ADD CONSTRAINT "member_contributions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_contributions" ADD CONSTRAINT "member_contributions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_contributions" ADD CONSTRAINT "member_contributions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_contributions" ADD CONSTRAINT "member_contributions_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_expenditure_head_code_fkey" FOREIGN KEY ("expenditure_head_code") REFERENCES "public"."expenditure_heads"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_branch_code_fkey" FOREIGN KEY ("branch_code") REFERENCES "public"."branches"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditures" ADD CONSTRAINT "expenditures_reimbursed_to_fkey" FOREIGN KEY ("reimbursed_to") REFERENCES "public"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expenditure_line_items" ADD CONSTRAINT "expenditure_line_items_expenditure_id_fkey" FOREIGN KEY ("expenditure_id") REFERENCES "public"."expenditures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_receipts" ADD CONSTRAINT "expense_receipts_expenditure_id_fkey" FOREIGN KEY ("expenditure_id") REFERENCES "public"."expenditures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_receipts" ADD CONSTRAINT "expense_receipts_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_receipts" ADD CONSTRAINT "expense_receipts_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."suppliers" ADD CONSTRAINT "suppliers_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_status_history" ADD CONSTRAINT "supplier_status_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_status_history" ADD CONSTRAINT "supplier_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_evaluations" ADD CONSTRAINT "supplier_evaluations_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contract_milestones" ADD CONSTRAINT "contract_milestones_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_expenditure_id_fkey" FOREIGN KEY ("expenditure_id") REFERENCES "public"."expenditures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_branch_code_fkey" FOREIGN KEY ("branch_code") REFERENCES "public"."branches"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_history" ADD CONSTRAINT "approval_history_expenditure_id_fkey" FOREIGN KEY ("expenditure_id") REFERENCES "public"."expenditures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approval_history" ADD CONSTRAINT "approval_history_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_periods" ADD CONSTRAINT "budget_periods_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_lines" ADD CONSTRAINT "budget_lines_budget_period_id_fkey" FOREIGN KEY ("budget_period_id") REFERENCES "public"."budget_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_lines" ADD CONSTRAINT "budget_lines_expenditure_head_code_fkey" FOREIGN KEY ("expenditure_head_code") REFERENCES "public"."expenditure_heads"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."budget_lines" ADD CONSTRAINT "budget_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_payment_methods" ADD CONSTRAINT "currency_payment_methods_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."currency_payment_methods" ADD CONSTRAINT "currency_payment_methods_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CurrencyToCurrencyConversionHistory" ADD CONSTRAINT "_CurrencyToCurrencyConversionHistory_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."currencies"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CurrencyToCurrencyConversionHistory" ADD CONSTRAINT "_CurrencyToCurrencyConversionHistory_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."currency_conversion_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
