import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export interface CardData {
    slug: string;
    name: string;
    cardNumber: string;
    setName: string;
    rarity: string;
    imageUrl: string;
    japanPrice?: number;
    ebayPrice?: number;
    priceDiff?: number;
    ebayLink?: string;
}

interface CardTileProps {
    card: CardData;
    priority?: boolean;
}

export function CardTile({ card, priority = false }: CardTileProps) {
    const priceDiffPercent = card.japanPrice && card.ebayPrice
        ? Math.round(((card.ebayPrice - card.japanPrice) / card.japanPrice) * 100)
        : null;

    const isHotDeal = priceDiffPercent !== null && priceDiffPercent >= 30;

    return (
        <article className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
            <Link href={`/card/${card.slug}`} className="block">
                {/* Card Image */}
                <div className="card-image-container bg-slate-800">
                    <Image
                        src={card.imageUrl}
                        alt={`${card.name} - ${card.cardNumber}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                        className="object-contain"
                        priority={priority}
                    />
                    {/* Rarity Badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 text-slate-950 text-[10px] font-bold rounded">
                        {card.rarity}
                    </span>
                </div>

                {/* Card Info */}
                <div className="p-3">
                    <h3 className="text-sm font-semibold text-white truncate">
                        {card.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                        {card.cardNumber} · {card.setName}
                    </p>

                    {/* Price Comparison */}
                    {(card.japanPrice || card.ebayPrice) && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                                {card.japanPrice && (
                                    <span className="text-xs text-slate-500">
                                        JP: ¥{card.japanPrice.toLocaleString()}
                                    </span>
                                )}
                                {card.ebayPrice && (
                                    <span className="text-sm font-bold text-amber-400">
                                        ${card.ebayPrice.toLocaleString()}
                                    </span>
                                )}
                            </div>
                            {priceDiffPercent !== null && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${isHotDeal
                                        ? 'bg-green-500/20 text-green-400 price-badge-hot'
                                        : 'bg-slate-700 text-slate-300'
                                    }`}>
                                    {priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>

            {/* eBay Link */}
            {card.ebayLink && (
                <div className="px-3 pb-3">
                    <a
                        href={card.ebayLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors active:scale-[0.98]"
                    >
                        <ExternalLink size={14} />
                        Buy on eBay
                    </a>
                </div>
            )}

            {/* Disclaimer */}
            <p className="px-3 pb-2 text-[8px] text-slate-600 text-center">
                Image for reference only
            </p>
        </article>
    );
}
