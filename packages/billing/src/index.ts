import "dotenv/config";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import {
  AnalyticsEventType,
  BillingEventType,
  BillingInterval,
  BoostStatus,
  InvoiceStatus,
  InvoiceType,
  NotificationType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  SubscriptionPlanCode,
  SubscriptionStatus,
  UserRole,
  VerificationStatus
} from "@prisma/client";
import { recordAnalyticsEvent } from "@platform/analytics";
import { prisma } from "@platform/database";
import { syncBusinessSearchIndex } from "@platform/discovery";
import { createInAppNotification } from "@platform/notifications";

const BILLING_WEBHOOK_TOLERANCE_SECONDS = 300;
const DEFAULT_BILLING_WEBHOOK_SECRET = "local-billing-secret";
const DEFAULT_CURRENCY = "USD";
const BOOST_PRICE_PER_DAY_CENTS = 700;
const BOOST_MIN_DAYS = 3;
const BOOST_MAX_DAYS = 30;
const BOOST_RANKING_BONUS = 40;

type BillingPlanDefinition = {
  code: SubscriptionPlanCode;
  name: string;
  description: string;
  interval: BillingInterval;
  priceCents: number;
  verificationFeeCents: number;
  boostPriceDailyCents: number;
  recommended: boolean;
  features: string[];
};

const PLAN_CATALOG: BillingPlanDefinition[] = [
  {
    code: SubscriptionPlanCode.FREE,
    name: "Free",
    description: "Perfil publicado basico com operacao organica no catalogo.",
    interval: BillingInterval.MONTH,
    priceCents: 0,
    verificationFeeCents: 4900,
    boostPriceDailyCents: BOOST_PRICE_PER_DAY_CENTS,
    recommended: false,
    features: ["public profile", "lead inbox", "trust badge eligibility"]
  },
  {
    code: SubscriptionPlanCode.PRO_MONTHLY,
    name: "Pro Monthly",
    description: "Plano mensal para ganhar recorrencia, destaque pago e operacao comercial continua.",
    interval: BillingInterval.MONTH,
    priceCents: 9900,
    verificationFeeCents: 4900,
    boostPriceDailyCents: BOOST_PRICE_PER_DAY_CENTS,
    recommended: true,
    features: ["provider dashboard subscription", "boost purchases", "commercial priority"]
  },
  {
    code: SubscriptionPlanCode.PRO_YEARLY,
    name: "Pro Yearly",
    description: "Plano anual com recorrencia extendida e menor custo efetivo por mes.",
    interval: BillingInterval.YEAR,
    priceCents: 99000,
    verificationFeeCents: 4900,
    boostPriceDailyCents: BOOST_PRICE_PER_DAY_CENTS,
    recommended: false,
    features: ["provider dashboard subscription", "boost purchases", "commercial priority"]
  }
];

export type BillingPlanView = {
  code: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  currency: string;
  verificationFeeCents: number;
  boostPriceDailyCents: number;
  recommended: boolean;
  features: string[];
};

export type CurrentSubscriptionView = {
  id: string | null;
  planCode: string;
  planName: string;
  status: string;
  interval: string;
  priceCents: number;
  currency: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  checkoutReference: string | null;
  hasActiveBenefits: boolean;
};

export type BillingInvoiceView = {
  id: string;
  type: string;
  status: string;
  description: string;
  amountCents: number;
  currency: string;
  dueAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  payments: Array<{
    id: string;
    status: string;
    amountCents: number;
    providerReference: string | null;
    paidAt: string | null;
    failedAt: string | null;
  }>;
};

export type BoostView = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  activatedAt: string | null;
  createdAt: string;
};

export type BillingCheckoutView = {
  reference: string;
  provider: string;
  checkoutUrl: string;
  pendingPaymentIds: string[];
};

export type BillingWebhookEnvelope = {
  id: string;
  type: string;
  apiVersion: string;
  createdAt: string;
  data: {
    invoiceId?: string;
    paymentId?: string;
    subscriptionId?: string;
    boostId?: string;
    providerPaymentId?: string;
    providerReference?: string;
    periodStart?: string;
    periodEnd?: string;
    eventReason?: string;
    paidAt?: string;
    failedAt?: string;
  };
};

