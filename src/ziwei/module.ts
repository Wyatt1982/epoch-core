// 紫微斗數模組：本命、大限、流年宮位與四化連線。
import { astro } from 'iztro'
import type { ChartRequestInput, ZiweiModule, ZiweiSihuaConnection } from '../types'
import {
  STEM_SIHUA_MAP,
  WHITELIST_ADJECTIVE_STARS,
  ZIWEI_SUGGESTED_PROMPT,
  ZIWEI_THEME_PALACES,
} from '../constants'
import { pad2 } from '../shared'

type ZiweiStarLike = { name?: string | null; type?: string | null; scope?: string | null; brightness?: string | null; mutagen?: string[] | null }

type HoroscopeLayerRaw = {
  index?: number | null
  name?: string | null
  heavenlyStem?: string | null
  earthlyBranch?: string | null
  palaceNames?: string[] | null
  mutagen?: string[] | null
  nominalAge?: number | null
  yearlyDecStar?: unknown
  stars?: ZiweiStarLike[][] | null
} | null

// iztro 的 palace 結構。沒有完整型別，只取用到的欄位。
type ZiweiPalaceRaw = {
  index?: number | null
  name?: string | null
  heavenlyStem?: string | null
  earthlyBranch?: string | null
  isBodyPalace?: boolean
  isOriginalPalace?: boolean
  majorStars?: ZiweiStarLike[] | null
  minorStars?: ZiweiStarLike[] | null
  adjectiveStars?: ZiweiStarLike[] | null
  changsheng12?: string | null
  decadal?: unknown
  ages?: number[] | null
}

type SerializedStar = {
  name: string | null
  name_zh: string | null
  type: string | null
  scope: string | null
  brightness: string | null
  mutagen: string[] | null
}

type SerializedPalace = {
  index: number | null
  name: string | null
  name_zh: string | null
  heavenly_stem: string | null
  earthly_branch: string | null
  is_body_palace: boolean
  is_original_palace: boolean
  major_stars: SerializedStar[]
  minor_stars: SerializedStar[]
  adjective_stars: SerializedStar[]
  changsheng12: string | null
  decadal: unknown
  ages: number[]
  surrounding: {
    target_zh: string | null
    opposite_zh: string | null
    wealth_zh: string | null
    career_zh: string | null
  } | null
}

function serializeZiweiStar(star: ZiweiStarLike | null | undefined): SerializedStar {
  return {
    name: star?.name ?? null,
    name_zh: star?.name ?? null,
    type: star?.type ?? null,
    scope: star?.scope ?? null,
    brightness: star?.brightness ?? null,
    mutagen: star?.mutagen ?? null,
  }
}

function mapMutagen(mutagen: string[]) {
  const [lu, quan, ke, ji] = Array.isArray(mutagen) ? mutagen : []
  return { 化祿: lu ?? null, 化權: quan ?? null, 化科: ke ?? null, 化忌: ji ?? null }
}

function serializeHoroscopeLayer(item: HoroscopeLayerRaw) {
  if (!item) return null

  return {
    index: item?.index ?? null,
    name_zh: item?.name ?? null,
    heavenly_stem: item?.heavenlyStem ?? null,
    earthly_branch: item?.earthlyBranch ?? null,
    palace_names_zh: item?.palaceNames ?? [],
    mutagen: item?.mutagen ?? [],
    mutagen_mapped: mapMutagen(item?.mutagen ?? []),
    nominal_age: item?.nominalAge ?? null,
    yearly_dec_star: item?.yearlyDecStar ?? null,
    stars_by_palace: Array.isArray(item?.palaceNames)
      ? item.palaceNames.map((palaceName: string, index: number) => ({
          palace_name_zh: palaceName,
          stars: (item?.stars?.[index] ?? []).map(serializeZiweiStar),
        }))
      : [],
  }
}

const VALID_STEMS = new Set(Object.keys(STEM_SIHUA_MAP))

function computeSihuaConnections(
  palaces: Array<{
    name_zh: string | null
    heavenly_stem: string | null
    earthly_branch: string | null
    major_stars: Array<{ name_zh: string | null }>
    minor_stars: Array<{ name_zh: string | null }>
  }>,
): ZiweiSihuaConnection[] {
  const connections: ZiweiSihuaConnection[] = []

  for (const palace of palaces) {
    const stem = palace.heavenly_stem ?? ''

    // Guard：iztro 的 heavenlyStem 必須是中文天干（甲乙丙...癸）。
    // 若 iztro 版本更新改變輸出格式或語系設定不同，這裡會靜默跳過而非炸掉。
    if (!VALID_STEMS.has(stem)) {
      if (stem) {
        console.warn(`[sihua] 無法識別的天干字元 "${stem}"，跳過宮位 "${palace.name_zh}"`)
      }
      continue
    }

    const rules = STEM_SIHUA_MAP[stem] ?? []
    for (const { star, sihua } of rules) {
      const target = palaces.find(candidate =>
        candidate.major_stars.some(item => item.name_zh === star) || candidate.minor_stars.some(item => item.name_zh === star),
      )

      if (!target) continue

      const isSelf = palace.name_zh === target.name_zh
      connections.push({
        from_palace_zh: palace.name_zh,
        from_palace_branch: palace.earthly_branch,
        from_stem: palace.heavenly_stem,
        star_zh: star,
        sihua,
        to_palace_zh: target.name_zh,
        to_palace_branch: target.earthly_branch,
        is_self: isSelf,
        sihua_label: isSelf ? `${palace.name_zh}自化${sihua}` : `${palace.name_zh}${sihua}飛${target.name_zh}`,
      })
    }
  }

  return connections
}

