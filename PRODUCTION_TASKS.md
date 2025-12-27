# 本番リリース後のタスク

## 認証・ブランディング

### Google OAuth 同意画面の更新
- [ ] アプリ名を正式名称に
- [ ] アプリロゴをアップロード
- [ ] ホームページURLを本番URLに変更
- [ ] プライバシーポリシーURLを設定
- [ ] 利用規約URLを設定

### Supabase カスタムドメイン（Pro プラン要）
- [ ] Supabase Proへアップグレード（$25/月）
- [ ] カスタムドメイン設定（例: auth.gemfolio.app）
- [ ] Google OAuthのリダイレクトURLを更新
- [ ] 環境変数を本番URLに更新

---

## 決済 (Stripe)

### Stripe アカウント設定
- [ ] Stripeアカウント作成（本番環境）
- [ ] 本番用APIキー取得
- [ ] Webhookエンドポイント設定

### 料金プラン設定
- [ ] Product作成: GemFolio Premium
- [ ] Price作成: $12/月（通常価格）
- [ ] Price作成: $8/月（期間限定価格）

### コード実装
- [ ] Stripe Checkout 連携
- [ ] Webhook処理（サブスク状態同期）
- [ ] subscriptions テーブル連携

### テスト
- [ ] テストモードで決済フロー確認
- [ ] サブスク開始・キャンセルのフロー確認

---

## その他

### 環境変数（本番用）
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### SEO・アナリティクス
- [ ] Google Analytics 設定
- [ ] Google Search Console 登録
- [ ] OGP画像設定
