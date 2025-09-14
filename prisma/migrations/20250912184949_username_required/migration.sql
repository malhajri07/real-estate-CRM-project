/*
  Warnings:

  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "email", "firstName", "id", "isActive", "lastLoginAt", "lastName", "organizationId", "passwordHash", "phone", "roles", "updatedAt", "username") SELECT "createdAt", "email", "firstName", "id", "isActive", "lastLoginAt", "lastName", "organizationId", "passwordHash", "phone", "roles", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
