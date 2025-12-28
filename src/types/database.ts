// Database Types for Supabase Tables
// Based on GemFolio UI Requirements - Updated 2024-12-25

// =============================================================================
// Card Table (cards) - カードマスター
// =============================================================================
export interface Card {
    card_id: string;                    // Primary Key (UUID)
    card_number: string;                // e.g., "OP09-119"
    slug: string;                       // URL-friendly identifier

    // Names (Bilingual)
    name_ja: string;                    // Japanese name
    name_en: string;                    // English name

    // Set Info (Bilingual)
    set_name_ja: string;                // Set name in Japanese
    set_name_en: string;                // Set name in English

    // Rarity (Bilingual)
    rarity_ja: string;                  // Rarity in Japanese (マンガレア, etc.)
    rarity_en: string;                  // Rarity in English (Manga Rare, SEC, etc.)

    // Image
    image_url: string | null;           // External image URL

    // Scraping Sources - Raw (3 sites)
    scrape_url_raw_1: string | null;
    scrape_url_raw_2: string | null;
    scrape_url_raw_3: string | null;

    // Scraping Sources - PSA10 (3 sites)
    scrape_url_psa10_1: string | null;
    scrape_url_psa10_2: string | null;
    scrape_url_psa10_3: string | null;

    // Individual Raw Prices from each source (USD)
    price_raw_1: number | null;
    price_raw_2: number | null;
    price_raw_3: number | null;

    // Individual PSA10 Prices from each source (USD)
    price_psa10_1: number | null;
    price_psa10_2: number | null;
    price_psa10_3: number | null;

    // Calculated Raw Prices (USD)
    price_raw_avg: number | null;       // Average Raw price
    price_raw_low: number | null;       // Lowest Raw price
    price_raw_high: number | null;      // Highest Raw price

    // Calculated PSA10 Prices (USD)
    price_psa10_avg: number | null;     // Average PSA10 price
    price_psa10_low: number | null;     // Lowest PSA10 price
    price_psa10_high: number | null;    // Highest PSA10 price

    // Price Changes (Weekly %)
    price_raw_change_weekly: number | null;     // Raw price change %
    price_psa10_change_weekly: number | null;   // PSA10 price change %

    // Timestamps
    updated_at: string;                 // ISO timestamp
    created_at: string;                 // ISO timestamp
}

// Simplified Card type for listings/grids
export interface CardSummary {
    card_id: string;
    slug: string;
    card_number: string;
    name_ja: string;
    name_en: string;
    set_name_ja: string;
    set_name_en: string;
    rarity_ja: string;
    rarity_en: string;
    image_url: string | null;
    price_raw_avg: number | null;
    price_psa10_avg: number | null;
    price_raw_change_weekly: number | null;
}

// Card for display with language support
export interface CardDisplay {
    card_id: string;
    slug: string;
    card_number: string;
    name: string;                       // Either name_ja or name_en based on language
    set_name: string;                   // Either set_name_ja or set_name_en
    rarity: string;                     // Either rarity_ja or rarity_en
    image_url: string | null;
    price_raw_avg: number | null;
    price_psa10_avg: number | null;
    price_change: number | null;
}

// =============================================================================
// Market Prices - Raw (market_prices_raw) - Raw価格履歴
// =============================================================================
export interface MarketPriceRaw {
    id: string;                         // Primary Key (UUID)
    card_id: string;                    // Foreign Key to cards
    price_avg: number;                  // Average price at recorded time
    price_low: number | null;           // Low price
    price_high: number | null;          // High price
    recorded_at: string;                // ISO timestamp
}

// =============================================================================
// Market Prices - PSA10 (market_prices_psa10) - PSA10価格履歴
// =============================================================================
export interface MarketPricePSA10 {
    id: string;                         // Primary Key (UUID)
    card_id: string;                    // Foreign Key to cards
    price_avg: number;                  // Average PSA10 price at recorded time
    price_low: number | null;           // Low price
    price_high: number | null;          // High price
    recorded_at: string;                // ISO timestamp
}

// Union type for price history
export type MarketPrice = MarketPriceRaw | MarketPricePSA10;

// Price data point for charts
export interface PriceDataPoint {
    date: string;
    price: number;
}

// =============================================================================
// Portfolios Table (portfolios) - ユーザーポートフォリオ
// =============================================================================
export interface Portfolio {
    id: string;                         // Primary Key (UUID)
    user_id: string;                    // Foreign Key to auth.users
    card_id: string;                    // Foreign Key to cards
    condition: CardCondition;           // Card condition
    quantity: number;                   // Number of cards owned
    purchase_price: number;             // User's purchase price (USD)
    purchase_date: string | null;       // Purchase date (ISO date)
    created_at: string;                 // ISO timestamp
    updated_at: string;                 // ISO timestamp
}

