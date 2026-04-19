const SIGNS: Array<{ sign: string; start: [number, number] }> = [
  // 這裡只放「跨年度後」的邊界（不含摩羯座初段），最後會依日期回補摩羯座。
  { sign: '水瓶座', start: [1, 20] },
  { sign: '雙魚座', start: [2, 19] },
  { sign: '牡羊座', start: [3, 21] },
  { sign: '金牛座', start: [4, 20] },
  { sign: '雙子座', start: [5, 21] },
  { sign: '巨蟹座', start: [6, 21] },
  { sign: '獅子座', start: [7, 23] },
  { sign: '處女座', start: [8, 23] },
  { sign: '天秤座', start: [9, 23] },
  { sign: '天蠍座', start: [10, 23] },
  { sign: '射手座', start: [11, 22] },
]

function isSameOrAfter(month: number, day: number, startMonth: number, startDay: number) {
  return month > startMonth || (month === startMonth && day >= startDay)
}

export function getSunSign(month: number, day: number): string {
  // Capricorn：12/22-12/31；以及 1/1-1/19。
  if (month === 12) {
    if (day >= 22) return '摩羯座'
    // 12/前於 22 -> 仍屬射手座區間（11/22-12/21）
    return '射手座'
  }

  // 先預設落在摩羯座「尾段」：1/1-1/19。
  // 然後從 Aquarius..Sagittarius 的邊界依序掃描，取「最後一個 <= 當天」的星座。
  let result = '摩羯座'
  for (const { sign, start } of SIGNS) {
    const [sm, sd] = start
    if (isSameOrAfter(month, day, sm, sd)) result = sign
  }

  return result
}
