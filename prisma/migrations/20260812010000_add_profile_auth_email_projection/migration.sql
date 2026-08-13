-- AlterTable
ALTER TABLE "profiles"
ADD COLUMN "auth_email_normalized" VARCHAR(320);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_auth_email_normalized_unique"
ON "profiles"("auth_email_normalized");
