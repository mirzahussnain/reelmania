-- DropEnum
DROP TYPE "crdb_internal_region";

-- CreateTable
CREATE TABLE "users" (
    "id" STRING NOT NULL,
    "first_name" STRING NOT NULL,
    "last_name" STRING NOT NULL,
    "role" STRING NOT NULL DEFAULT 'Consumer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" STRING NOT NULL,
    "username" STRING NOT NULL,
    "avatar_url" STRING NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers" (
    "followerId" STRING NOT NULL,
    "followingId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("followerId","followingId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "followers_followerId_idx" ON "followers"("followerId");

-- CreateIndex
CREATE INDEX "followers_followingId_idx" ON "followers"("followingId");

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