export type CardCondition =
    | 'RAW'         // Ungraded (Raw/Mint)
    | 'PSA10'       // PSA Gem Mint 10
    | 'PSA9'        // PSA Mint 9
    | 'PSA8'        // PSA Near Mint 8
    | 'BGS10'       // BGS Pristine 10
    | 'BGS9.5'      // BGS Gem Mint 9.5
    | 'CGC10'       // CGC Perfect 10
    | 'OTHER';      // Other grading

// Portfolio with joined Card data
export interface PortfolioWithCard extends Portfolio {
    card: CardSummary;
}

// Portfolio entry for UI display
export interface PortfolioEntry {
    entry_id: string;
    card_id: string;
    card_number: string;
    name_ja: string;
    name_en: string;
    set_name_ja: string;
    set_name_en: string;
    rarity_en: string;
    image_url: string | null;
    condition: CardCondition;
    quantity: number;
    purchase_price: number;
    purchase_date: string | null;
    current_price: number;              // Current market price based on condition
    profit: number;                     // Current value - purchase price
    profit_percent: number;             // Profit percentage
}

// =============================================================================
// Favorites Table (favorites) - お気に入り
// =============================================================================
export interface Favorite {
    id: string;                         // Primary Key (UUID)
    user_id: string;                    // Foreign Key to auth.users
    card_id: string;                    // Foreign Key to cards
    created_at: string;                 // ISO timestamp
}

// Favorite with Card data
export interface FavoriteWithCard extends Favorite {
    card: CardSummary;
}

// =============================================================================
// Profiles Table (profiles) - ユーザープロフィール
// =============================================================================
export interface Profile {
    id: string;                         // Primary Key (UUID), same as auth.users.id
    username: string | null;
    avatar_url: string | null;
    currency_preference: CurrencyCode;
    language_preference: LanguageCode;
    email_notifications: boolean;
    created_at: string;
    updated_at: string;
}

export type CurrencyCode = 'USD' | 'JPY' | 'EUR' | 'GBP';
export type LanguageCode = 'en' | 'ja';

// =============================================================================
// Subscriptions Table (subscriptions) - サブスクリプション
// =============================================================================
export interface Subscription {
    id: string;                         // Primary Key (UUID)
    user_id: string;                    // Foreign Key to auth.users
    tier: SubscriptionTier;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    status: SubscriptionStatus;
    created_at: string;
    updated_at: string;
}

export type SubscriptionTier = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

// =============================================================================
// Exchange Rates Table (exchange_rates) - 為替レート
// =============================================================================
export interface ExchangeRate {
    id: string;
    base_currency: CurrencyCode;
    target_currency: CurrencyCode;
    rate: number;
    recorded_at: string;
}

// =============================================================================
// Database Schema Type (for Supabase client)
// =============================================================================
export interface Database {
    public: {
        Tables: {
            cards: {
                Row: Card;
                Insert: Omit<Card, 'card_id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Card, 'card_id' | 'created_at'>>;
            };
            market_prices_raw: {
                Row: MarketPriceRaw;
                Insert: Omit<MarketPriceRaw, 'id'>;
                Update: Partial<Omit<MarketPriceRaw, 'id'>>;
            };
            market_prices_psa10: {
                Row: MarketPricePSA10;
                Insert: Omit<MarketPricePSA10, 'id'>;
                Update: Partial<Omit<MarketPricePSA10, 'id'>>;
            };
            portfolios: {
                Row: Portfolio;
                Insert: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Portfolio, 'id' | 'user_id' | 'created_at'>>;
            };
            favorites: {
                Row: Favorite;
                Insert: Omit<Favorite, 'id' | 'created_at'>;
                Update: never;  // Favorites are not updated, only inserted/deleted
            };
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
            };
            subscriptions: {
                Row: Subscription;
                Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at'>>;
            };
            exchange_rates: {
                Row: ExchangeRate;
                Insert: Omit<ExchangeRate, 'id'>;
                Update: Partial<Omit<ExchangeRate, 'id'>>;
            };
        };
    };
}

// =============================================================================
// API Response Types
// =============================================================================
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiError {
    message: string;
    code?: string;
}

// =============================================================================
// Dashboard / Analytics Types
// =============================================================================
export interface PortfolioSummary {
    total_items: number;
    total_quantity: number;
    total_cost: number;
    total_value: number;
    total_profit: number;
    profit_percent: number;
    today_change: number;
    today_change_percent: number;
}

export interface TopPerformer {
    card_id: string;
    slug: string;
    card_number: string;
    name_ja: string;
    name_en: string;
    image_url: string | null;
    price_avg: number;
    price_change_weekly: number;
    condition: 'RAW' | 'PSA10';
}

// =============================================================================
// User Profiles Table - ユーザープロファイル
// =============================================================================
export interface UserProfile {
    id: string;
    user_id: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
}
