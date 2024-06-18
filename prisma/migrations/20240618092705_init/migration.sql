-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "focusPeriod" INTEGER NOT NULL DEFAULT 25,
    "breakPeriod" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