function createScopePalaces(
  natalPalaces: SerializedPalace[],
  layer: ReturnType<typeof serializeHoroscopeLayer>,
) {
  if (!layer) return []

  return natalPalaces.map(palace => {
    const starGroup = layer.stars_by_palace.find(
      (item: { palace_name_zh: string | null; stars: Array<{ name_zh: string | null }> }) => item.palace_name_zh === palace.name_zh,
    )
    const stars = (starGroup?.stars ?? []) as Array<{ name_zh: string | null }>
    return {
      name_zh: palace.name_zh,
      heavenly_stem: palace.heavenly_stem,
      earthly_branch: palace.earthly_branch,
      major_stars: stars.filter(star => Boolean(star.name_zh)),
      // 保留本命盤的 minor_stars，確保文昌、文曲、祿存等只存在於 minor_stars 的星
      // 在計算各層四化連線時仍可被正確找到目標宮位
      minor_stars: palace.minor_stars,
    }
  })
}

function filterZiweiConnectionsByPalaces(connections: ZiweiSihuaConnection[], palaceNames: readonly string[]) {
  const allowed = new Set(palaceNames)
  return connections.filter(
    connection =>
      allowed.has(connection.from_palace_zh ?? '') ||
      allowed.has(connection.to_palace_zh ?? ''),
  )
}

// iztro astrolabe 沒有完整型別，集中在這個檔案退回 any。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IztroAstrolabe = any

