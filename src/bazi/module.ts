// 八字模組：四柱、大運、流年與 season context。
import { Solar } from 'lunar-typescript'
import { calculateBazi, toSolarInputByHourIndex } from './calc'
import { computeShenShaByPillars } from '../shensha'
import type { BaziModule, ChartRequestInput } from '../types'
import {
  BRANCH_CLASHES,
  BRANCH_COMBINATIONS,
  BRANCH_MEETINGS,
  BRANCH_PAIR_PUNISHMENTS,
  BRANCH_PUNISHMENTS,
  BRANCH_SELF_PUNISH,
  BRANCH_TRINES,
  CHINESE_TO_WUXING_KEY,
  ELEMENT_CONTROLLED_BY_ZH,
  ELEMENT_CONTROLS_ZH,
  ELEMENT_GENERATED_BY_ZH,
  ELEMENT_GENERATES_ZH,
  PILLAR_LABELS_ZH,
  SEASON_CONTEXT_BY_BRANCH,
  STEM_COMBINATIONS,
  STEM_TO_ELEMENT,
  ZHI_TO_ELEMENT,
} from '../constants'
import { pad2, uniqueStrings } from '../shared'

export function buildUnknownPillar(pillar: string) {
  return {
    pillar,
    text: '',
    heavenly_stem: {
      text: '',
      element: '',
      ten_god: '',
    },
    earthly_branch: {
      text: '',
      element: '',
      hidden_stems: [],
    },
    na_yin: '',
    di_shi: '',
    xun: '',
    xun_kong: '',
    known: false,
    shen_sha: {
      auspicious: [],
      neutral: [],
      inauspicious: [],
    },
  }
}

export function buildPillar(
  pillar: string,
  combined: string,
  wuXing: string,
  naYin: string,
  shiShenGan: string,
  shiShenZhi: string[],
  hideGan: string[],
  diShi: string,
  xun: string,
  xunKong: string,
) {
  const gan = combined.slice(0, 1)
  const zhi = combined.slice(1)
  const elements = Array.from(wuXing || '')
  const stemElement = elements[0] ?? STEM_TO_ELEMENT[gan] ?? ''
  const branchElement = elements[1] ?? ZHI_TO_ELEMENT[zhi] ?? ''

  return {
    pillar,
    text: combined,
    heavenly_stem: {
      text: gan,
      element: stemElement,
      ten_god: shiShenGan,
    },
    earthly_branch: {
      text: zhi,
      element: branchElement,
      hidden_stems: hideGan.map((stem, index) => ({
        text: stem,
        element: STEM_TO_ELEMENT[stem] ?? '',
        ten_god: shiShenZhi[index] ?? '',
      })),
    },
    na_yin: naYin,
    di_shi: diShi,
    xun,
    xun_kong: xunKong,
    known: true,
  }
}

function getElementRelationToDayMaster(dayMasterElementZh: string | null, targetElementZh: string | null) {
  if (!dayMasterElementZh || !targetElementZh) {
    return { relation: null, relation_zh: null }
  }

  if (targetElementZh === dayMasterElementZh) {
    return { relation: 'peer', relation_zh: '比劫' }
  }
  if (ELEMENT_GENERATED_BY_ZH[dayMasterElementZh] === targetElementZh) {
    return { relation: 'resource', relation_zh: '印星' }
  }
  if (ELEMENT_GENERATES_ZH[dayMasterElementZh] === targetElementZh) {
    return { relation: 'output', relation_zh: '食傷' }
  }
  if (ELEMENT_CONTROLS_ZH[dayMasterElementZh] === targetElementZh) {
    return { relation: 'wealth', relation_zh: '財星' }
  }
  if (ELEMENT_CONTROLLED_BY_ZH[dayMasterElementZh] === targetElementZh) {
    return { relation: 'officer', relation_zh: '官殺' }
  }

  return { relation: null, relation_zh: null }
}

