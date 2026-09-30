import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus =
  | "active" | "trialing" | "past_due" | "canceled" | "unpaid"
  | "incomplete" | "incomplete_expired" | "paused" | null;

type Subscription = {
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription>({
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription({ status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false });
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load subscription:", error);
      setSubscription({ status: null, currentPeriodEnd: null, cancelAtPeriodEnd: false });
    } else {
      setSubscription({
        status: (data?.status as SubscriptionStatus) ?? null,
        currentPeriodEnd: data?.current_period_end ?? null,
        cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const isPremium = subscription.status === "active" || subscription.status === "trialing";
  return { ...subscription, isPremium, loading: authLoading || loading, refresh };
}

async function openStripeFunction(functionName: string) {
  const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(functionName, { body: {} });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error ?? "Stripeの画面を開けませんでした");
  window.location.assign(data.url);
}

export const startCheckout = () => openStripeFunction("create-checkout-session");
export const openCustomerPortal = () => openStripeFunction("create-customer-portal");
