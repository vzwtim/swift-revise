import { createServiceClient, jsonResponse, optionsResponse, requireUser, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const user = await requireUser(req);
    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
    if (!priceId || !appUrl) throw new Error("Stripeの料金またはアプリURLが設定されていません");

    const supabase = createServiceClient();
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (["active", "trialing"].includes(existingSubscription?.status ?? "")) {
      return jsonResponse({ error: "すでにPremiumを利用中です" }, 409);
    }
    if (existingSubscription && !["canceled", "incomplete_expired"].includes(existingSubscription.status)) {
      return jsonResponse({ error: "契約管理画面で支払い状況を確認してください" }, 409);
    }

    const { data: customerRow, error: customerReadError } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (customerReadError) throw customerReadError;

    let customerId = customerRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      const { error } = await supabase.from("stripe_customers").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    const trialDays = Number(Deno.env.get("STRIPE_TRIAL_PERIOD_DAYS") ?? "0");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/#/billing?checkout=success`,
      cancel_url: `${appUrl}/#/billing?checkout=cancelled`,
      allow_promotion_codes: true,
      locale: "ja",
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
        ...(Number.isFinite(trialDays) && trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "決済を開始できませんでした" }, 400);
  }
});
