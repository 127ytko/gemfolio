import type { Metadata } from 'next';
import { Settings, Globe, Bell, Shield, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Manage your GemFolio settings, language preferences, and notifications.',
};

const settingItems = [
    { icon: Globe, label: 'Language', value: 'English', href: '#' },
    { icon: Bell, label: 'Notifications', value: 'Off', href: '#' },
    { icon: Shield, label: 'Privacy', value: '', href: '#' },
    { icon: HelpCircle, label: 'Help & Support', value: '', href: '#' },
];

export default function SettingPage() {
    return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
            {/* Header */}
            <section className="mb-6">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <Settings size={24} className="text-amber-400" />
                    Settings
                </h1>
            </section>

            {/* Settings List */}
            <div className="space-y-2">
                {settingItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} className="text-slate-400" />
                            <span className="text-sm font-medium text-white">{item.label}</span>
                        </div>
                        {item.value && (
                            <span className="text-sm text-slate-500">{item.value}</span>
                        )}
                    </Link>
                ))}
            </div>

            {/* App Info */}
            <section className="mt-8 pt-6 border-t border-slate-800">
                <div className="text-center text-sm text-slate-500">
                    <p>GemFolio v1.0.0</p>
                    <p className="mt-1">
                        <Link href="#" className="text-amber-400 hover:underline">Terms</Link>
                        {' · '}
                        <Link href="#" className="text-amber-400 hover:underline">Privacy</Link>
                    </p>
                </div>
            </section>
        </div>
    );
}
