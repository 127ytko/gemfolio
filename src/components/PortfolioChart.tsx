'use client';

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

// Extended demo chart data
const chartData = [
    { date: '10/1', value: 1200, items: 5 },
    { date: '10/8', value: 1300, items: 5 },
    { date: '10/15', value: 1400, items: 6 },
    { date: '10/22', value: 1350, items: 6 },
    { date: '11/1', value: 1500, items: 7 },
    { date: '11/8', value: 1600, items: 7 },
    { date: '11/15', value: 1700, items: 8 },
    { date: '11/22', value: 1650, items: 8 },
    { date: '12/1', value: 1800, items: 8 },
    { date: '12/8', value: 2000, items: 9 },
    { date: '12/15', value: 2200, items: 10 },
    { date: '12/22', value: 2450, items: 12 },
];

export default function PortfolioChart() {
    const barWidth = 32;
    const chartWidth = chartData.length * barWidth;

    // Y-axis labels
    const leftLabels = ['0', '1k', '2k', '3k'];
    const rightLabels = ['0', '5', '10', '15'];

    return (
        <div className="relative h-full flex">
            {/* Fixed Left Y-Axis (HTML) */}
            <div className="w-6 flex-shrink-0 h-full flex flex-col justify-between pr-1 pb-5">
                {[...leftLabels].reverse().map((label, i) => (
                    <span key={i} className="text-[8px] text-amber-400/70 text-right leading-none">
                        {label}
                    </span>
                ))}
            </div>

            {/* Scrollable Chart Area */}
            <div
                className="flex-1 overflow-x-auto scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div style={{ width: chartWidth, height: '100%', minHeight: 90 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 7, dy: 5 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                                tickLine={false}
                                interval={0}
                                height={28}
                                angle={-45}
                                textAnchor="end"
                            />
                            <YAxis yAxisId="left" domain={[0, 3000]} hide />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 15]} hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                    borderRadius: '6px',
                                    fontSize: '9px',
                                    padding: '4px 8px',
                                }}
                                labelStyle={{ color: 'white', marginBottom: '2px' }}
                                formatter={(value, name) => {
                                    if (name === 'Value') {
                                        // Demo data hardcoded in USD, so just converting logic conceptually
                                        // In real implementation, data should be fetched in correct currency
                                        return [`$${Number(value).toLocaleString()}`, 'Value'];
                                    }
                                    return [value, 'Items'];
                                }}
                            />
                            <Bar
                                yAxisId="left"
                                dataKey="value"
                                fill="rgba(251, 191, 36, 0.7)"
                                radius={[2, 2, 0, 0]}
                                name="Value"
                                barSize={16}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="items"
                                stroke="#22d3ee"
                                strokeWidth={1.5}
                                dot={{ fill: '#22d3ee', strokeWidth: 0, r: 2 }}
                                name="Items"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Fixed Right Y-Axis (HTML) */}
            <div className="w-4 flex-shrink-0 h-full flex flex-col justify-between pl-1 pb-5">
                {[...rightLabels].reverse().map((label, i) => (
                    <span key={i} className="text-[8px] text-cyan-400/70 text-left leading-none">
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}
