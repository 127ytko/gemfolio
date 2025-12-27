import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// This would come from your database/API
async function getSetData(slug: string) {
    const sets: Record<string, {
        name: string;
        code: string;
        releaseDate: string;
        cardCount: number;
        description: string;
        cards: { slug: string; name: string; cardNumber: string; rarity: string; ebayPrice: number }[];
    }> = {
        'op09': {
            name: 'Wings of the Captain',
            code: 'OP-09',
            releaseDate: '2024-11-29',
            cardCount: 121,
            description: 'The ninth booster pack featuring Manga Rare versions of popular characters.',
            cards: [
                { slug: 'op09-119-luffy-manga', name: 'Monkey D. Luffy', cardNumber: 'OP09-119', rarity: 'Manga Rare', ebayPrice: 180 },
                { slug: 'op09-120-shanks-sec', name: 'Shanks', cardNumber: 'OP09-120', rarity: 'SEC', ebayPrice: 140 },
            ],
        },
    };

    return sets[slug] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const set = await getSetData(slug);

    if (!set) {
        return { title: 'Set Not Found' };
    }

    return {
        title: `${set.name} (${set.code}) - Card List & Prices`,
        description: `View all ${set.cardCount} cards from ${set.name} (${set.code}). Check prices for Manga Rare, SEC, and Alt Art cards. Compare Japan vs eBay prices.`,
    };
}

export default async function SetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const set = await getSetData(slug);

    if (!set) {
        notFound();
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <div className="px-4 py-3">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </Link>
            </div>

            {/* Set Header */}
            <div className="px-4 mb-6">
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5">
                    <span className="text-xs text-amber-400 font-semibold">{set.code}</span>
                    <h1 className="text-xl font-black text-white mt-1">{set.name}</h1>
                    <p className="text-sm text-slate-400 mt-2">{set.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>{set.cardCount} cards</span>
                        <span>Released: {set.releaseDate}</span>
                    </div>
                </div>
            </div>

            {/* Card List */}
            <div className="px-4">
                <h2 className="text-sm font-semibold text-slate-400 mb-3">High Value Cards</h2>
                <div className="space-y-2">
                    {set.cards.map((card) => (
                        <Link
                            key={card.slug}
                            href={`/card/${card.slug}`}
                            className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white truncate">{card.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500">{card.cardNumber}</span>
                                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded">
                                        {card.rarity}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-amber-400">${card.ebayPrice}</span>
                                <ChevronRight size={16} className="text-slate-500" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Placeholder */}
            <div className="px-4 mt-6 pb-8">
                <div className="py-12 text-center border border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-500 text-sm">
                        Full card list coming soon
                    </p>
                </div>
            </div>
        </div>
    );
}
