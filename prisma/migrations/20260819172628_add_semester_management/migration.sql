-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "semesterId" TEXT;

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Semester_userId_idx" ON "Semester"("userId");

-- CreateIndex
CREATE INDEX "Semester_userId_isActive_idx" ON "Semester"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_id_userId_key" ON "Semester"("id", "userId");

-- CreateIndex
CREATE INDEX "Module_semesterId_userId_idx" ON "Module"("semesterId", "userId");

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_semesterId_userId_fkey" FOREIGN KEY ("semesterId", "userId") REFERENCES "Semester"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
