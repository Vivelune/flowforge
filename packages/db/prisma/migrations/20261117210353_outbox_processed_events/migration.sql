-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "seq" BIGSERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "headers" JSONB,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "consumer" TEXT NOT NULL,
    "eventId" UUID NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("consumer","eventId")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_seq_idx" ON "OutboxEvent"("seq");

-- Partial index: only unpublished rows. Prisma's schema language cannot express
-- partial indexes, so this is applied manually. This keeps the relay's polling
-- query (WHERE publishedAt IS NULL ORDER BY seq) fast without indexing the
-- entire historical outbox.
CREATE INDEX "OutboxEvent_unpublished_seq_idx"
ON "OutboxEvent" ("seq")
WHERE "publishedAt" IS NULL;