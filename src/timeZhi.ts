export type TimeZhiOption = { label: string; value: number }

// 專案統一使用標準順序：0=子, 1=丑, ... 10=戌, 11=亥
// 子時涵蓋 23:00-00:59，其餘時辰每兩小時一格。
export const TIME_ZHI_OPTIONS: TimeZhiOption[] = [
  { label: '子時（23:00–01:00）', value: 0 },
  { label: '丑時（01:00–03:00）', value: 1 },
  { label: '寅時（03:00–05:00）', value: 2 },
  { label: '卯時（05:00–07:00）', value: 3 },
  { label: '辰時（07:00–09:00）', value: 4 },
  { label: '巳時（09:00–11:00）', value: 5 },
  { label: '午時（11:00–13:00）', value: 6 },
  { label: '未時（13:00–15:00）', value: 7 },
  { label: '申時（15:00–17:00）', value: 8 },
  { label: '酉時（17:00–19:00）', value: 9 },
  { label: '戌時（19:00–21:00）', value: 10 },
  { label: '亥時（21:00–23:00）', value: 11 },
]

export function getTimeZhiLabel(hourIndex: number) {
  return TIME_ZHI_OPTIONS.find(o => o.value === hourIndex)?.label ?? '（未選擇）'
}

export function getHourIndexFromClock(hour: number, minute: number) {
  const safeHour = Number.isFinite(hour) ? Math.max(0, Math.min(23, Math.trunc(hour))) : 0
  const safeMinute = Number.isFinite(minute) ? Math.max(0, Math.min(59, Math.trunc(minute))) : 0
  const totalMinutes = safeHour * 60 + safeMinute

  if (totalMinutes >= 23 * 60 || totalMinutes < 60) {
    return 0
  }

  return Math.floor((totalMinutes - 60) / 120) + 1
}
