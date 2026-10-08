-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "batch_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batches_department_id_idx" ON "batches"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "batches_department_id_batch_number_key" ON "batches"("department_id", "batch_number");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert initial managed batches (66, 67, 68, 69, 70) for all existing departments
INSERT INTO "batches" ("id", "department_id", "batch_number", "is_active", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    d.id,
    b.num,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "departments" d
CROSS JOIN (VALUES (66), (67), (68), (69), (70)) AS b(num)
ON CONFLICT ("department_id", "batch_number") DO NOTHING;

-- AlterTable users: add batch_id
ALTER TABLE "users" ADD COLUMN "batch_id" UUID;

-- AlterTable resources: add batch_id
ALTER TABLE "resources" ADD COLUMN "batch_id" UUID;

-- Migrate existing User string batch data to batch_id
UPDATE "users" u
SET "batch_id" = b."id"
FROM "batches" b
WHERE u."department_id" = b."department_id"
  AND u."batch" IS NOT NULL
  AND u."batch" ~ '^[0-9]+$'
  AND u."batch"::integer = b."batch_number";

-- Migrate existing Resource string batch data to batch_id
UPDATE "resources" r
SET "batch_id" = b."id"
FROM "courses" c, "batches" b
WHERE r."course_id" = c."id"
  AND c."department_id" = b."department_id"
  AND r."batch" IS NOT NULL
  AND r."batch" ~ '^[0-9]+$'
  AND r."batch"::integer = b."batch_number";

-- Drop old index on resources(batch, section)
DROP INDEX IF EXISTS "resources_batch_section_idx";

-- Drop old string batch columns
ALTER TABLE "users" DROP COLUMN "batch";
ALTER TABLE "resources" DROP COLUMN "batch";

-- CreateIndex
CREATE INDEX "users_batch_id_idx" ON "users"("batch_id");

-- CreateIndex
CREATE INDEX "resources_batch_id_idx" ON "resources"("batch_id");

-- CreateIndex
CREATE INDEX "resources_batch_id_section_idx" ON "resources"("batch_id", "section");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
