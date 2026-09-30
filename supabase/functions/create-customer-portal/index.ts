import { createServiceClient, jsonResponse, optionsResponse, requireUser, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const user = await requireUser(req);
    const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
    if (!appUrl) throw new Error("アプリURLが設定されていません");

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (error || !data) throw new Error("Stripeの顧客情報が見つかりません");

    const portal = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${appUrl}/#/billing`,
    });
    return jsonResponse({ url: portal.url });
  } catch (error) {
    console.error("[create-customer-portal]", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "契約管理画面を開けませんでした" }, 400);
  }
});
