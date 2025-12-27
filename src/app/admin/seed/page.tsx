'use client';

import { useState } from 'react';

export default function SeedPage() {
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seed', { method: 'POST' });
            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch (err) {
            setResult(`Error: ${err}`);
        }
        setLoading(false);
    };

    return (
        <div className="px-4 py-6 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-white mb-4">Seed Demo Data</h1>

            <button
                onClick={handleSeed}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg disabled:opacity-50"
            >
                {loading ? 'Seeding...' : 'Insert Demo Cards'}
            </button>

            {result && (
                <pre className="mt-4 p-4 bg-slate-800 rounded-lg text-sm text-slate-300 overflow-auto">
                    {result}
                </pre>
            )}
        </div>
    );
}
