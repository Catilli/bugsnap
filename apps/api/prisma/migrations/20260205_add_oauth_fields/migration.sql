-- AlterTable: Make password optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AddColumn: OAuth provider name (google, github)
ALTER TABLE "users" ADD COLUMN "oauthProvider" TEXT;

-- AddColumn: OAuth provider user ID
ALTER TABLE "users" ADD COLUMN "oauthId" TEXT;

-- CreateIndex: Unique constraint on oauthProvider + oauthId
CREATE UNIQUE INDEX "users_oauthProvider_oauthId_key" ON "users"("oauthProvider", "oauthId");
