-- CreateTable
CREATE TABLE "PunchRecord" (
    "id" TEXT NOT NULL,
    "pis" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "afd_datetime" TIMESTAMP(3),
    "nsr" INTEGER,
    "registration_type" TEXT,
    "hexadecimal_check_digit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PunchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PunchRecord_nsr_key" ON "PunchRecord"("nsr");

-- AddForeignKey
ALTER TABLE "PunchRecord" ADD CONSTRAINT "PunchRecord_pis_fkey" FOREIGN KEY ("pis") REFERENCES "users"("pis") ON DELETE RESTRICT ON UPDATE CASCADE;
