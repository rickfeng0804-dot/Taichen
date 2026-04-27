import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(num: number) {
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(num);
}

export function sqmToPing(sqm: number) {
  return (sqm * 0.3025).toFixed(2);
}

export function parseTwDate(twDateStr: string) {
  if (!twDateStr || twDateStr.length < 5) return "未知日期";
  const year = parseInt(twDateStr.slice(0, -4)) + 1911;
  const month = twDateStr.slice(-4, -2);
  const day = twDateStr.slice(-2);
  return `${year}-${month}-${day}`;
}
