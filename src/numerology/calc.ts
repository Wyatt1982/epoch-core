// 生命靈數計算模組（畢達哥拉斯 Pythagorean 系統）
// 台灣通稱「生命靈數」即此系統

const MASTER_NUMBERS = new Set([11, 22, 33])

/**
 * 將數字化簡至個位數，保留主數 11 / 22 / 33
 */
function reduceNumber(n: number, preserveMaster = true): number {
  if (preserveMaster && MASTER_NUMBERS.has(n)) return n
  if (n < 10) return n
  const sum = String(n)
    .split('')
    .reduce((acc, d) => acc + Number(d), 0)
  return reduceNumber(sum, preserveMaster)
}

/**
 * 生命路徑數（生命靈數）
 * 算法：年 / 月 / 日各自化簡後相加，再化簡
 * 主數 11 / 22 / 33 在每個階段均保留
 *
 * 範例：1982-02-25
 *   年 1+9+8+2=20 → 2+0=2
 *   月 2
 *   日 2+5=7
 *   合 2+2+7=11 → 主數，保留
 */
export function calculateLifePath(
  year: number,
  month: number,
  day: number,
): { number: number; isMaster: boolean } {
  const yearDigits = String(year)
    .split('')
    .reduce((acc, d) => acc + Number(d), 0)
  const y = reduceNumber(yearDigits)
  const m = reduceNumber(month)
  const d = reduceNumber(day)
  const total = y + m + d
  const result = reduceNumber(total)
  return { number: result, isMaster: MASTER_NUMBERS.has(result) }
}

/**
 * 生日數
 * 僅取出生日（day）化簡，反映天賦才能
 *
 * 範例：25 → 2+5=7
 *         11 → 主數，保留
 */
export function calculateBirthdayNumber(day: number): { number: number; isMaster: boolean } {
  const result = reduceNumber(day)
  return { number: result, isMaster: MASTER_NUMBERS.has(result) }
}

/**
 * 個人年
 * 出生月 + 出生日 + 當年年份數字，代表今年的主要能量週期
 *
 * 範例：1982-02-25，查 2026 年
 *   月 2 → 2
 *   日 25 → 2+5=7
 *   年 2+0+2+6=10 → 1+0=1
 *   合 2+7+1=10 → 1+0=1
 */
export function calculatePersonalYear(
  month: number,
  day: number,
  currentYear: number,
): { number: number; year: number } {
  const m = reduceNumber(month)
  const d = reduceNumber(day)
  const yearDigits = String(currentYear)
    .split('')
    .reduce((acc, d) => acc + Number(d), 0)
  const y = reduceNumber(yearDigits)
  const total = m + d + y
  const result = reduceNumber(total)
  return { number: result, year: currentYear }
}