function toJsonValue(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

function mapPlanCode(value: SubscriptionPlanCode) {
  return value.toLowerCase();
}

function mapInterval(value: BillingInterval) {
  return value.toLowerCase();
}

function mapSubscriptionStatus(value: SubscriptionStatus) {
  return value.toLowerCase();
}

function mapInvoiceStatus(value: InvoiceStatus) {
  return value.toLowerCase();
}

function mapInvoiceType(value: InvoiceType) {
  return value.toLowerCase();
}

function mapPaymentStatus(value: PaymentStatus) {
  return value.toLowerCase();
}

function mapBoostStatus(value: BoostStatus) {
  return value.toLowerCase();
}

function getBillingWebhookSecret() {
  return process.env.BILLING_WEBHOOK_SECRET || DEFAULT_BILLING_WEBHOOK_SECRET;
}

function normalizePlanCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (normalized === SubscriptionPlanCode.FREE) return SubscriptionPlanCode.FREE;
  if (normalized === SubscriptionPlanCode.PRO_MONTHLY) return SubscriptionPlanCode.PRO_MONTHLY;
  if (normalized === SubscriptionPlanCode.PRO_YEARLY) return SubscriptionPlanCode.PRO_YEARLY;
  throw new Error("INVALID_PLAN_CODE");
}

function getPlanDefinition(planCode: SubscriptionPlanCode) {
  const plan = PLAN_CATALOG.find((item) => item.code === planCode);
  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }
  return plan;
}

function addBillingInterval(date: Date, interval: BillingInterval, amount = 1) {
  const next = new Date(date);

  if (interval === BillingInterval.YEAR) {
    next.setUTCFullYear(next.getUTCFullYear() + amount);
    return next;
  }

  if (interval === BillingInterval.MONTH) {
    next.setUTCMonth(next.getUTCMonth() + amount);
    return next;
  }

  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function hasVerificationFeeRequirement(status: VerificationStatus) {
  return status !== VerificationStatus.APPROVED;
}

function buildCheckoutUrl(reference: string) {
  return `/dashboard/billing?checkout=${reference}`;
}

function buildCheckoutReference(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function compareSignature(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function computeSignature(payload: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
}

export function signBillingWebhookPayload(payload: string, timestamp = `${Math.floor(Date.now() / 1000)}`, secret = getBillingWebhookSecret()) {
  const signature = computeSignature(payload, timestamp, secret);
  return {
    timestamp,
    signature: `sha256=${signature}`
  };
}

function verifyBillingWebhookPayload(payload: string, timestamp: string, signature: string, secret = getBillingWebhookSecret()) {
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > BILLING_WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("WEBHOOK_TIMESTAMP_INVALID");
  }

  const expected = `sha256=${computeSignature(payload, timestamp, secret)}`;
  if (!compareSignature(expected, signature)) {
    throw new Error("WEBHOOK_SIGNATURE_INVALID");
  }
}

function mapPlanView(plan: BillingPlanDefinition): BillingPlanView {
  return {
    code: mapPlanCode(plan.code),
    name: plan.name,
    description: plan.description,
    interval: mapInterval(plan.interval),
    priceCents: plan.priceCents,
    currency: DEFAULT_CURRENCY,
    verificationFeeCents: plan.verificationFeeCents,
    boostPriceDailyCents: plan.boostPriceDailyCents,
    recommended: plan.recommended,
    features: [...plan.features]
  };
}

function mapSubscriptionView(subscription: {
  id: string | null;
  planCode: SubscriptionPlanCode;
  status: SubscriptionStatus;
  interval: BillingInterval;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  checkoutReference: string | null;
}): CurrentSubscriptionView {
  const plan = getPlanDefinition(subscription.planCode);
  return {
    id: subscription.id,
    planCode: mapPlanCode(subscription.planCode),
    planName: plan.name,
    status: mapSubscriptionStatus(subscription.status),
    interval: mapInterval(subscription.interval),
    priceCents: plan.priceCents,
    currency: DEFAULT_CURRENCY,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    checkoutReference: subscription.checkoutReference,
    hasActiveBenefits: subscription.status === SubscriptionStatus.ACTIVE
  };
}

function mapInvoiceView(invoice: {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  description: string;
  amountCents: number;
  currency: string;
  dueAt: Date | null;
  paidAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  payments: Array<{
    id: string;
    status: PaymentStatus;
    amountCents: number;
    providerReference: string | null;
    paidAt: Date | null;
    failedAt: Date | null;
  }>;
}): BillingInvoiceView {
  return {
    id: invoice.id,
    type: mapInvoiceType(invoice.type),
    status: mapInvoiceStatus(invoice.status),
    description: invoice.description,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    dueAt: invoice.dueAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    failedAt: invoice.failedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      status: mapPaymentStatus(payment.status),
      amountCents: payment.amountCents,
      providerReference: payment.providerReference,
      paidAt: payment.paidAt?.toISOString() ?? null,
      failedAt: payment.failedAt?.toISOString() ?? null
    }))
  };
}

