'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Search,
    TrendingUp,
    Layers,
    Settings
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { href: '/', label: 'Top', icon: <Home size={22} /> },
    { href: '/search', label: 'Search', icon: <Search size={22} /> },
    { href: '/ranking', label: 'Ranking', icon: <TrendingUp size={22} /> },
    { href: '/portfolio', label: 'Portfolio', icon: <Layers size={22} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={22} /> },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 safe-area-pb">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${isActive
                                ? 'text-amber-400'
                                : 'text-slate-500 active:text-slate-400'
                                }`}
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
