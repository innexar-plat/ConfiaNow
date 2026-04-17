import "dotenv/config";
import {
  BackgroundJobStatus,
  IntegrationEventStatus,
  IntegrationProvider,
  RetryQueueStatus,
  RetrySourceType,
  type Prisma
} from "@prisma/client";
import { prisma } from "@platform/database";

export type ReceiveWebhookInput = {
  provider: IntegrationProvider;
  endpoint: string;
  payload: Record<string, unknown>;
  signature: string;
  sourceIp?: string | null;
  providerEventId?: string | null;
  eventType?: string | null;
};

export type ListJobsQuery = {
  page?: number;
  limit?: number;
  provider?: IntegrationProvider;
  status?: BackgroundJobStatus;
  jobType?: string;
};

export type RetryJobInput = {
  jobId: string;
  actorUserId: string;
  reason?: string;
};

function resolveWebhookEventType(payload: Record<string, unknown>, fallback?: string | null) {
  const fromPayload = ["eventType", "type", "event", "action"]
    .map((key) => payload[key])
    .find((value) => typeof value === "string" && value.length > 0);

  return String(fromPayload ?? fallback ?? "event.unknown");
}

function resolveJobType(provider: IntegrationProvider, eventType: string) {
  if (provider === IntegrationProvider.VERIFICATION_PROVIDER) {
    return `verification.${eventType}`;
  }
  if (provider === IntegrationProvider.EMAIL_PROVIDER) {
    return `email.${eventType}`;
  }
  return `storage.${eventType}`;
}

function providerValues() {
  return [
    IntegrationProvider.VERIFICATION_PROVIDER,
    IntegrationProvider.EMAIL_PROVIDER,
    IntegrationProvider.STORAGE_PROVIDER
  ];
}

export async function receiveWebhook(input: ReceiveWebhookInput) {
  const eventType = resolveWebhookEventType(input.payload, input.eventType);

  if (input.providerEventId) {
    const existing = await prisma.integrationEvent.findUnique({
      where: { providerEventId: input.providerEventId }
    });

    if (existing) {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          integrationEventId: existing.id,
          provider: input.provider,
          endpoint: input.endpoint,
          payload: input.payload as Prisma.InputJsonValue,
          headers: { signature: input.signature } as Prisma.InputJsonValue,
          status: IntegrationEventStatus.PROCESSED,
          attemptCount: 1,
          deliveredAt: new Date()
        }
      });

      return {
        accepted: true,
        duplicate: true,
        eventId: existing.id,
        deliveryId: delivery.id
      };
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.integrationEvent.create({
      data: {
        provider: input.provider,
        providerEventId: input.providerEventId ?? undefined,
        eventType,
        payload: input.payload as Prisma.InputJsonValue,
        signature: input.signature,
        sourceIp: input.sourceIp ?? undefined,
        status: IntegrationEventStatus.PROCESSING
      }
    });

    const delivery = await tx.webhookDelivery.create({
      data: {
        integrationEventId: event.id,
        provider: input.provider,
        endpoint: input.endpoint,
        payload: input.payload as Prisma.InputJsonValue,
        headers: { signature: input.signature } as Prisma.InputJsonValue,
        status: IntegrationEventStatus.PROCESSED,
        attemptCount: 1,
        deliveredAt: new Date()
      }
    });

    const job = await tx.backgroundJob.create({
      data: {
        integrationEventId: event.id,
        provider: input.provider,
        jobType: resolveJobType(input.provider, eventType),
        status: BackgroundJobStatus.PENDING,
        payload: {
          deliveryId: delivery.id,
          endpoint: input.endpoint,
          eventType
        } as Prisma.InputJsonValue
      }
    });

    return { event, delivery, job };
  });

  return {
    accepted: true,
    duplicate: false,
    eventId: result.event.id,
    deliveryId: result.delivery.id,
    jobId: result.job.id
  };
}

export async function handleVerificationProviderWebhook(input: Omit<ReceiveWebhookInput, "provider">) {
  return receiveWebhook({ ...input, provider: IntegrationProvider.VERIFICATION_PROVIDER });
}

export async function handleEmailProviderWebhook(input: Omit<ReceiveWebhookInput, "provider">) {
  return receiveWebhook({ ...input, provider: IntegrationProvider.EMAIL_PROVIDER });
}

