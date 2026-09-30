# Stripeサブスクリプション設定

無料ユーザーは各科目10問まで、Stripeの契約状態が `active` または `trialing` のユーザーは全問題を利用できます。

## 1. Stripeで商品と月額Priceを作る

Stripe Dashboardのテストモードで商品と月額料金を作成し、`price_...` から始まるPrice IDを控えます。画面表示用の `VITE_PREMIUM_PRICE_LABEL` も同額にします。

## 2. Supabaseを反映する

```bash
npx supabase link --project-ref sjzkmnmcqrktaknbdmgq
npx supabase db push
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-customer-portal
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Edge FunctionsのSecretsを設定します。`APP_URL` は末尾の `/` を付けない本番URLです。

```bash
npx supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_PRICE_ID=price_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  APP_URL=https://YOUR_APP.example.com
```

無料体験を付ける場合だけ日数を追加します。

```bash
npx supabase secrets set STRIPE_TRIAL_PERIOD_DAYS=7
```

## 3. Stripe Webhookを登録する

```text
https://sjzkmnmcqrktaknbdmgq.supabase.co/functions/v1/stripe-webhook
```

購読イベント：

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

発行された署名シークレットを `STRIPE_WEBHOOK_SECRET` に設定します。

## 4. Customer Portalを有効にする

Stripe DashboardのCustomer Portal設定で、支払い方法の変更とサブスクリプション解約を有効にします。

## 5. テストする

Stripeのテストカード `4242 4242 4242 4242`、任意の未来日、有効な3桁CVCで購入します。

1. 未契約状態で各科目が10問に制限される
2. Checkout完了後、数秒でPremium表示になる
3. 全問題が出題される
4. Customer Portalから解約予約できる
5. 解約予約後も契約期間末までは全問題を利用できる
6. 契約期間終了後は無料枠へ戻る

## セキュリティ上の境界

Stripe秘密鍵はEdge Functionsだけが読み、ブラウザには配布しません。契約テーブルはRLSにより本人が自分の状態を読むだけで、更新はservice-roleを使うWebhookに限定しています。

現在の問題本文はViteのCSVバンドルに含まれるため、この段階の問題数制限は通常利用に対するUI制御です。本文自体を秘匿するには、問題データをSupabaseへ移し、権限確認済みのEdge Function経由で配信する追加改修が必要です。
