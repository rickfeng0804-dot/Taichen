import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  BadgeDollarSign, 
  Search, 
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { cn, formatCurrency, sqmToPing, parseTwDate } from '@/src/lib/utils';
import type { RealEstateRecord, ApiResponse } from '@/src/types';

export default function App() {
  const [data, setData] = useState<RealEstateRecord[]>([]);
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/real-estate/tamsui');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        setData(result.data);
        setSource(result.source);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      (item['土地區段位置建物區段門牌'] || '').includes(searchTerm) ||
      (item['建物型態'] || '').includes(searchTerm)
    );
  }, [data, searchTerm]);

  // Derived Analytics
  const analytics = useMemo(() => {
    if (data.length === 0) return null;

    let totalVolume = 0;
    let validPrices = 0;
    let sumUnitPrices = 0;
    let highestUnitPrice = 0;

    const monthlyTrends: Record<string, { total: number, count: number, max: number }> = {};

    data.forEach(item => {
      const totalPrice = Number(item['總價元']) || 0;
      totalVolume += totalPrice;

      const unitPriceSqm = Number(item['單價元平方公尺']);
      if (!isNaN(unitPriceSqm) && unitPriceSqm > 0) {
        const pingPrice = unitPriceSqm * 3.305785;
        sumUnitPrices += pingPrice;
        validPrices++;
        if (pingPrice > highestUnitPrice) highestUnitPrice = pingPrice;

        const date = parseTwDate(item['交易年月日']);
        const monthKey = date.substring(0, 7); // YYYY-MM
        if (monthKey !== "未知日期") {
          if (!monthlyTrends[monthKey]) {
            monthlyTrends[monthKey] = { total: 0, count: 0, max: 0 };
          }
          monthlyTrends[monthKey].total += pingPrice;
          monthlyTrends[monthKey].count++;
          if (pingPrice > monthlyTrends[monthKey].max) {
             monthlyTrends[monthKey].max = pingPrice;
          }
        }
      }
    });

    const avgPricePing = validPrices > 0 ? (sumUnitPrices / validPrices) : 0;

    const trendData = Object.keys(monthlyTrends).sort().map(month => ({
      name: month,
      "平均單價(坪)": Math.round(monthlyTrends[month].total / monthlyTrends[month].count),
      "最高單價(坪)": Math.round(monthlyTrends[month].max)
    }));

    return {
      totalTransactions: data.length,
      totalVolume,
      avgPricePing,
      highestUnitPrice,
      trendData
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">載入實價登錄資料中...</p>
        <p className="text-slate-400 text-sm mt-2">尋找淡水區一年內房屋買賣公開資料</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">資料載入失敗</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
        >
          重新整理
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2.5 rounded-xl">
                <MapPin className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">新北市淡水區房屋買賣</h1>
                <p className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3"/> 近一年實價登錄</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                    資料來源: {source}
                  </span>
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="搜尋路段、社區或建物型態..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Analytics KPIs */}
        {analytics && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KpiCard 
              title="總交易筆數" 
              value={analytics.totalTransactions.toLocaleString()}
              subtitle="筆符合條件"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              color="indigo"
            />
            <KpiCard 
              title="平均單價 (每坪)" 
              value={formatCurrency(Math.round(analytics.avgPricePing)).replace('.00','')}
              subtitle="依住宅/大樓等計算"
              icon={<BadgeDollarSign className="w-5 h-5 text-emerald-600" />}
              color="emerald"
            />
            <KpiCard 
              title="最高單價 (每坪)" 
              value={formatCurrency(Math.round(analytics.highestUnitPrice)).replace('.00','')}
              subtitle="區間內最高成交"
              icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
              color="amber"
            />
            <KpiCard 
              title="總交易額" 
              value={formatCurrency(analytics.totalVolume).replace('.00','')}
              subtitle="新台幣"
              icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
          </motion.div>
        )}

        {/* Chart Section */}
        {analytics && analytics.trendData.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800">房價趨勢 (近一年)</h2>
              <p className="text-sm text-slate-500">淡水區各月份平均與最高成交單價走勢</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 10000).toFixed(0)}萬`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value).replace('.00',''), undefined]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="平均單價(坪)" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="最高單價(坪)" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Data List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">最新交易紀錄</h2>
            <p className="text-sm text-slate-500">顯示符合搜尋條件的 {filteredData.length} 筆資料</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">交易日期</th>
                  <th className="px-6 py-4">門牌 / 區段</th>
                  <th className="px-6 py-4">型態</th>
                  <th className="px-6 py-4 text-right">總價</th>
                  <th className="px-6 py-4 text-right">單價(坪)</th>
                  <th className="px-6 py-4 text-right">坪數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 100).map((item, idx) => {
                  const unitPriceSqm = Number(item['單價元平方公尺']);
                  const pingPrice = unitPriceSqm ? unitPriceSqm * 3.305785 : 0;
                  const totalArea = Number(item['建物移轉總面積平方公尺']);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {parseTwDate(item['交易年月日'])}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]" title={item['土地區段位置建物區段門牌']}>
                        {item['土地區段位置建物區段門牌']}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {item['建物型態']}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(Number(item['總價元'])).replace('.00','')}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700">
                        {pingPrice > 0 ? formatCurrency(Math.round(pingPrice)).replace('.00','') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        {totalArea > 0 ? sqmToPing(totalArea) + ' 坪' : '-'}
                      </td>
                    </tr>
                  )
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      沒有找到符合條件的資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 100 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
              僅顯示最新 100 筆資料
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

// Subcomponents

function KpiCard({ title, value, subtitle, icon, color }: { title: string, value: string, subtitle: string, icon: React.ReactNode, color: 'indigo' | 'emerald' | 'amber' | 'blue' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 font-medium text-sm">{title}</h3>
        <div className={cn("p-2 rounded-xl", colorMap[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <div className="text-2xl font-bold text-slate-900 truncate" title={value}>{value}</div>
        <div className="text-sm border-t border-slate-100 mt-3 pt-3 text-slate-500">{subtitle}</div>
      </div>
    </div>
  )
}