function mapBoostView(boost: {
  id: string;
  status: BoostStatus;
  amountCents: number;
  currency: string;
  startsAt: Date | null;
  endsAt: Date | null;
  activatedAt: Date | null;
  createdAt: Date;
}): BoostView {
  return {
    id: boost.id,
    status: mapBoostStatus(boost.status),
    amountCents: boost.amountCents,
    currency: boost.currency,
    startsAt: boost.startsAt?.toISOString() ?? null,
    endsAt: boost.endsAt?.toISOString() ?? null,
    activatedAt: boost.activatedAt?.toISOString() ?? null,
    createdAt: boost.createdAt.toISOString()
  };
}

async function requireBusinessContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      businessProfile: true
    }
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (user.role !== UserRole.BUSINESS || !user.businessProfile) {
    throw new Error("BUSINESS_ROLE_REQUIRED");
  }

  return {
    user,
    businessProfile: user.businessProfile
  };
}

async function hasPaidVerificationInvoice(userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      userId,
      type: InvoiceType.VERIFICATION_FEE,
      status: InvoiceStatus.PAID
    },
    select: { id: true }
  });

  return Boolean(invoice?.id);
}

async function expireElapsedBoosts(businessProfileId?: string) {
  const now = new Date();
  const expired = await prisma.boost.findMany({
    where: {
      status: BoostStatus.ACTIVE,
      endsAt: { lt: now },
      ...(businessProfileId ? { businessProfileId } : {})
    },
    select: { id: true, businessProfileId: true }
  });

  if (expired.length === 0) {
    return;
  }

  await prisma.boost.updateMany({
    where: { id: { in: expired.map((item) => item.id) } },
    data: { status: BoostStatus.EXPIRED }
  });

  for (const item of expired) {
    await syncBusinessSearchIndex(item.businessProfileId);
  }
}

async function createPendingInvoicePayment(input: {
  transaction: Prisma.TransactionClient;
  userId: string;
  businessProfileId: string;
  subscriptionId?: string;
  boostId?: string;
  type: InvoiceType;
  amountCents: number;
  description: string;
  checkoutReference: string;
}) {
  const invoice = await input.transaction.invoice.create({
    data: {
      userId: input.userId,
      businessProfileId: input.businessProfileId,
      subscriptionId: input.subscriptionId,
      boostId: input.boostId,
      type: input.type,
      amountCents: input.amountCents,
      currency: DEFAULT_CURRENCY,
      description: input.description,
      provider: PaymentProvider.LOCAL,
      dueAt: addBillingInterval(new Date(), BillingInterval.ONE_TIME, 2)
    }
  });

  const payment = await input.transaction.payment.create({
    data: {
      userId: input.userId,
      businessProfileId: input.businessProfileId,
      subscriptionId: input.subscriptionId,
      invoiceId: invoice.id,
      boostId: input.boostId,
      provider: PaymentProvider.LOCAL,
      method: PaymentMethod.CHECKOUT,
      amountCents: input.amountCents,
      currency: DEFAULT_CURRENCY,
      providerReference: input.checkoutReference
    }
  });

  return { invoice, payment };
}

