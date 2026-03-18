-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "deviceCredentialsId" TEXT,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices_credentials" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deviceCredentialsId" TEXT NOT NULL,

    CONSTRAINT "devices_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "tipo_doc" INTEGER NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "cei" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pis" TEXT NOT NULL,
    "cpf" TEXT,
    "code" INTEGER NOT NULL,
    "templates_count" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "rfid" INTEGER NOT NULL,
    "bars" TEXT NOT NULL,
    "registration" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "admin_user_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_sessions_deviceCredentialsId_key" ON "devices_sessions"("deviceCredentialsId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cpf_cnpj_key" ON "companies"("cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_pis_key" ON "users"("pis");

-- CreateIndex
CREATE UNIQUE INDEX "users_admin_user_id_key" ON "users"("admin_user_id");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_deviceCredentialsId_fkey" FOREIGN KEY ("deviceCredentialsId") REFERENCES "devices_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices_sessions" ADD CONSTRAINT "devices_sessions_deviceCredentialsId_fkey" FOREIGN KEY ("deviceCredentialsId") REFERENCES "devices_credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
