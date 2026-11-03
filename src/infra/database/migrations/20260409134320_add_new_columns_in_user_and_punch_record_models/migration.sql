/*
  Warnings:

  - You are about to drop the `PunchRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PunchRecord" DROP CONSTRAINT "PunchRecord_pis_fkey";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "registration" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admission_date" TIMESTAMP(3),
ADD COLUMN     "department" TEXT,
ADD COLUMN     "payroll_number" TEXT,
ADD COLUMN     "position" TEXT,
ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "rfid" SET DATA TYPE TEXT,
ALTER COLUMN "registration" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."PunchRecord";

-- CreateTable
CREATE TABLE "punch_records" (
    "id" TEXT NOT NULL,
    "pis" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "afd_datetime" TIMESTAMP(3),
    "nsr" INTEGER,
    "registration_type" TEXT,
    "hexadecimal_check_digit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "punch_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "punch_records_nsr_key" ON "punch_records"("nsr");

-- AddForeignKey
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_pis_fkey" FOREIGN KEY ("pis") REFERENCES "users"("pis") ON DELETE RESTRICT ON UPDATE CASCADE;