async function notifyBillingResult(input: {
  userId: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  await createInAppNotification({
    userId: input.userId,
    type: NotificationType.SYSTEM_ALERT,
    title: input.title,
    body: input.body,
    metadata: input.metadata
  });
}

async function getStoredSubscription(userId: string) {
  const context = await requireBusinessContext(userId);
  await expireElapsedBoosts(context.businessProfile.id);

  const subscription = await prisma.subscription.findUnique({
    where: { businessProfileId: context.businessProfile.id }
  });

  return { context, subscription };
}

export function isPlanUpgrade(currentPlanCode: SubscriptionPlanCode, targetPlanCode: SubscriptionPlanCode) {
  const score: Record<SubscriptionPlanCode, number> = {
    [SubscriptionPlanCode.FREE]: 0,
    [SubscriptionPlanCode.PRO_MONTHLY]: 1,
    [SubscriptionPlanCode.PRO_YEARLY]: 2
  };

  return score[targetPlanCode] > score[currentPlanCode];
}

export function canPurchaseBoost(input: {
  planCode: SubscriptionPlanCode;
  status: SubscriptionStatus;
}) {
  return input.status === SubscriptionStatus.ACTIVE && input.planCode !== SubscriptionPlanCode.FREE;
}

export function getBoostRankingBonus() {
  return BOOST_RANKING_BONUS;
}

export async function listPlans() {
  return PLAN_CATALOG.map(mapPlanView);
}

export async function getCurrentSubscription(userId: string): Promise<CurrentSubscriptionView> {
  const { subscription } = await getStoredSubscription(userId);

  if (!subscription) {
    return mapSubscriptionView({
      id: null,
      planCode: SubscriptionPlanCode.FREE,
      status: SubscriptionStatus.CANCELED,
      interval: BillingInterval.MONTH,
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      checkoutReference: null
    });
  }

  return mapSubscriptionView(subscription);
}

export async function createSubscriptionCheckout(input: {
  userId: string;
  planCode: string;
}) {
  const { context, subscription: existingSubscription } = await getStoredSubscription(input.userId);
  const planCode = normalizePlanCode(input.planCode);
  const plan = getPlanDefinition(planCode);

  if (plan.code === SubscriptionPlanCode.FREE) {
    throw new Error("FREE_PLAN_NOT_ALLOWED");
  }

  if (existingSubscription && existingSubscription.status !== SubscriptionStatus.CANCELED) {
    throw new Error("SUBSCRIPTION_ALREADY_EXISTS");
  }

  const requiresVerificationFee = hasVerificationFeeRequirement(context.user.verificationStatus) && !(await hasPaidVerificationInvoice(context.user.id));
  const checkoutReference = buildCheckoutReference("sub");
  const now = new Date();
  const currentPeriodEnd = addBillingInterval(now, plan.interval, 1);

  const result = await prisma.$transaction(async (transaction) => {
    const subscription = existingSubscription
      ? await transaction.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planCode,
            interval: plan.interval,
            status: SubscriptionStatus.INCOMPLETE,
            checkoutReference,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            delinquentAt: null,
            currentPeriodStart: now,
            currentPeriodEnd,
            metadata: toJsonValue({ checkoutReference, source: "create_subscription" })
          }
        })
      : await transaction.subscription.create({
          data: {
            userId: context.user.id,
            businessProfileId: context.businessProfile.id,
            planCode,
            interval: plan.interval,
            status: SubscriptionStatus.INCOMPLETE,
            provider: PaymentProvider.LOCAL,
            checkoutReference,
            currentPeriodStart: now,
            currentPeriodEnd,
            metadata: toJsonValue({ checkoutReference, source: "create_subscription" })
          }
        });

    const createdInvoices = [] as Array<{ invoiceId: string; paymentId: string }>;

    const subscriptionCharge = await createPendingInvoicePayment({
      transaction,
      userId: context.user.id,
      businessProfileId: context.businessProfile.id,
      subscriptionId: subscription.id,
      type: InvoiceType.SUBSCRIPTION,
      amountCents: plan.priceCents,
      description: `${plan.name} subscription checkout`,
      checkoutReference
    });

    createdInvoices.push({ invoiceId: subscriptionCharge.invoice.id, paymentId: subscriptionCharge.payment.id });

    if (requiresVerificationFee) {
      const verificationCharge = await createPendingInvoicePayment({
        transaction,
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        subscriptionId: subscription.id,
        type: InvoiceType.VERIFICATION_FEE,
        amountCents: plan.verificationFeeCents,
        description: "Verification fee checkout",
        checkoutReference
      });

      createdInvoices.push({ invoiceId: verificationCharge.invoice.id, paymentId: verificationCharge.payment.id });
    }

    await transaction.billingEvent.create({
      data: {
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        subscriptionId: subscription.id,
        type: BillingEventType.CHECKOUT_CREATED,
        provider: PaymentProvider.LOCAL,
        providerReference: checkoutReference,
        payload: toJsonValue({
          planCode: mapPlanCode(planCode),
          requiresVerificationFee,
          invoices: createdInvoices
        }),
        processedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        action: "billing.subscription.checkout_created",
        actorUserId: context.user.id,
        entityType: "subscription",
        entityId: subscription.id,
        metadata: {
          planCode: mapPlanCode(planCode),
          checkoutReference,
          requiresVerificationFee
        }
      }
    });

    return { subscription, createdInvoices };
  });

  return {
    data: {
      subscription: mapSubscriptionView(result.subscription),
      checkout: {
        reference: checkoutReference,
        provider: PaymentProvider.LOCAL.toLowerCase(),
        checkoutUrl: buildCheckoutUrl(checkoutReference),
        pendingPaymentIds: result.createdInvoices.map((item) => item.paymentId)
      } satisfies BillingCheckoutView
    }
  };
}