export function buildSeasonContext(dayMasterElementZh: string | null, monthBranch: string | null) {
  if (!dayMasterElementZh || !monthBranch) return null

  const season = SEASON_CONTEXT_BY_BRANCH[monthBranch]
  if (!season) return null

  const relation = getElementRelationToDayMaster(dayMasterElementZh, season.season_commander_zh)

  const strengthHintMap: Record<string, { key: string; label: string; note: string }> = {
    peer: {
      key: 'supported',
      label: '得令偏強',
      note: `月令主氣為${season.season_commander_zh}，與日主${dayMasterElementZh}同氣，通常先視為得令。`,
    },
    resource: {
      key: 'supported',
      label: '受生偏強',
      note: `月令主氣為${season.season_commander_zh}，可生扶日主${dayMasterElementZh}，先視為有根有援。`,
    },
    output: {
      key: 'weakened',
      label: '泄氣偏弱',
      note: `月令主氣為${season.season_commander_zh}，日主${dayMasterElementZh}生月令，常見先天泄氣。`,
    },
    wealth: {
      key: 'weakened',
      label: '耗氣偏弱',
      note: `月令主氣為${season.season_commander_zh}，日主${dayMasterElementZh}剋月令，常需額外消耗。`,
    },
    officer: {
      key: 'weakened',
      label: '受剋偏弱',
      note: `月令主氣為${season.season_commander_zh}，對日主${dayMasterElementZh}形成官殺壓力，通常先視為失令。`,
    },
  }

  const fallback = {
    key: 'neutral',
    label: '需綜合判斷',
    note: '月令訊號不足以單獨決定身強弱，仍需合併通根、透干與大運流年一起看。',
  }
  const hint = strengthHintMap[relation.relation ?? ''] ?? fallback

  return {
    month_branch: monthBranch,
    season: season.season,
    season_zh: season.season_zh,
    season_commander: CHINESE_TO_WUXING_KEY[season.season_commander_zh] ?? null,
    season_commander_zh: season.season_commander_zh,
    relation_to_day_master: relation.relation,
    relation_to_day_master_zh: relation.relation_zh,
    day_master_strength_hint: hint.key,
    day_master_strength_hint_zh: hint.label,
    supporting_elements: uniqueStrings([
      CHINESE_TO_WUXING_KEY[dayMasterElementZh] ?? null,
      CHINESE_TO_WUXING_KEY[ELEMENT_GENERATED_BY_ZH[dayMasterElementZh]] ?? null,
    ]),
    weakening_elements: uniqueStrings([
      CHINESE_TO_WUXING_KEY[ELEMENT_GENERATES_ZH[dayMasterElementZh]] ?? null,
      CHINESE_TO_WUXING_KEY[ELEMENT_CONTROLS_ZH[dayMasterElementZh]] ?? null,
      CHINESE_TO_WUXING_KEY[ELEMENT_CONTROLLED_BY_ZH[dayMasterElementZh]] ?? null,
    ]),
    note: hint.note,
  }
}

// 流年干支與四柱的刑沖合會。pillars 是 buildPillar() 的輸出結構。
type PillarLike = {
  heavenly_stem?: { text?: string | null } | null
  earthly_branch?: { text?: string | null } | null
}