export async function handleStorageProviderWebhook(input: Omit<ReceiveWebhookInput, "provider">) {
  return receiveWebhook({ ...input, provider: IntegrationProvider.STORAGE_PROVIDER });
}

export async function getIntegrationsStatus() {
  const [groupedEvents, lastEvents, jobsByProvider] = await Promise.all([
    prisma.integrationEvent.groupBy({
      by: ["provider", "status"],
      _count: { _all: true }
    }),
    prisma.integrationEvent.groupBy({
      by: ["provider"],
      _max: { receivedAt: true }
    }),
    prisma.backgroundJob.groupBy({
      by: ["provider", "status"],
      where: { provider: { not: null } },
      _count: { _all: true }
    })
  ]);

  const providerStatus = providerValues().map((provider) => {
    const eventSummary = groupedEvents.filter((item) => item.provider === provider);
    const jobSummary = jobsByProvider.filter((item) => item.provider === provider);
    const lastEvent = lastEvents.find((item) => item.provider === provider)?._max.receivedAt ?? null;

    const countForEventStatus = (status: IntegrationEventStatus) =>
      eventSummary.find((item) => item.status === status)?._count._all ?? 0;

    const countForJobStatus = (status: BackgroundJobStatus) =>
      jobSummary.find((item) => item.status === status)?._count._all ?? 0;

    return {
      provider,
      events: {
        total: eventSummary.reduce((sum, item) => sum + item._count._all, 0),
        received: countForEventStatus(IntegrationEventStatus.RECEIVED),
        processing: countForEventStatus(IntegrationEventStatus.PROCESSING),
        processed: countForEventStatus(IntegrationEventStatus.PROCESSED),
        failed: countForEventStatus(IntegrationEventStatus.FAILED),
        deadLetter: countForEventStatus(IntegrationEventStatus.DEAD_LETTER)
      },
      jobs: {
        pending: countForJobStatus(BackgroundJobStatus.PENDING),
        running: countForJobStatus(BackgroundJobStatus.RUNNING),
        completed: countForJobStatus(BackgroundJobStatus.COMPLETED),
        failed: countForJobStatus(BackgroundJobStatus.FAILED)
      },
      lastEventAt: lastEvent
    };
  });

  return {
    data: providerStatus,
    meta: {
      providerCount: providerStatus.length,
      generatedAt: new Date().toISOString()
    }
  };
}

export async function listBackgroundJobs(query: ListJobsQuery = {}) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.BackgroundJobWhereInput = {
    ...(query.provider ? { provider: query.provider } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.jobType ? { jobType: query.jobType } : {})
  };

  const [items, total] = await prisma.$transaction([
    prisma.backgroundJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: "desc" }],
      include: {
        integrationEvent: {
          select: {
            id: true,
            eventType: true,
            providerEventId: true,
            status: true
          }
        }
      }
    }),
    prisma.backgroundJob.count({ where })
  ]);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function retryBackgroundJob(input: RetryJobInput) {
  const job = await prisma.backgroundJob.findUnique({ where: { id: input.jobId } });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.status === BackgroundJobStatus.RUNNING) {
    throw new Error("JOB_ALREADY_RUNNING");
  }

  const retriedAt = new Date();

  const [updatedJob, retryEntry] = await prisma.$transaction([
    prisma.backgroundJob.update({
      where: { id: input.jobId },
      data: {
        status: BackgroundJobStatus.PENDING,
        runAt: retriedAt,
        failedAt: null,
        lastError: null,
        retriedByUserId: input.actorUserId,
        attemptCount: { increment: 1 }
      }
    }),
    prisma.retryQueue.create({
      data: {
        sourceType: RetrySourceType.BACKGROUND_JOB,
        sourceId: input.jobId,
        integrationEventId: job.integrationEventId ?? undefined,
        backgroundJobId: input.jobId,
        status: RetryQueueStatus.COMPLETED,
        reason: input.reason ?? "MANUAL_RETRY",
        payload: { requestedBy: input.actorUserId } as Prisma.InputJsonValue,
        nextAttemptAt: retriedAt,
        completedAt: retriedAt,
        actorUserId: input.actorUserId,
        attemptCount: 1
      }
    })
  ]);

  return {
    data: {
      job: updatedJob,
      retry: retryEntry
    }
  };
}