export async function updateCurrentSubscription(input: {
  userId: string;
  planCode: string;
}) {
  const { context, subscription } = await getStoredSubscription(input.userId);
  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  const targetPlanCode = normalizePlanCode(input.planCode);
  if (targetPlanCode === SubscriptionPlanCode.FREE) {
    throw new Error("FREE_PLAN_NOT_ALLOWED");
  }

  if (subscription.planCode === targetPlanCode && subscription.status === SubscriptionStatus.ACTIVE) {
    throw new Error("PLAN_ALREADY_ACTIVE");
  }

  const plan = getPlanDefinition(targetPlanCode);
  const checkoutReference = buildCheckoutReference("subchg");
  const now = new Date();
  const periodEnd = addBillingInterval(now, plan.interval, 1);

  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.subscription.update({
      where: { id: subscription.id },
      data: {
        planCode: targetPlanCode,
        interval: plan.interval,
        status: SubscriptionStatus.INCOMPLETE,
        checkoutReference,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        metadata: toJsonValue({ checkoutReference, source: "update_subscription", previousPlanCode: mapPlanCode(subscription.planCode) })
      }
    });

    const charge = await createPendingInvoicePayment({
      transaction,
      userId: context.user.id,
      businessProfileId: context.businessProfile.id,
      subscriptionId: updated.id,
      type: InvoiceType.SUBSCRIPTION,
      amountCents: plan.priceCents,
      description: `${plan.name} plan change checkout`,
      checkoutReference
    });

    await transaction.billingEvent.create({
      data: {
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        subscriptionId: updated.id,
        invoiceId: charge.invoice.id,
        paymentId: charge.payment.id,
        type: BillingEventType.SUBSCRIPTION_UPDATED,
        provider: PaymentProvider.LOCAL,
        providerReference: checkoutReference,
        payload: toJsonValue({
          previousPlanCode: mapPlanCode(subscription.planCode),
          nextPlanCode: mapPlanCode(targetPlanCode)
        }),
        processedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        action: "billing.subscription.updated",
        actorUserId: context.user.id,
        entityType: "subscription",
        entityId: updated.id,
        metadata: {
          previousPlanCode: mapPlanCode(subscription.planCode),
          nextPlanCode: mapPlanCode(targetPlanCode),
          checkoutReference
        }
      }
    });

    return { updated, paymentId: charge.payment.id };
  });

  return {
    data: {
      subscription: mapSubscriptionView(result.updated),
      checkout: {
        reference: checkoutReference,
        provider: PaymentProvider.LOCAL.toLowerCase(),
        checkoutUrl: buildCheckoutUrl(checkoutReference),
        pendingPaymentIds: [result.paymentId]
      } satisfies BillingCheckoutView
    }
  };
}

