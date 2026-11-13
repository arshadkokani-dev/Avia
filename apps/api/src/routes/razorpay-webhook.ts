import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

const router = Router();

type RazorpaySubscriptionEntity = {
  id: string;
  plan_id?: string;
  status?: string;
  current_start?: number | null;
  current_end?: number | null;
};

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
  };
};

function verifyWebhookSignature(
  body: Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function unixToDate(value?: number | null): Date | undefined {
  if (typeof value !== "number" || value <= 0) {
    return undefined;
  }

  return new Date(value * 1000);
}

// Receive and verify Razorpay subscription events.
router.post("/", async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret) {
    console.error("Razorpay webhook secret is not configured.");
    res.status(500).json({ error: "Webhook is not configured." });
    return;
  }

  if (!Buffer.isBuffer(req.body) || typeof signature !== "string") {
    res.status(400).json({ error: "Invalid webhook request." });
    return;
  }

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    res.status(400).json({ error: "Invalid webhook signature." });
    return;
  }

  try {
    const event = JSON.parse(
      req.body.toString("utf8")
    ) as RazorpayWebhookPayload;

    const eventName = event.event;
    const subscription = event.payload?.subscription?.entity;

    if (!eventName || !subscription?.id) {
      res.status(400).json({ error: "Invalid webhook payload." });
      return;
    }

    const existing = await prisma.subscription.findUnique({
      where: { razorpaySubscriptionId: subscription.id },
    });

    if (!existing) {
      console.warn(
        "Received Razorpay event for an unknown subscription:",
        subscription.id
      );

      res.status(200).json({ received: true, ignored: true });
      return;
    }

    const currentPeriodStart = unixToDate(subscription.current_start);
    const currentPeriodEnd = unixToDate(subscription.current_end);

    const periodUpdates = {
      ...(currentPeriodStart ? { currentPeriodStart } : {}),
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    };

    switch (eventName) {
      case "subscription.activated":
      case "subscription.charged":
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "PRO",
            status: "ACTIVE",
            ...periodUpdates,
          },
        });
        break;

      case "subscription.cancelled":
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "PRO",
            status: "CANCELLED",
            ...periodUpdates,
          },
        });
        break;

      case "subscription.completed":
      case "subscription.halted":
      case "subscription.expired":
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "FREE",
            status: "EXPIRED",
            ...periodUpdates,
          },
        });
        break;

      case "subscription.pending":
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "FREE",
            status: "PENDING",
            ...periodUpdates,
          },
        });
        break;

      default:
        console.log("Razorpay event received but not processed:", eventName);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed." });
  }
});

export default router;