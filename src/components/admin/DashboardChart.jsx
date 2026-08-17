'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

export default function DashboardChart({ initialData = [], initialPeriod = 'monthly' }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(Array.isArray(initialData) ? initialData : []);
  const [isLoading, setIsLoading] = useState(!(initialPeriod === 'monthly' && Array.isArray(initialData) && initialData.length > 0));

  useEffect(() => {
    async function fetchChart() {
      if (period === initialPeriod && Array.isArray(initialData) && initialData.length > 0) {
        setData(initialData);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/chart?period=${period}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch chart data (${res.status})`);
        }
        const result = await res.json();
        if (result.success) {
          setData(result.data || []);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChart();
  }, [initialData, initialPeriod, period]);

  const totalPeriodRevenue = data.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0);
  const totalPeriodOrders = data.reduce((acc, curr) => acc + (Number(curr.orders) || 0), 0);

  return (
    <div className="flex h-full flex-col w-full min-h-[260px]">
      {/* Clean Single Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            <h2 className="text-[13px] font-bold text-slate-900">Revenue Performance</h2>
          </div>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Total: <span className="font-semibold text-slate-900">PKR {totalPeriodRevenue.toLocaleString('en-PK')}</span>
            <span className="mx-1.5">•</span>
            <span className="font-medium text-slate-700">{totalPeriodOrders} Orders</span>
          </p>
        </div>

        {/* Toggle Pills */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 self-start sm:self-auto">
          {['weekly', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-black/5 font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative flex-1 min-h-[190px] w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs z-10">
            <Loader2 className="size-5 animate-spin text-emerald-600" />
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 z-10">
            No data available for selected period
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="emeraldRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={24}
              className="text-[11px] font-medium fill-slate-500"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={45}
              tickFormatter={(value) => {
                if (value === 0) return '0';
                if (value >= 1000) return `${value / 1000}k`;
                return `${value}`;
              }}
              className="text-[11px] font-medium fill-slate-500"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const revenueVal = payload[0]?.payload?.revenue || 0;
                const ordersVal = payload[0]?.payload?.orders || 0;
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-md text-xs space-y-1">
                    <p className="font-bold text-slate-800 border-b border-gray-100 pb-1">{label}</p>
                    <div className="flex items-center justify-between gap-4 text-emerald-700 font-semibold">
                      <span>Revenue:</span>
                      <span>PKR {Number(revenueVal).toLocaleString('en-PK')}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600 font-medium">
                      <span>Orders:</span>
                      <span>{ordersVal} orders</span>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#emeraldRevenueGradient)"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