export function buildLiuNianInteractions(
  ganZhi: string | null,
  pillars: Record<string, PillarLike>,
) {
  if (!ganZhi) return []

  const liuStem = ganZhi.slice(0, 1)
  const liuBranch = ganZhi.slice(1, 2)
  const natalPillars = Object.entries(pillars)
    .map(([pillarKey, pillar]) => ({
      key: pillarKey,
      label: PILLAR_LABELS_ZH[pillarKey as keyof typeof PILLAR_LABELS_ZH] ?? pillarKey,
      stem: pillar?.heavenly_stem?.text ?? '',
      branch: pillar?.earthly_branch?.text ?? '',
    }))
    .filter(item => item.stem || item.branch)

  const interactions: string[] = []
  const seen = new Set<string>()
  const pushInteraction = (label: string) => {
    if (!seen.has(label)) {
      seen.add(label)
      interactions.push(label)
    }
  }

  for (const rule of STEM_COMBINATIONS) {
    if (!rule.stems.some(stem => stem === liuStem)) continue
    const counterpartStem = rule.stems.find(stem => stem !== liuStem)
    if (!counterpartStem) continue
    for (const natal of natalPillars.filter(item => item.stem === counterpartStem)) {
      pushInteraction(`${liuStem}${counterpartStem}合${rule.result_zh}（流年天干${liuStem} + ${natal.label}天干${counterpartStem}）`)
    }
  }

  for (const rule of BRANCH_COMBINATIONS) {
    if (!rule.branches.some(branch => branch === liuBranch)) continue
    const counterpartBranch = rule.branches.find(branch => branch !== liuBranch)
    if (!counterpartBranch) continue
    for (const natal of natalPillars.filter(item => item.branch === counterpartBranch)) {
      pushInteraction(`${liuBranch}${counterpartBranch}合${rule.result_zh}（流年地支${liuBranch} + ${natal.label}地支${counterpartBranch}）`)
    }
  }

  for (const rule of BRANCH_CLASHES) {
    if (!rule.some(branch => branch === liuBranch)) continue
    const counterpartBranch = rule.find(branch => branch !== liuBranch)
    if (!counterpartBranch) continue
    for (const natal of natalPillars.filter(item => item.branch === counterpartBranch)) {
      pushInteraction(`${liuBranch}${counterpartBranch}沖（流年地支${liuBranch} + ${natal.label}地支${counterpartBranch}）`)
    }
  }

  for (const rule of BRANCH_TRINES) {
    if (!rule.branches.some(branch => branch === liuBranch)) continue
    const requiredBranches = rule.branches.filter(branch => branch !== liuBranch)
    const requiredPillars = requiredBranches.map(branch => natalPillars.find(item => item.branch === branch)).filter(Boolean) as Array<{
      label: string
      branch: string
    }>
    if (requiredPillars.length === requiredBranches.length) {
      pushInteraction(
        `${rule.branches.join('')}三合${rule.result_zh}局（流年地支${liuBranch} + ${requiredPillars.map(item => `${item.label}地支${item.branch}`).join(' + ')}）`,
      )
    }
  }

  for (const rule of BRANCH_MEETINGS) {
    if (!rule.branches.some(branch => branch === liuBranch)) continue
    const requiredBranches = rule.branches.filter(branch => branch !== liuBranch)
    const requiredPillars = requiredBranches.map(branch => natalPillars.find(item => item.branch === branch)).filter(Boolean) as Array<{
      label: string
      branch: string
    }>
    if (requiredPillars.length === requiredBranches.length) {
      pushInteraction(
        `${rule.branches.join('')}三會${rule.result_zh}局（流年地支${liuBranch} + ${requiredPillars.map(item => `${item.label}地支${item.branch}`).join(' + ')}）`,
      )
    }
  }

  for (const rule of BRANCH_PUNISHMENTS) {
    if (!rule.branches.some(branch => branch === liuBranch)) continue
    const requiredBranches = rule.branches.filter(branch => branch !== liuBranch)
    const requiredPillars = requiredBranches.map(branch => natalPillars.find(item => item.branch === branch)).filter(Boolean) as Array<{
      label: string
      branch: string
    }>
    if (requiredPillars.length === requiredBranches.length) {
      pushInteraction(`${rule.label}（流年地支${liuBranch} + ${requiredPillars.map(item => `${item.label}地支${item.branch}`).join(' + ')}）`)
    }
  }

  for (const rule of BRANCH_PAIR_PUNISHMENTS) {
    if (!rule.some(branch => branch === liuBranch)) continue
    const counterpartBranch = rule.find(branch => branch !== liuBranch)
    if (!counterpartBranch) continue
    for (const natal of natalPillars.filter(item => item.branch === counterpartBranch)) {
      pushInteraction(`${liuBranch}${counterpartBranch}相刑（流年地支${liuBranch} + ${natal.label}地支${counterpartBranch}）`)
    }
  }

  if (BRANCH_SELF_PUNISH.has(liuBranch)) {
    for (const natal of natalPillars.filter(item => item.branch === liuBranch)) {
      pushInteraction(`${liuBranch}${liuBranch}自刑（流年地支${liuBranch} + ${natal.label}地支${liuBranch}）`)
    }
  }

  return interactions
}

// iztro/lunar-typescript 沒有型別，集中在此退回 any。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DaYunRaw = any

