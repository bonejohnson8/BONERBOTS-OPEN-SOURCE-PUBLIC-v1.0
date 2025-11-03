// components/PerformanceChart.tsx
import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time, LineStyle } from 'lightweight-charts';
import { ValueHistoryPoint } from '../types';

interface SeriesData {
  name: string;
  data: ValueHistoryPoint[];
}

interface ArenaPerformanceChartProps {
  series: SeriesData[];
  initialBalance?: number;
}

const botColorMap: { [key: string]: string } = {
  'Escaped Monkey': '#818cf8',
  'Mastermind': '#f87171',
  'DEGEN LIVE': '#facc15',
  'Astrologer': '#c084fc',
  'Elon Musk': '#38bdf8',
  'Ani': '#fb923c',
  'Mika': '#a78bfa',
};
const defaultColor = '#9ca3af';

const PerformanceChart: React.FC<ArenaPerformanceChartProps> = ({ series, initialBalance }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const priceLineRef = useRef<any>(null);

  const hasEnoughData = series.some(s => s.data.length >= 2);

  useEffect(() => {
    if (!chartContainerRef.current || series.length === 0) return;

    // Initialize chart
    if (!chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        autoSize: true,
        layout: {
          background: { color: 'transparent' },
          textColor: '#D1D5DB', // gray-300
        },
        grid: {
          vertLines: { color: '#374151' }, // gray-700
          horzLines: { color: '#374151' }, // gray-700
        },
        timeScale: {
          borderColor: '#4B5563', // gray-600
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#4B5563', // gray-600
        },
        crosshair: {
          mode: 1, // Magnet
        },
      });
      chartRef.current = chart;
    }

    const chart = chartRef.current;

    // Sync series data
    series.forEach(s => {
      const formattedData: LineData<Time>[] = s.data
        .map(d => ({
          time: (d.timestamp / 1000) as Time,
          value: d.value,
        }))
        // Fix: Cast 'time' property to number for subtraction to resolve type error.
        // The 'Time' type is a union, but in this context, it's always a number (timestamp).
        .sort((a, b) => (a.time as number) - (b.time as number)); // Data must be sorted

      let seriesApi = seriesRef.current.get(s.name);
      if (!seriesApi) {
        // Fix: Corrected method to 'addSeries' to resolve TypeScript error. The error message
        // "Property 'addLineSeries' does not exist" suggests a mismatch in the environment's
        // type definitions for the lightweight-charts library.
        seriesApi = (chart as any).addLineSeries({
          color: botColorMap[s.name] || defaultColor,
          title: s.name,
          lineWidth: 2,
        });
        seriesRef.current.set(s.name, seriesApi);
      }

      if (formattedData.length > 0) {
        seriesApi.setData(formattedData);
      }
      
      // Update or create the initial balance price line on the first series
      if (initialBalance !== undefined && seriesApi && seriesRef.current.size === 1) {
          if (priceLineRef.current) {
            seriesApi.removePriceLine(priceLineRef.current);
          }
          priceLineRef.current = seriesApi.createPriceLine({
              price: initialBalance,
              color: '#6b7280', // gray-500
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `$${initialBalance.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`,
          });
      }
    });

    if (hasEnoughData) {
      chart.timeScale().fitContent();
    }

    // Cleanup on component unmount
    return () => {
      if (chartRef.current) {
        // chart.remove() is too aggressive for re-renders, so we only do it on full unmount if needed.
        // For now, we let the chart persist across renders.
      }
    };
  }, [series, initialBalance, hasEnoughData]);

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-300">Bot Arena Performance</h2>
        <div className="flex space-x-4">
          {series.map(s => (
            <div key={s.name} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: botColorMap[s.name] || defaultColor }}></div>
              <span className="text-sm font-medium text-gray-300">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2 relative h-64">
        {!hasEnoughData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">Waiting for more trading data to generate performance chart...</p>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default PerformanceChart;