export async function cancelCurrentSubscription(userId: string) {
  const { context, subscription } = await getStoredSubscription(userId);
  if (!subscription) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  const now = new Date();
  const shouldEndNow = !subscription.currentPeriodEnd || subscription.currentPeriodEnd <= now || subscription.status !== SubscriptionStatus.ACTIVE;
  const canceled = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: !shouldEndNow,
        status: shouldEndNow ? SubscriptionStatus.CANCELED : subscription.status,
        canceledAt: shouldEndNow ? now : subscription.canceledAt
      }
    });

    await transaction.billingEvent.create({
      data: {
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        subscriptionId: subscription.id,
        type: BillingEventType.SUBSCRIPTION_CANCELED,
        provider: PaymentProvider.LOCAL,
        providerReference: subscription.checkoutReference,
        payload: toJsonValue({ cancelAtPeriodEnd: !shouldEndNow }),
        processedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        action: "billing.subscription.canceled",
        actorUserId: context.user.id,
        entityType: "subscription",
        entityId: subscription.id,
        metadata: {
          cancelAtPeriodEnd: !shouldEndNow,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null
        }
      }
    });

    return updated;
  });

  await notifyBillingResult({
    userId: context.user.id,
    title: "Subscription updated",
    body: shouldEndNow ? "Your subscription is now canceled." : "Your subscription will end at the current period close.",
    metadata: {
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: !shouldEndNow
    }
  });

  return mapSubscriptionView(canceled);
}

