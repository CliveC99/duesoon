-- Optional details for deadlines whose type is EXAM.
ALTER TABLE "Deadline"
ADD COLUMN "examTopics" TEXT,
ADD COLUMN "examFormat" TEXT,
ADD COLUMN "examLocation" TEXT;
