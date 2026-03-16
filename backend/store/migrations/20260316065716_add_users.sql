-- Add migration script here
CREATE TABLE "user" (
    "id"         TEXT NOT NULL,
    "email"      TEXT NOT NULL UNIQUE,
    "password"   TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