export async function listBillingInvoices(userId: string) {
  const { context } = await getStoredSubscription(userId);

  const invoices = await prisma.invoice.findMany({
    where: { businessProfileId: context.businessProfile.id },
    include: {
      payments: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return {
    data: invoices.map(mapInvoiceView),
    meta: {
      total: invoices.length
    }
  };
}

export async function createBoostCheckout(input: {
  userId: string;
  durationDays?: number;
}) {
  const { context, subscription } = await getStoredSubscription(input.userId);
  if (!subscription || !canPurchaseBoost({ planCode: subscription.planCode, status: subscription.status })) {
    throw new Error("BOOST_PLAN_NOT_ELIGIBLE");
  }

  const durationDays = Math.min(BOOST_MAX_DAYS, Math.max(BOOST_MIN_DAYS, Number(input.durationDays) || 7));
  const checkoutReference = buildCheckoutReference("boost");
  const amountCents = durationDays * BOOST_PRICE_PER_DAY_CENTS;

  const result = await prisma.$transaction(async (transaction) => {
    const boost = await transaction.boost.create({
      data: {
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        providerReference: checkoutReference,
        status: BoostStatus.PENDING,
        amountCents,
        currency: DEFAULT_CURRENCY
      }
    });

    const charge = await createPendingInvoicePayment({
      transaction,
      userId: context.user.id,
      businessProfileId: context.businessProfile.id,
      boostId: boost.id,
      type: InvoiceType.BOOST,
      amountCents,
      description: `Boost checkout for ${durationDays} day(s)`,
      checkoutReference
    });

    await transaction.billingEvent.create({
      data: {
        userId: context.user.id,
        businessProfileId: context.businessProfile.id,
        boostId: boost.id,
        invoiceId: charge.invoice.id,
        paymentId: charge.payment.id,
        type: BillingEventType.BOOST_CREATED,
        provider: PaymentProvider.LOCAL,
        providerReference: checkoutReference,
        payload: toJsonValue({ durationDays, amountCents }),
        processedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        action: "billing.boost.checkout_created",
        actorUserId: context.user.id,
        entityType: "boost",
        entityId: boost.id,
        metadata: {
          durationDays,
          amountCents,
          checkoutReference
        }
      }
    });

    return { boost, paymentId: charge.payment.id };
  });

  return {
    data: {
      boost: mapBoostView(result.boost),
      checkout: {
        reference: checkoutReference,
        provider: PaymentProvider.LOCAL.toLowerCase(),
        checkoutUrl: buildCheckoutUrl(checkoutReference),
        pendingPaymentIds: [result.paymentId]
      } satisfies BillingCheckoutView
    }
  };
}

export async function listCurrentBoosts(userId: string) {
  const { context } = await getStoredSubscription(userId);
  await expireElapsedBoosts(context.businessProfile.id);

  const boosts = await prisma.boost.findMany({
    where: {
      businessProfileId: context.businessProfile.id,
      status: { in: [BoostStatus.ACTIVE, BoostStatus.PENDING] }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return {
    data: boosts.map(mapBoostView),
    meta: {
      total: boosts.length,
      rankingBonusPerActiveBoost: BOOST_RANKING_BONUS
    }
  };
}

async function processSuccessfulPayment(event: BillingWebhookEnvelope) {
  const paymentId = event.data.paymentId;
  if (!paymentId) {
    throw new Error("PAYMENT_ID_REQUIRED");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
      subscription: true,
      boost: true
    }
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status === PaymentStatus.SUCCEEDED) {
    return { duplicate: true, businessProfileId: payment.businessProfileId, userId: payment.userId };
  }

  const paidAt = event.data.paidAt ? new Date(event.data.paidAt) : new Date();
  const updates = await prisma.$transaction(async (transaction) => {
    const updatedPayment = await transaction.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt,
        failedAt: null,
        providerPaymentId: event.data.providerPaymentId ?? payment.providerPaymentId,
        providerReference: event.data.providerReference ?? payment.providerReference,
        method: PaymentMethod.WEBHOOK,
        metadata: toJsonValue({ eventId: event.id, eventType: event.type })
      }
    });

    const updatedInvoice = await transaction.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt,
        failedAt: null,
        providerInvoiceId: event.data.providerReference ?? payment.invoice.providerInvoiceId
      }
    });

    let updatedSubscription = null as null | { id: string };
    if (payment.subscriptionId) {
      const currentPeriodStart = event.data.periodStart ? new Date(event.data.periodStart) : payment.subscription?.currentPeriodStart ?? paidAt;
      const currentPeriodEnd = event.data.periodEnd
        ? new Date(event.data.periodEnd)
        : addBillingInterval(currentPeriodStart, payment.subscription?.interval ?? BillingInterval.MONTH, 1);

      const subscription = await transaction.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startedAt: payment.subscription?.startedAt ?? paidAt,
          currentPeriodStart,
          currentPeriodEnd,
          delinquentAt: null
        }
      });

      updatedSubscription = { id: subscription.id };
    }

    let updatedBoost = null as null | { id: string };
    if (payment.boostId) {
      const startsAt = paidAt;
      const existingDays = payment.boost?.createdAt ? Math.max(BOOST_MIN_DAYS, Math.round(payment.invoice.amountCents / BOOST_PRICE_PER_DAY_CENTS)) : 7;
      const endsAt = addBillingInterval(startsAt, BillingInterval.ONE_TIME, existingDays);

      const boost = await transaction.boost.update({
        where: { id: payment.boostId },
        data: {
          status: BoostStatus.ACTIVE,
          startsAt,
          activatedAt: paidAt,
          endsAt,
          canceledAt: null
        }
      });

      updatedBoost = { id: boost.id };
    }

    await transaction.billingEvent.create({
      data: {
        userId: payment.userId,
        businessProfileId: payment.businessProfileId,
        subscriptionId: payment.subscriptionId,
        invoiceId: payment.invoiceId,
        paymentId: payment.id,
        boostId: payment.boostId,
        type: payment.boostId ? BillingEventType.BOOST_ACTIVATED : BillingEventType.PAYMENT_SUCCEEDED,
        provider: PaymentProvider.LOCAL,
        providerEventId: `${event.id}:processed`,
        providerReference: event.data.providerReference ?? payment.providerReference,
        payload: toJsonValue({ eventType: event.type }),
        processedAt: new Date()
      }
    });

    await transaction.auditLog.create({
      data: {
        action: payment.boostId ? "billing.boost.activated" : "billing.payment.succeeded",
        actorUserId: payment.userId,
        entityType: payment.boostId ? "boost" : "payment",
        entityId: payment.boostId ?? payment.id,
        metadata: {
          invoiceId: updatedInvoice.id,
          paymentId: updatedPayment.id,
          subscriptionId: payment.subscriptionId,
          boostId: payment.boostId,
          eventId: event.id
        }
      }
    });

    return {
      userId: payment.userId,
      businessProfileId: payment.businessProfileId,
      updatedSubscription,
      updatedBoost
    };
  });

  if (updates.updatedBoost?.id) {
    await syncBusinessSearchIndex(updates.businessProfileId);
  }

  await recordAnalyticsEvent({
    type: updates.updatedBoost?.id ? AnalyticsEventType.BOOST_ACTIVATED : AnalyticsEventType.SUBSCRIPTION_ACTIVATED,
    actorUserId: updates.userId,
    businessProfileId: updates.businessProfileId,
    metadata: {
      eventId: event.id,
      paymentId,
      subscriptionId: payment.subscriptionId,
      boostId: payment.boostId
    }
  });

  await notifyBillingResult({
    userId: updates.userId,
    title: "Payment confirmed",
    body: payment.boostId ? "Your boost is now active." : "Your subscription payment has been confirmed.",
    metadata: {
      eventId: event.id,
      paymentId,
      boostId: payment.boostId,
      subscriptionId: payment.subscriptionId
    }
  });

  return updates;
}

