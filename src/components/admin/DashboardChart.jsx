'use client';

import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartColumn, Loader2 } from 'lucide-react';

import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--muted-foreground))', // distinctive neutral color 
  }
};

export default function DashboardChart() {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChart() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/chart?period=${period}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChart();
  }, [period]);

  return (
    <div className="flex h-full flex-col w-full">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-1.5">
          <ChartColumn className="size-4 text-muted-foreground" />
          <h2 className="text-[13px] font-semibold text-foreground">
            Performance
          </h2>
        </div>
        
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/20 p-0.5 self-start lg:self-auto">
          {['weekly', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-[4px] px-2.5 py-1 text-[11px] font-medium capitalize transition-all ${
                period === p
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-[160px] w-full mt-2">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground/60" />
          </div>
        )}
        {!isLoading && data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground z-10">
            No data available for selected period
          </div>
        )}

        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value}
              className="text-[10px] fill-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Rs ${value.toLocaleString()}`}
              className="text-[10px] fill-muted-foreground w-[70px]"
            />
            {/* Secondary YAxis strictly for Orders volume (scales independently over right side) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={20}
              className="text-[10px] fill-muted-foreground"
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            
            <Area
              yAxisId="right"
              dataKey="orders"
              type="monotone"
              fill="url(#fillOrders)"
              fillOpacity={0.2}
              stroke="var(--color-orders)"
              strokeWidth={2}
            />
            <Area
              yAxisId="left"
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
