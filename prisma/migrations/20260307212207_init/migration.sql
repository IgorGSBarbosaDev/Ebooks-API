-- CreateTable
CREATE TABLE "ebooks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "author" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "coverPath" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ebooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ebooks_author_idx" ON "ebooks"("author");

-- CreateIndex
CREATE INDEX "ebooks_createdAt_idx" ON "ebooks"("createdAt");