export function buildBaziModule(input: ChartRequestInput): BaziModule {
  if (input.birthTimeUnknown || input.hourIndex === null) {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, 12, 0, 0)
    const lunar = solar.getLunar()
    const eightChar = lunar.getEightChar()

    const threePillars = {
      year: buildPillar(
        'year',
        eightChar.getYear(),
        eightChar.getYearWuXing(),
        eightChar.getYearNaYin(),
        eightChar.getYearShiShenGan(),
        eightChar.getYearShiShenZhi(),
        eightChar.getYearHideGan(),
        eightChar.getYearDiShi(),
        eightChar.getYearXun(),
        eightChar.getYearXunKong(),
      ),
      month: buildPillar(
        'month',
        eightChar.getMonth(),
        eightChar.getMonthWuXing(),
        eightChar.getMonthNaYin(),
        eightChar.getMonthShiShenGan(),
        eightChar.getMonthShiShenZhi(),
        eightChar.getMonthHideGan(),
        eightChar.getMonthDiShi(),
        eightChar.getMonthXun(),
        eightChar.getMonthXunKong(),
      ),
      day: buildPillar(
        'day',
        eightChar.getDay(),
        eightChar.getDayWuXing(),
        eightChar.getDayNaYin(),
        eightChar.getDayShiShenGan(),
        eightChar.getDayShiShenZhi(),
        eightChar.getDayHideGan(),
        eightChar.getDayDiShi(),
        eightChar.getDayXun(),
        eightChar.getDayXunKong(),
      ),
      time: buildUnknownPillar('time'),
    }

    const shenSha = computeShenShaByPillars(threePillars)
    const dayMasterElement = STEM_TO_ELEMENT[eightChar.getDayGan()] ?? null
    const seasonContext = buildSeasonContext(dayMasterElement, threePillars.month.earthly_branch?.text ?? null)

    return {
      module: 'bazi',
      summary: {
        four_pillars: `${eightChar.getYear()} ${eightChar.getMonth()} ${eightChar.getDay()} 時辰未知`,
        day_master: eightChar.getDayGan(),
        day_master_element: dayMasterElement,
        day_master_strength_hint: seasonContext?.day_master_strength_hint_zh ?? null,
      },
      solar_date_used_for_bazi: `${input.year}-${pad2(input.month)}-${pad2(input.day)} 12:00:00`,
      lunar_date: lunar.toString(),
      lunar_numeric: {
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
        is_leap_month: lunar.getMonth() < 0,
      },
      four_pillars: shenSha.pillars,
      auxiliary: {
        tai_yuan: {
          text: eightChar.getTaiYuan(),
          na_yin: eightChar.getTaiYuanNaYin(),
        },
        tai_xi: {
          text: eightChar.getTaiXi(),
          na_yin: eightChar.getTaiXiNaYin(),
        },
        ming_gong: null,
        shen_gong: null,
      },
      da_yun: {
        start_offset: null,
        start_solar_date: null,
        direction: null,
        periods: [],
        current: null,
        current_liu_nian: [],
      },
      five_elements: null,
      five_elements_note: '出生時間未知時不做完整五行計數。身強弱請優先參考 season_context，再綜合通根與透干判讀。',
      season_context: seasonContext,
      pattern: null,
      shen_sha_summary: shenSha.shen_sha_summary,
      note: '出生時間未知時保留年、月、日三柱。',
    }
  }

  const solarInput = toSolarInputByHourIndex(input.year, input.month, input.day, input.hourIndex)
  const solar = Solar.fromYmdHms(solarInput.year, solarInput.month, solarInput.day, solarInput.hour, solarInput.minute, 0)
  const lunar = solar.getLunar()
  const eightChar = lunar.getEightChar()
  const summary = calculateBazi({
    year: input.year,
    month: input.month,
    day: input.day,
    hourIndex: input.hourIndex,
    gender: input.gender,
  })
  const genderFlag = input.gender === '男' ? 1 : 0
  const yun = eightChar.getYun(genderFlag)
  const daYunList = yun
    .getDaYun(10)
    .filter((item: DaYunRaw) => item.getGanZhi())
    .map((item: DaYunRaw) => ({
      index: item.getIndex(),
      gan_zhi: item.getGanZhi(),
      start_year: item.getStartYear(),
      end_year: item.getEndYear(),
      start_age: item.getStartAge(),
      end_age: item.getEndAge(),
      xun: item.getXun(),
      xun_kong: item.getXunKong(),
    }))

  const currentYear = new Date().getFullYear()
  const currentAge = currentYear - input.year
  const currentDaYun = daYunList.find((item: { start_age: number; end_age: number }) =>
    item.start_age <= currentAge && currentAge <= item.end_age,
  ) ?? null
  const currentRawDaYun = yun
    .getDaYun(10)
    .find((item: DaYunRaw) => item.getGanZhi() && item.getStartAge() <= currentAge && currentAge <= item.getEndAge())

  const pillars = {
    year: buildPillar(
      'year',
      eightChar.getYear(),
      eightChar.getYearWuXing(),
      eightChar.getYearNaYin(),
      eightChar.getYearShiShenGan(),
      eightChar.getYearShiShenZhi(),
      eightChar.getYearHideGan(),
      eightChar.getYearDiShi(),
      eightChar.getYearXun(),
      eightChar.getYearXunKong(),
    ),
    month: buildPillar(
      'month',
      eightChar.getMonth(),
      eightChar.getMonthWuXing(),
      eightChar.getMonthNaYin(),
      eightChar.getMonthShiShenGan(),
      eightChar.getMonthShiShenZhi(),
      eightChar.getMonthHideGan(),
      eightChar.getMonthDiShi(),
      eightChar.getMonthXun(),
      eightChar.getMonthXunKong(),
    ),
    day: buildPillar(
      'day',
      eightChar.getDay(),
      eightChar.getDayWuXing(),
      eightChar.getDayNaYin(),
      eightChar.getDayShiShenGan(),
      eightChar.getDayShiShenZhi(),
      eightChar.getDayHideGan(),
      eightChar.getDayDiShi(),
      eightChar.getDayXun(),
      eightChar.getDayXunKong(),
    ),
    time: buildPillar(
      'time',
      eightChar.getTime(),
      eightChar.getTimeWuXing(),
      eightChar.getTimeNaYin(),
      eightChar.getTimeShiShenGan(),
      eightChar.getTimeShiShenZhi(),
      eightChar.getTimeHideGan(),
      eightChar.getTimeDiShi(),
      eightChar.getTimeXun(),
      eightChar.getTimeXunKong(),
    ),
  }

  const shenSha = computeShenShaByPillars(pillars)
  const seasonContext = buildSeasonContext(summary.dayMasterElement, pillars.month.earthly_branch?.text ?? null)
  const currentLiuNian =
    currentRawDaYun?.getLiuNian()?.map((item: DaYunRaw) => ({
      year: item.getYear(),
      age: item.getAge(),
      gan_zhi: item.getGanZhi(),
      xun: item.getXun(),
      xun_kong: item.getXunKong(),
      interactions: buildLiuNianInteractions(item.getGanZhi(), shenSha.pillars),
    })) ?? []

  return {
    module: 'bazi',
    summary: {
      four_pillars: `${summary.year} ${summary.month} ${summary.day} ${summary.time}`,
      day_master: summary.dayMaster,
      day_master_element: summary.dayMasterElement,
      day_master_strength_hint: seasonContext?.day_master_strength_hint_zh ?? null,
    },
    solar_date_used_for_bazi: `${solarInput.year}-${pad2(solarInput.month)}-${pad2(solarInput.day)} ${pad2(solarInput.hour)}:${pad2(
      solarInput.minute,
    )}:00`,
    lunar_date: lunar.toString(),
    lunar_numeric: {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      is_leap_month: lunar.getMonth() < 0,
    },
    four_pillars: shenSha.pillars,
    auxiliary: {
      tai_yuan: {
        text: eightChar.getTaiYuan(),
        na_yin: eightChar.getTaiYuanNaYin(),
      },
      tai_xi: {
        text: eightChar.getTaiXi(),
        na_yin: eightChar.getTaiXiNaYin(),
      },
      ming_gong: {
        text: eightChar.getMingGong(),
        na_yin: eightChar.getMingGongNaYin(),
      },
      shen_gong: {
        text: eightChar.getShenGong(),
        na_yin: eightChar.getShenGongNaYin(),
      },
    },
    da_yun: {
      start_offset: {
        years: yun.getStartYear(),
        months: yun.getStartMonth(),
        days: yun.getStartDay(),
        hours: yun.getStartHour(),
      },
      start_solar_date: yun.getStartSolar().toYmd(),
      direction: input.gender === '男' ? '順行（依目前規則）' : '逆行（依目前規則）',
      periods: daYunList,
      current: currentDaYun,
      current_liu_nian: currentLiuNian,
    },
    five_elements: summary.wuXing,
    five_elements_note: '五行計數含天干、地支與藏干，僅反映元素分布；身強弱請優先參考 season_context，再綜合通根、透干與歲運。',
    season_context: seasonContext,
    pattern: null,
    shen_sha_summary: shenSha.shen_sha_summary,
    note: null,
  }
}
