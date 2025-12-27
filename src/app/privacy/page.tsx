'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const { language } = useLanguage();

    const content = language === 'ja' ? {
        title: 'プライバシーポリシー',
        lastUpdated: '最終更新日: 2025年12月25日',
        disclaimer: '※本ポリシーは参考資料です。正式な運用前に必ず法律の専門家にご確認ください。',
        sections: [
            {
                title: '1. はじめに',
                content: `GemFolio（以下「当サービス」）は、ユーザーの皆様のプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、当サービスがどのような情報を収集し、どのように使用・保護するかを説明しています。`
            },
            {
                title: '2. 収集する情報',
                content: `当サービスでは、以下の情報を収集する場合があります。

• アカウント情報：メールアドレス、ユーザー名（アカウント作成時）
• コレクション情報：カードの保有情報、購入価格、取得日
• 利用状況：アクセスログ、IPアドレス、デバイス情報、ブラウザ情報
• 設定情報：言語設定、通知設定
• クッキー：サービス改善のための分析データ`
            },
            {
                title: '3. 情報の利用目的',
                content: `当サービスで収集した情報は、以下の目的で使用します。

• サービスの提供・運営・改善
• カードの価格情報の提供
• ポートフォリオ管理機能の提供
• サービスに関するお知らせの送信（通知をONにした場合）
• 利用状況の分析・統計`
            },
            {
                title: '4. 情報の共有・第三者提供',
                content: `当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に販売・共有することはありません。

• ユーザーの同意がある場合
• 法令に基づく開示請求があった場合
• サービス提供に必要な業務委託先への提供（機密保持契約を締結）
• 事業譲渡の場合（事前に通知いたします）`
            },
            {
                title: '5. 外部サービス',
                content: `当サービスでは、以下の外部サービスを利用する場合があります。

• 決済処理（Stripe等）：クレジットカード情報は当サービスでは保存しません
• 分析ツール（Google Analytics等）：利用状況の分析
• プッシュ通知サービス

これらのサービスには、各社のプライバシーポリシーが適用されます。`
            },
            {
                title: '6. 免責事項',
                content: `当サービスで提供する価格情報やデータは、参考情報として提供しており、その正確性、完全性、最新性を保証するものではありません。価格データは外部ソースから取得しており、実際の取引価格と異なる場合があります。当サービスの情報を参考にした売買・投資判断により発生した損失について、当サービスは一切の責任を負いません。`
            },
            {
                title: '7. ポリシーの変更',
                content: `本ポリシーは予告なく変更される場合があります。重要な変更がある場合は、サービス内でお知らせします。変更後もサービスを継続して利用された場合、変更後のポリシーに同意したものとみなします。`
            },
            {
                title: '8. お問い合わせ',
                content: `当サービスに関するご質問やご要望は、以下までお問い合わせください。

メール: privacy@gemfolio.app
※対応言語：日本語・英語`
            }
        ]
    } : {
        title: 'Privacy Policy',
        lastUpdated: 'Last Updated: December 25, 2025',
        disclaimer: '※ This policy is for reference purposes. Please consult with a legal professional before official implementation.',
        sections: [
            {
                title: '1. Introduction',
                content: `GemFolio ("the Service") respects user privacy and is committed to protecting personal information. This Privacy Policy explains what information we collect, how we use it, and how we protect it.`
            },
            {
                title: '2. Information We Collect',
                content: `We may collect the following types of information:

• Account Information: Email address, username (when creating an account)
• Collection Data: Card holdings, purchase prices, acquisition dates
• Usage Data: Access logs, IP address, device information, browser information
• Settings: Language preferences, notification settings
• Cookies: Analytics data for service improvement`
            },
            {
                title: '3. How We Use Your Information',
                content: `We use collected information for the following purposes:

• Providing, operating, and improving the Service
• Providing card price information
• Providing portfolio management features
• Customer support
• Sending service-related notifications (if enabled)
• Usage analysis and statistics`
            },
            {
                title: '4. Information Sharing',
                content: `We do not sell or share your personal information with third parties except in the following cases:

• With your consent
• When required by law
• With service providers under confidentiality agreements
• In case of business transfer (with prior notice)`
            },
            {
                title: '5. Third-Party Services',
                content: `We may use the following third-party services:

• Payment processing (Stripe, etc.): Credit card information is not stored by us
• Analytics tools (Google Analytics, etc.): Usage analysis
• Push notification services

These services are governed by their respective privacy policies.`
            },
            {
                title: '6. Disclaimer',
                content: `The price information and data provided by this Service are for reference purposes only. We do not guarantee their accuracy, completeness, or timeliness. Price data is obtained from external sources and may differ from actual transaction prices. We are not responsible for any losses incurred from buying, selling, or investment decisions based on information from this Service.`
            },
            {
                title: '7. Policy Changes',
                content: `This Policy may be updated without prior notice. Significant changes will be announced within the Service. Continued use after changes constitutes acceptance of the updated Policy.`
            },
            {
                title: '8. Contact Us',
                content: `For questions or requests regarding this Service, please contact:

Email: privacy@gemfolio.app
Languages: Japanese, English`
            }
        ]
    };

    return (
        <div className="px-4 py-6 max-w-3xl mx-auto">
            {/* Header */}
            <section className="mb-6">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <Shield size={24} className="text-amber-400" />
                    {content.title}
                </h1>
            </section>

            {/* Policy Content */}
            <div className="space-y-6">
                {content.sections.map((section, index) => (
                    <section key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                        <h2 className="text-sm font-semibold text-white mb-2">{section.title}</h2>
                        <div className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">
                            {section.content}
                        </div>
                    </section>
                ))}
            </div>

            {/* Last Updated */}
            <div className="mt-6 text-right">
                <p className="text-xs text-slate-500">{content.lastUpdated}</p>
            </div>

            {/* Back to Settings */}
            <div className="mt-4 text-center">
                <a
                    href="/settings"
                    className="text-xs text-amber-400 hover:text-amber-300"
                >
                    ← {language === 'ja' ? '設定に戻る' : 'Back to Settings'}
                </a>
            </div>
        </div>
    );
}
