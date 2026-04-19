import type { ChartPayload } from './types'
import type { RectificationData } from './rectification'
import { generateRectificationPrompt } from './rectificationPrompt'

export interface GeneratePromptInput {
  chart: ChartPayload
  rectificationData?: RectificationData
  userQuestion?: string
}

function buildKnownTimePrompt(chart: ChartPayload, userQuestion?: string) {
  const profile = chart?.profile ?? {}
  const summary = chart?.summary ?? {}
  const bazi = chart?.bazi ?? {}
  const ziwei = chart?.ziwei ?? {}
  const western = chart?.western ?? {}
  const jyotish = chart?.jyotish ?? {}

  const currentYogas = Array.isArray(jyotish?.yogas?.present)
    ? jyotish.yogas.present.map((item: any) => item?.name_zh ?? item?.name).filter(Boolean).join('、')
    : ''

  const ziweiLifePalace = Array.isArray(ziwei?.palaces)
    ? ziwei.palaces.find((item: any) => item?.is_original_palace)?.name_zh ?? null
    : null

  const question = userQuestion?.trim() || '（請在這裡填入你這次最想聚焦的問題，例如感情、工作、關係、財務或近期運勢）'

  return `# 三盤命理解讀請求

請根據以下 v2.0 結構化命盤資料進行整合解讀。
重點是把八字、紫微斗數、西洋占星與 Jyotish 串成同一條敘事線，不要各說各話。

---
## 基本資料
姓名：${profile?.name ?? '未命名'}
性別：${profile?.gender ?? '未知'}
出生：${profile?.birth?.solar ?? '未知'}
出生地：${profile?.birth_location?.city ?? '未知'}
現居地：${profile?.current_location?.city ?? '未知'}
搬遷盤：${profile?.is_relocated ? '是，請同步參考 relocated houses' : '否'}

---
## 八字摘要
四柱：${summary?.bazi?.four_pillars ?? '待補'}
日主：${summary?.bazi?.day_master ?? '待補'}（${summary?.bazi?.day_master_element ?? '待補'}）
目前大運：${summary?.bazi?.current_da_yun ?? '待補'}
神煞摘要：${Array.isArray(bazi?.shen_sha_summary?.auspicious) ? bazi.shen_sha_summary.auspicious.join('、') || '無' : '無'} / ${
    Array.isArray(bazi?.shen_sha_summary?.inauspicious) ? bazi.shen_sha_summary.inauspicious.join('、') || '無' : '無'
  }

---
## 紫微摘要
命宮定位：${ziweiLifePalace ?? summary?.ziwei?.life_house_zh ?? '待補'}
身宮：${summary?.ziwei?.body_house_zh ?? '待補'}
命主：${summary?.ziwei?.soul ?? '待補'}　身主：${summary?.ziwei?.body ?? '待補'}
本次請優先參考：major_stars、mutagen_mapped、sihua_connections、surrounding。

---
## 西洋占星摘要
太陽星座：${summary?.western?.sun_sign_zh ?? '待補'}
上升：${summary?.western?.ascendant_zh ?? '待補'}
天頂：${summary?.western?.midheaven_zh ?? '待補'}
Sect：${western?.meta?.sect ?? '待補'}
請優先參考：planets.placidus、houses.placidus、aspects、patterns、chart_stats。

---
## Jyotish 摘要
Lagna：${summary?.jyotish?.lagna_sign_zh ?? '待補'}
月亮宿：${summary?.jyotish?.moon_nakshatra_zh ?? '待補'}
當前 Maha Dasha：${summary?.jyotish?.current_maha_dasha ?? '待補'}
重點 Yoga：${currentYogas || '無'}

---
## 解讀規則
1. 先用共通主題整合四套系統，不要分成四篇互不相干的小作文。
2. 如果資料中某欄位是 null，代表未啟用或不確定，不要腦補。
3. 西洋占星請直接信任 absolute_degree、aspect、is_applying、dignity。
4. 紫微請以 major_stars、mutagen_mapped、sihua_connections 為主，雜曜只當修飾。
5. Jyotish 請把 Nakshatra 與 Dasha 當成核心時間線。
6. 避免宿命論，把衝突相位與化忌解讀為需要主動處理的課題。

---
## 我想問的問題
${question}

---
## 請輸出
1. 核心人格與內在驅動
2. 目前人生主軸與正在發展的課題
3. 關係 / 事業 / 財務中最值得優先處理的一項
4. 未來 3 到 6 個月的實際建議
`
}

export function generatePrompt(input: GeneratePromptInput): string {
  const chart = input.chart
  const birthTimeKnown = Boolean(chart?.profile?.birth_time_known)

  if (!birthTimeKnown && input.rectificationData) {
    return generateRectificationPrompt({
      name: chart?.profile?.name ?? '未命名',
      gender: chart?.profile?.gender ?? '未知',
      year: Number(String(chart?.profile?.birth?.solar ?? '').slice(0, 4)) || 0,
      month: Number(String(chart?.profile?.birth?.solar ?? '').slice(5, 7)) || 0,
      day: Number(String(chart?.profile?.birth?.solar ?? '').slice(8, 10)) || 0,
      data: input.rectificationData,
      userQuestion: input.userQuestion,
    })
  }

  return buildKnownTimePrompt(chart, input.userQuestion)
}
