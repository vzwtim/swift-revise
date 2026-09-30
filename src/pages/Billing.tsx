import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { FREE_QUESTIONS_PER_SUBJECT } from "@/lib/access";
import { openCustomerPortal, startCheckout, useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";

const priceLabel = import.meta.env.VITE_PREMIUM_PRICE_LABEL || "料金は決済画面で確認";

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, status, currentPeriodEnd, cancelAtPeriodEnd, loading, refresh } = useSubscription();
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return;
    let attempts = 0;
    const poll = window.setInterval(() => {
      attempts += 1;
      void refresh();
      if (attempts >= 5) window.clearInterval(poll);
    }, 1500);
    return () => window.clearInterval(poll);
  }, [refresh, searchParams]);

  const redirectToStripe = async (action: "checkout" | "portal") => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/billing")}`);
      return;
    }
    setRedirecting(true);
    try {
      await (action === "checkout" ? startCheckout() : openCustomerPortal());
    } catch (error) {
      toast({
        title: "Stripeを開けませんでした",
        description: error instanceof Error ? error.message : "しばらくしてからもう一度お試しください。",
        variant: "destructive",
      });
      setRedirecting(false);
    }
  };

  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("ja-JP") : null;
  const shouldUsePortal = !!status && !["canceled", "incomplete_expired"].includes(status);

  return (
    <div className="min-h-screen gradient-learning">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />戻る
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-8">
          <Badge className="mb-3 gap-1"><Crown className="h-3 w-3" />StudyFlow Premium</Badge>
          <h1 className="text-3xl font-bold mb-3">試験対策を、途中で止めない。</h1>
          <p className="text-muted-foreground">無料プランを試して、必要になったら全問題を解放できます。</p>
        </div>

        {searchParams.get("checkout") === "success" && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center">
            決済が完了しました。Premiumの反映には数秒かかることがあります。
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>無料プラン</CardTitle>
              <CardDescription>まず使い心地を確認したい方向け</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-3xl font-bold">¥0</div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />各科目{FREE_QUESTIONS_PER_SUBJECT}問まで</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />学習履歴・習熟度の保存</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />ランキング・掲示板</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Premium</CardTitle>
                {isPremium && <Badge>利用中</Badge>}
              </div>
              <CardDescription>すべての問題で本番対策</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-2xl font-bold">{priceLabel}</div>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />収録問題をすべて解放</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />まとめて学習・習熟度別復習を無制限</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary" />いつでもStripeから解約可能</li>
              </ul>

              {loading ? (
                <Button className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />確認中</Button>
              ) : isPremium ? (
                <>
                  <Button className="w-full" variant="outline" disabled={redirecting} onClick={() => void redirectToStripe("portal")}>
                    {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    契約・支払い方法を管理
                  </Button>
                  {periodEnd && (
                    <p className="text-xs text-center text-muted-foreground">
                      {cancelAtPeriodEnd ? `${periodEnd}まで利用できます` : `次回更新日: ${periodEnd}`}
                    </p>
                  )}
                </>
              ) : (
                <Button className="w-full gradient-primary" disabled={redirecting} onClick={() => void redirectToStripe(shouldUsePortal ? "portal" : "checkout")}>
                  {redirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {shouldUsePortal ? "支払い状況を確認" : user ? "Premiumを始める" : "ログインしてPremiumを始める"}
                </Button>
              )}
              {!isPremium && status === "past_due" && (
                <p className="text-xs text-center text-destructive">支払いを確認できません。契約管理画面から更新してください。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
