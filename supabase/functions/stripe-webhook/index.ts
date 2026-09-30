import Stripe from "npm:stripe@^22";
import { createServiceClient, jsonResponse, stripe } from "../_shared/stripe.ts";

const relevantEvents = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  let userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    const { data } = await supabase
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) throw new Error(`No user mapping for Stripe customer ${customerId}`);

  const raw = subscription as Stripe.Subscription & { current_period_end?: number };
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0]?.price.id ?? null,
    status: subscription.status,
    current_period_end: raw.current_period_end ? new Date(raw.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!signature || !webhookSecret) return jsonResponse({ error: "Webhook signature is missing" }, 400);

  try {
    const event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );

    if (!relevantEvents.has(event.type)) return jsonResponse({ received: true });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === "string") {
        await syncSubscription(await stripe.subscriptions.retrieve(session.subscription));
      }
    } else {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[stripe-webhook]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Webhook failed" }, 400);
  }
});