async function processFailedPayment(event: BillingWebhookEnvelope) {
  const paymentId = event.data.paymentId;
  if (!paymentId) {
    throw new Error("PAYMENT_ID_REQUIRED");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true,
      subscription: true,
      boost: true
    }
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  const failedAt = event.data.failedAt ? new Date(event.data.failedAt) : new Date();
  const updates = await prisma.$transaction(async (transaction) => {
    await transaction.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt,
        providerPaymentId: event.data.providerPaymentId ?? payment.providerPaymentId,
        providerReference: event.data.providerReference ?? payment.providerReference,
        method: PaymentMethod.WEBHOOK,
        metadata: toJsonValue({ eventId: event.id, eventType: event.type })
      }
    });

    await transaction.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.FAILED,
        failedAt
      }
    });

    if (payment.subscriptionId) {
      await transaction.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: SubscriptionStatus.PAST_DUE,
          delinquentAt: failedAt
        }
      });
    }

    if (payment.boostId) {
      await transaction.boost.update({
        where: { id: payment.boostId },
        data: {
          status: BoostStatus.CANCELED,
          canceledAt: failedAt
        }
      });
    }

    await transaction.billingEvent.create({
      data: {
        userId: payment.userId,
        businessProfileId: payment.businessProfileId,
        subscriptionId: payment.subscriptionId,
        invoiceId: payment.invoiceId,
        paymentId: payment.id,
        boostId: payment.boostId,
        type: BillingEventType.PAYMENT_FAILED,
        provider: PaymentProvider.LOCAL,
        providerEventId: `${event.id}:processed`,
        providerReference: event.data.providerReference ?? payment.providerReference,
        payload: toJsonValue({ eventType: event.type, eventReason: event.data.eventReason }),
        processedAt: new Date()
      }
    });

    return {
      userId: payment.userId,
      businessProfileId: payment.businessProfileId,
      hadBoost: Boolean(payment.boostId)
    };
  });

  if (updates.hadBoost) {
    await syncBusinessSearchIndex(updates.businessProfileId);
  }

  await notifyBillingResult({
    userId: updates.userId,
    title: "Payment failed",
    body: payment.boostId ? "Your boost payment failed and was canceled." : "Your subscription payment failed and the account is now past due.",
    metadata: {
      eventId: event.id,
      paymentId,
      boostId: payment.boostId,
      subscriptionId: payment.subscriptionId
    }
  });

  return updates;
}

export async function handleBillingWebhook(input: {
  payload: string;
  timestamp: string;
  signature: string;
}) {
  verifyBillingWebhookPayload(input.payload, input.timestamp, input.signature);
  const event = JSON.parse(input.payload) as BillingWebhookEnvelope;

  if (!event.id || !event.type) {
    throw new Error("WEBHOOK_PAYLOAD_INVALID");
  }

  const existingEvent = await prisma.billingEvent.findUnique({
    where: { providerEventId: event.id }
  });

  if (existingEvent) {
    return { received: true, duplicate: true };
  }

  await prisma.billingEvent.create({
    data: {
      providerEventId: event.id,
      type: BillingEventType.WEBHOOK_RECEIVED,
      provider: PaymentProvider.LOCAL,
      providerReference: event.type,
      payload: toJsonValue({
        apiVersion: event.apiVersion,
        createdAt: event.createdAt,
        data: event.data
      }),
      processedAt: new Date()
    }
  });

  if (event.type === "invoice.payment_succeeded") {
    await processSuccessfulPayment(event);
    return { received: true, duplicate: false };
  }

  if (event.type === "invoice.payment_failed") {
    await processFailedPayment(event);
    return { received: true, duplicate: false };
  }

  if (event.type === "customer.subscription.deleted" && event.data.subscriptionId) {
    await prisma.subscription.update({
      where: { id: event.data.subscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date()
      }
    });

    return { received: true, duplicate: false };
  }

  return { received: true, ignored: true };
}
