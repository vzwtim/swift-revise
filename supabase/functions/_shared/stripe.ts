import Stripe from "npm:stripe@^22";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");

export const createServiceClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

export async function requireUser(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new Error("認証が必要です");

  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data: { user }, error } = await createServiceClient().auth.getUser(token);
  if (error || !user) throw new Error("有効なログイン情報を確認できませんでした");
  return user;
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

export function optionsResponse() {
  return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}
