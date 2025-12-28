'use client';

import { useState, useEffect } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getPortfolioHistory, PortfolioHistoryPoint } from '@/lib/api/portfolioHistory';
import { Loader2 } from 'lucide-react';
import { useExchangeRate } from '@/context/ExchangeRateContext';

export default function PortfolioChart() {
    const { user } = useAuth();
    const { language } = useLanguage();
    const { convertPrice } = useExchangeRate(); // Used only for formatting if needed, but API handles values
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const currencySymbol = language === 'ja' ? '¥' : '$';

    useEffect(() => {
        async function loadHistory() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // API returns correct currency values based on parameter
                const history = await getPortfolioHistory(
                    user.id,
                    30, // Last 30 days
                    language === 'ja' ? 'JPY' : 'USD'
                );

                if (history && history.length > 0) {
                    const mappedData = history.map(item => ({
                        date: new Date(item.recorded_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
                        value: item.total_value,
                        items: item.total_items
                    }));
                    setData(mappedData);
                } else {
                    setData([]);
                }
            } catch (error) {
                console.error('Failed to load portfolio chart data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [user, language]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={24} className="text-amber-400 animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p className="text-xs">{language === 'ja' ? 'データがありません' : 'No data available'}</p>
                <p className="text-[10px] mt-1 opacity-70">
                    {language === 'ja' ? '明日以降に更新されます' : 'Check back tomorrow'}
                </p>
            </div>
        );
    }

    // Calculate Y-Axis Domains and Labels
    const maxValue = Math.max(...data.map(d => d.value), 100);
    const maxItems = Math.max(...data.map(d => d.items), 5);

    // Add 10-20% padding
    const yDomainMax = Math.ceil(maxValue * 1.1);
    const yRightDomainMax = Math.ceil(maxItems * 1.2);

    // Generate labels (0, 1/3, 2/3, 1)
    const generateLabels = (max: number, count: number = 3) => {
        const labels = [];
        for (let i = 0; i <= count; i++) {
            const val = (max / count) * i;
            if (val >= 1000) {
                labels.push(`${(val / 1000).toFixed(1).replace(/\.0$/, '')}k`);
            } else {
                labels.push(Math.round(val).toString());
            }
        }
        return labels;
    };

    const leftLabels = generateLabels(yDomainMax, 3);
    const rightLabels = generateLabels(yRightDomainMax, 3);

    const barWidth = 32;
    const chartWidth = Math.max(data.length * barWidth, 300); // Minimum width to look good

    return (
        <div className="relative h-full flex">
            {/* Fixed Left Y-Axis (Value) */}
            <div className="w-8 flex-shrink-0 h-full flex flex-col justify-between pr-1 pb-6 pt-1">
                {[...leftLabels].reverse().map((label, i) => (
                    <span key={i} className="text-[8px] text-amber-400/70 text-right leading-none truncate">
                        {label}
                    </span>
                ))}
            </div>

            {/* Scrollable Chart Area */}
            <div
                className="flex-1 overflow-x-auto scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div style={{ width: data.length > 10 ? chartWidth : '100%', height: '100%', minHeight: 90 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 8, dy: 5 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                                tickLine={false}
                                interval={0}
                                height={24}
                            // angle={-45}
                            // textAnchor="end"
                            />
                            <YAxis yAxisId="left" domain={[0, yDomainMax]} hide />
                            <YAxis yAxisId="right" orientation="right" domain={[0, yRightDomainMax]} hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    padding: '6px 10px',
                                }}
                                itemStyle={{ padding: 0 }}
                                labelStyle={{ color: 'white', marginBottom: '4px', fontWeight: 'bold' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                formatter={(value: any, name: any) => {
                                    if (name === 'Value') return [`${currencySymbol}${Number(value).toLocaleString()}`, language === 'ja' ? '評価額' : 'Value'];
                                    if (name === 'Items') return [`${value}`, language === 'ja' ? '枚数' : 'Items'];
                                    return [value, name];
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="value"
                                fill="rgba(251, 191, 36, 0.8)"
                                radius={[2, 2, 0, 0]}
                                name="Value"
                                barSize={16}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="items"
                                stroke="#22d3ee"
                                strokeWidth={2}
                                dot={{ fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 1.5, r: 3 }}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                                name="Items"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Fixed Right Y-Axis (Items) */}
            <div className="w-5 flex-shrink-0 h-full flex flex-col justify-between pl-1 pb-6 pt-1">
                {[...rightLabels].reverse().map((label, i) => (
                    <span key={i} className="text-[8px] text-cyan-400/70 text-left leading-none">
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
