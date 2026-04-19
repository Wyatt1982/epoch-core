// 命盤 orchestrator：組合四個模組（bazi / ziwei / western / jyotish）成最終輸出。
import { buildJyotishPayload } from './jyotish'
import { generatePrompt } from './prompt'
import type {
  ChartRequestInput,
  ChartResponse,
  ChartPayload,
  JyotishModule,
} from './types'
import { calculateRectification, type RectificationData } from './rectification'
import { getTimeZhiLabel, TIME_ZHI_OPTIONS } from './timeZhi'
import { RECTIFICATION_ASK_USER_FOR } from './constants'
import {
  cloneJson,
  formatBirthDatetimeLocal,
  formatClock,
  getSwissEph,
  pad2,
  resolveTimezoneName,
  toBirthUtcDate,
} from './shared'
import { buildBaziModule } from './bazi/module'
import { buildZiweiModule } from './ziwei/module'
import { buildWesternModule } from './western/module'

function getRectificationInfo(needed: boolean, data?: RectificationData) {
  return {
    needed,
    reason: needed
      ? '使用者不知道出生時間，紫微斗數多數欄位、八字時柱與西洋占星宮位/四軸/相位都無法直接確定。'
      : '出生時間已知，不需啟動定盤流程。',
    strategy: needed
      ? '先輸出不依賴出生時間的已知資料，再由 LLM 分輪提問，縮小到 2 到 3 個候選時段。'
      : '直接使用完整命盤資料解讀。',
    candidate_time_slots: TIME_ZHI_OPTIONS.map(option => ({
      hour_index: option.value,
      label: option.label,
    })),
    ask_user_for: [...RECTIFICATION_ASK_USER_FOR],
    llm_instruction: needed
      ? '請啟動定盤機制：先不要直接解盤，先提出高鑑別度問題，根據回答逐步縮小可能出生時段，並在每輪結尾列出目前最可能的候選時段。'
      : '可直接進入命盤解讀。',
    hourly_palaces: data?.hourly_palaces ?? [],
    bazi_without_time: data?.bazi_without_time ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAggregatedReadingContexts(chart: Record<string, any>) {
  return {
    personality: {
      suggested_prompt: chart.western?.reading_contexts?.personality?.suggested_prompt ?? null,
      western: cloneJson(chart.western?.reading_contexts?.personality ?? null),
      ziwei: cloneJson(chart.ziwei?.reading_contexts?.personality ?? null),
      bazi: {
        four_pillars: cloneJson(chart.bazi?.four_pillars ?? null),
        season_context: cloneJson(chart.bazi?.season_context ?? null),
        five_elements: cloneJson(chart.bazi?.five_elements ?? null),
        five_elements_note: chart.bazi?.five_elements_note ?? null,
        shen_sha_summary: cloneJson(chart.bazi?.shen_sha_summary ?? null),
      },
      jyotish: cloneJson(chart.jyotish?.reading_contexts?.personality ?? null),
    },
    career: {
      suggested_prompt: chart.western?.reading_contexts?.career?.suggested_prompt ?? null,
      western: cloneJson(chart.western?.reading_contexts?.career ?? null),
      ziwei: cloneJson(chart.ziwei?.reading_contexts?.career ?? null),
      bazi: {
        da_yun: cloneJson(chart.bazi?.da_yun ?? null),
        season_context: cloneJson(chart.bazi?.season_context ?? null),
      },
      jyotish: cloneJson(chart.jyotish?.reading_contexts?.career ?? null),
    },
    love: {
      suggested_prompt: chart.western?.reading_contexts?.love?.suggested_prompt ?? null,
      western: cloneJson(chart.western?.reading_contexts?.love ?? null),
      ziwei: cloneJson(chart.ziwei?.reading_contexts?.love ?? null),
      bazi: {
        four_pillars: cloneJson(chart.bazi?.four_pillars ?? null),
        season_context: cloneJson(chart.bazi?.season_context ?? null),
      },
      jyotish: null,
    },
    wealth: {
      suggested_prompt: chart.western?.reading_contexts?.wealth?.suggested_prompt ?? null,
      western: cloneJson(chart.western?.reading_contexts?.wealth ?? null),
      ziwei: cloneJson(chart.ziwei?.reading_contexts?.wealth ?? null),
      bazi: {
        shen_sha_summary: cloneJson(chart.bazi?.shen_sha_summary ?? null),
        season_context: cloneJson(chart.bazi?.season_context ?? null),
      },
      jyotish: null,
    },
    life_path: {
      suggested_prompt: chart.western?.reading_contexts?.life_path?.suggested_prompt ?? null,
      western: cloneJson(chart.western?.reading_contexts?.life_path ?? null),
      ziwei: cloneJson(chart.ziwei?.reading_contexts?.life_path ?? null),
      bazi: {
        four_pillars: cloneJson(chart.bazi?.four_pillars ?? null),
        season_context: cloneJson(chart.bazi?.season_context ?? null),
        da_yun: {
          current: cloneJson(chart.bazi?.da_yun?.current ?? null),
          current_liu_nian: cloneJson(chart.bazi?.da_yun?.current_liu_nian ?? []),
        },
      },
      jyotish: cloneJson(chart.jyotish?.reading_contexts?.dasha_forecast ?? null),
    },
  }
}

export async function buildChartResponse(input: ChartRequestInput): Promise<ChartResponse> {
  const birthTimeKnown = !(input.birthTimeUnknown || input.hourIndex === null)
  const rectificationData =
    !birthTimeKnown
      ? calculateRectification({
          year: input.year,
          month: input.month,
          day: input.day,
          gender: input.gender,
        })
      : undefined

  const swe = birthTimeKnown ? await getSwissEph() : null
  const birthUtcDate = birthTimeKnown ? toBirthUtcDate(input) : null
  const julianDayUT = birthUtcDate && swe
    ? swe.utc_to_jd(
        birthUtcDate.getUTCFullYear(),
        birthUtcDate.getUTCMonth() + 1,
        birthUtcDate.getUTCDate(),
        birthUtcDate.getUTCHours(),
        birthUtcDate.getUTCMinutes(),
        birthUtcDate.getUTCSeconds(),
        swe.SE_GREG_CAL,
      ).julianDayUT
    : null

  const western = await buildWesternModule(input)
  const bazi = buildBaziModule(input)
  const ziwei = buildZiweiModule(input)
  const jyotish = buildJyotishPayload({
    swe,
    julianDayUT,
    birthDateUtc: birthUtcDate,
    latitude: input.latitude,
    longitude: input.longitude,
    birthTimeKnown,
  }) as JyotishModule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const westernPlacidus = (western.planets?.placidus ?? {}) as Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ziweiPalaces = (Array.isArray(ziwei.palaces) ? ziwei.palaces : []) as Array<Record<string, any>>
  const isRelocated = !(
    Math.abs(input.latitude - input.currentLocation.latitude) < 0.01 &&
    Math.abs(input.longitude - input.currentLocation.longitude) < 0.01
  )

  const chart: ChartPayload = {
    schema_version: '2.0.0',
    generated_at: new Date().toISOString(),
    profile: {
      name: input.name,
      gender: input.gender,
      birth_time_known: birthTimeKnown,
      birth_datetime_local: birthTimeKnown ? formatBirthDatetimeLocal(input) : null,
      birth_datetime_utc: birthTimeKnown ? toBirthUtcDate(input).toISOString().replace('.000', '') : null,
      birth: {
        solar: birthTimeKnown
          ? `${input.year}-${pad2(input.month)}-${pad2(input.day)} ${formatClock(input.hour, input.minute)}`
          : `${input.year}-${pad2(input.month)}-${pad2(input.day)}（出生時間未知）`,
        lunar: bazi.lunar_date,
        chinese_date: typeof ziwei.metadata?.chinese_date === 'string' ? ziwei.metadata.chinese_date : null,
        time_zhi: birthTimeKnown && input.hourIndex !== null ? getTimeZhiLabel(input.hourIndex) : '未知',
        birth_time_known: birthTimeKnown,
      },
      birth_location: {
        city: input.city,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone_offset: input.timezoneOffset,
        timezone_offset_standard: input.timezoneOffsetStandard,
        timezone_offset_at_birth: input.timezoneOffset,
        timezone_name: resolveTimezoneName(input),
        dst_in_effect: input.dstInEffect,
      },
      current_location: {
        city: input.currentLocation.city,
        latitude: input.currentLocation.latitude,
        longitude: input.currentLocation.longitude,
      },
      is_relocated: isRelocated,
    },
    summary: {
      bazi: {
        four_pillars: bazi.summary?.four_pillars ?? null,
        day_master: bazi.summary?.day_master ?? null,
        day_master_element: bazi.summary?.day_master_element ?? null,
        day_master_strength_hint: bazi.summary?.day_master_strength_hint ?? null,
        current_da_yun: bazi.da_yun?.current?.gan_zhi ?? null,
      },
      ziwei: {
        life_house_zh: ziweiPalaces.find(palace => palace.is_original_palace)?.earthly_branch ?? null,
        body_house_zh: ziweiPalaces.find(palace => palace.is_body_palace)?.earthly_branch ?? null,
        soul: typeof ziwei.metadata?.soul === 'string' ? ziwei.metadata.soul : null,
        body: typeof ziwei.metadata?.body === 'string' ? ziwei.metadata.body : null,
      },
      western: {
        sun_sign_zh: westernPlacidus.sun?.sign_zh ?? null,
        ascendant_zh: western.angles?.asc?.sign_zh ?? null,
        midheaven_zh: western.angles?.mc?.sign_zh ?? null,
      },
      jyotish: {
        lagna_sign_zh: jyotish.lagna?.sign_zh ?? null,
        moon_nakshatra_zh: jyotish.nakshatras?.moon_nakshatra?.name_zh ?? null,
        current_maha_dasha: jyotish.dashas?.current_maha_dasha?.planet ?? null,
        current_antar_dasha: jyotish.dashas?.current_antar_dasha?.planet ?? null,
      },
    },
    bazi,
    ziwei,
    western,
    jyotish,
    rectification: getRectificationInfo(Boolean(input.birthTimeUnknown || input.hourIndex === null), rectificationData),
    usage_stats: {
      enabled: false,
      provider: 'disabled',
      persistence: 'none',
      total_charts_generated: null,
      total_unique_visitors: null,
      visitor_ordinal: null,
      visitor_id_basis: 'browser-local-storage',
      note: '計數器尚未掛載。',
    },
    provenance: {
      bazi_engine: 'lunar-typescript',
      ziwei_engine: 'iztro',
      western_engine: 'swisseph-wasm',
      jyotish_engine: 'swisseph-wasm',
      western_house_system: 'Placidus',
      western_zodiac: 'Tropical',
      notes: [
        '西洋占星同時輸出 Placidus 與 Whole Sign。',
        '紫微飛星連線以本命宮干與當層星曜對位計算。',
        'Jyotish 採 Lahiri Ayanamsa 與 Whole Sign house。',
      ],
    },
  }

  chart.reading_contexts = buildAggregatedReadingContexts(chart)
  const prompt = generatePrompt({
    chart,
    rectificationData,
  })

  return { chart, prompt }
}