export function buildZiweiModule(input: ChartRequestInput): ZiweiModule {
  if (input.birthTimeUnknown || input.hourIndex === null) {
    return {
      module: 'ziwei',
      metadata: {
        solar_date: `${input.year}-${pad2(input.month)}-${pad2(input.day)}`,
        lunar_date: null,
        chinese_date: null,
        sign: null,
        zodiac: null,
        time: null,
        time_range: null,
        soul: null,
        body: null,
        five_elements_class: null,
        earthly_branch_of_soul_palace: null,
        earthly_branch_of_body_palace: null,
        fix_leap: true,
      },
      palaces: [],
      current_horoscope: {
        _mode: 'standard',
        _note: 'standard 只含大限與流年；monthly 加流月；daily 加流日；hourly 永遠不輸出',
        decadal: null,
        yearly: null,
        monthly: null,
        daily: null,
      },
      horoscope_layers: {
        decadal: null,
        yearly: null,
        monthly: null,
        daily: null,
      },
      sihua_connections: {
        natal: [],
        decadal: [],
        yearly: [],
        monthly: [],
      },
      reading_contexts: {
        personality: null,
        career: null,
        love: null,
        wealth: null,
        life_path: null,
        suggested_prompt: ZIWEI_SUGGESTED_PROMPT,
      },
      note: '紫微斗數高度依賴出生時辰，時間未知時先不輸出宮位與星曜。',
    }
  }

  const astrolabe: IztroAstrolabe = astro.bySolar(`${input.year}-${input.month}-${input.day}`, input.hourIndex, input.gender, true, 'zh-TW')
  const horoscope = astrolabe.horoscope()

  const palaces: SerializedPalace[] = astrolabe.palaces.map((palace: ZiweiPalaceRaw) => {
    const surrounded = typeof astrolabe.surroundedPalaces === 'function' ? astrolabe.surroundedPalaces(palace.name) : null
    return {
      index: palace.index ?? null,
      name: palace.name ?? null,
      name_zh: palace.name ?? null,
      heavenly_stem: palace.heavenlyStem ?? null,
      earthly_branch: palace.earthlyBranch ?? null,
      is_body_palace: palace.isBodyPalace ?? false,
      is_original_palace: palace.isOriginalPalace ?? false,
      major_stars: (palace.majorStars ?? []).map(serializeZiweiStar),
      minor_stars: (palace.minorStars ?? []).map(serializeZiweiStar),
      adjective_stars: (palace.adjectiveStars ?? [])
        .filter((star: ZiweiStarLike) => WHITELIST_ADJECTIVE_STARS.has(star?.name ?? ''))
        .map(serializeZiweiStar),
      changsheng12: palace.changsheng12 ?? null,
      decadal: palace.decadal ?? null,
      ages: palace.ages ?? [],
      surrounding: surrounded
        ? {
            target_zh: surrounded.target?.name ?? null,
            opposite_zh: surrounded.opposite?.name ?? null,
            wealth_zh: surrounded.wealth?.name ?? null,
            career_zh: surrounded.career?.name ?? null,
          }
        : null,
    }
  })

  const decadal = serializeHoroscopeLayer(horoscope.decadal)
  const yearly = serializeHoroscopeLayer(horoscope.yearly)
  const monthly = serializeHoroscopeLayer(horoscope.monthly)
  const sihuaConnections = {
    natal: computeSihuaConnections(palaces),
    decadal: computeSihuaConnections(createScopePalaces(palaces, decadal)),
    yearly: computeSihuaConnections(createScopePalaces(palaces, yearly)),
    monthly: computeSihuaConnections(createScopePalaces(palaces, monthly)),
  }

  const inPalaces = (names: readonly string[]) => (palace: SerializedPalace) =>
    names.includes((palace.name_zh ?? '') as (typeof names)[number])

  return {
    module: 'ziwei',
    metadata: {
      solar_date: astrolabe.solarDate ?? null,
      lunar_date: astrolabe.lunarDate ?? null,
      chinese_date: astrolabe.chineseDate ?? null,
      sign: astrolabe.sign ?? null,
      zodiac: astrolabe.zodiac ?? null,
      time: astrolabe.time ?? null,
      time_range: astrolabe.timeRange ?? null,
      soul: astrolabe.soul ?? null,
      body: astrolabe.body ?? null,
      five_elements_class: astrolabe.fiveElementsClass ?? null,
      earthly_branch_of_soul_palace: astrolabe.earthlyBranchOfSoulPalace ?? null,
      earthly_branch_of_body_palace: astrolabe.earthlyBranchOfBodyPalace ?? null,
      fix_leap: true,
    },
    palaces,
    current_horoscope: {
      _mode: 'standard',
      _note: 'standard 只含大限與流年；monthly 加流月；daily 加流日；hourly 永遠不輸出',
      decadal,
      yearly,
      monthly: null,
      daily: null,
    },
    horoscope_layers: {
      decadal,
      yearly,
      monthly,
      daily: null,
    },
    sihua_connections: sihuaConnections,
    reading_contexts: {
      personality: {
        palaces: palaces.filter(inPalaces(ZIWEI_THEME_PALACES.personality)),
        current_horoscope: { decadal, yearly },
        sihua_connections: {
          natal: filterZiweiConnectionsByPalaces(sihuaConnections.natal, ZIWEI_THEME_PALACES.personality),
          yearly: filterZiweiConnectionsByPalaces(sihuaConnections.yearly, ZIWEI_THEME_PALACES.personality),
        },
      },
      career: {
        palaces: palaces.filter(inPalaces(ZIWEI_THEME_PALACES.career)),
        sihua_connections: {
          natal: filterZiweiConnectionsByPalaces(sihuaConnections.natal, ZIWEI_THEME_PALACES.career),
          yearly: filterZiweiConnectionsByPalaces(sihuaConnections.yearly, ZIWEI_THEME_PALACES.career),
        },
      },
      love: {
        palaces: palaces.filter(inPalaces(ZIWEI_THEME_PALACES.love)),
        current_horoscope: { yearly },
        sihua_connections: {
          natal: filterZiweiConnectionsByPalaces(sihuaConnections.natal, ZIWEI_THEME_PALACES.love),
          yearly: filterZiweiConnectionsByPalaces(sihuaConnections.yearly, ZIWEI_THEME_PALACES.love),
        },
      },
      wealth: {
        palaces: palaces.filter(inPalaces(ZIWEI_THEME_PALACES.wealth)),
        current_horoscope: { decadal, yearly },
        sihua_connections: {
          natal: filterZiweiConnectionsByPalaces(sihuaConnections.natal, ZIWEI_THEME_PALACES.wealth),
          decadal: filterZiweiConnectionsByPalaces(sihuaConnections.decadal, ZIWEI_THEME_PALACES.wealth),
          yearly: filterZiweiConnectionsByPalaces(sihuaConnections.yearly, ZIWEI_THEME_PALACES.wealth),
        },
      },
      life_path: {
        palaces: palaces.filter(inPalaces(ZIWEI_THEME_PALACES.life_path)),
        current_horoscope: { decadal, yearly },
        sihua_connections: {
          natal: filterZiweiConnectionsByPalaces(sihuaConnections.natal, ZIWEI_THEME_PALACES.life_path),
          decadal: filterZiweiConnectionsByPalaces(sihuaConnections.decadal, ZIWEI_THEME_PALACES.life_path),
          yearly: filterZiweiConnectionsByPalaces(sihuaConnections.yearly, ZIWEI_THEME_PALACES.life_path),
        },
      },
      suggested_prompt: ZIWEI_SUGGESTED_PROMPT,
    },
    note: null,
  }
}
