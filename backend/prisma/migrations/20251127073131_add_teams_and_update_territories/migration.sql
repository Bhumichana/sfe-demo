/*
  Warnings:

  - Added the required column `company_id` to the `territories` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add company_id column as nullable first
ALTER TABLE "territories" ADD COLUMN "company_id" TEXT;

-- Step 2: Update existing territories with company_id from users table
UPDATE "territories" t
SET "company_id" = (
  SELECT DISTINCT u.company_id
  FROM "users" u
  WHERE u.territory_id = t.id
  LIMIT 1
);

-- Step 3: If any territories still don't have company_id, set it to the first company
UPDATE "territories" t
SET "company_id" = (SELECT id FROM "companies" LIMIT 1)
WHERE "company_id" IS NULL;

-- Step 4: Make company_id NOT NULL
ALTER TABLE "territories" ALTER COLUMN "company_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "team_id" TEXT;

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leader_id" TEXT,
    "company_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");

-- CreateIndex
CREATE INDEX "teams_company_id_idx" ON "teams"("company_id");

-- CreateIndex
CREATE INDEX "teams_leader_id_idx" ON "teams"("leader_id");

-- CreateIndex
CREATE INDEX "territories_company_id_idx" ON "territories"("company_id");

-- CreateIndex
CREATE INDEX "users_team_id_idx" ON "users"("team_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
