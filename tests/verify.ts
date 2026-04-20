import { testCases } from './testCases'
import { calculateBazi } from '../src/bazi/calc'
import { calculateZiwei } from '../src/ziwei/calc'
import { getSunSign } from '../src/western/sunSign'
import { buildChartResponse } from '../src/buildChartResponse'
import { calculateLifePath, calculateBirthdayNumber, calculatePersonalYear } from '../src/numerology/calc'

type UnknownBaziSection = {
  four_pillars?: {
    time?: {
      known?: boolean
      text?: string
    }
  }
}

type UnknownZiweiSection = {
  palaces?: unknown[]
}

type UnknownWesternSection = {
  planets?: {
    placidus?: Record<string, unknown>
    whole_sign?: Record<string, unknown>
  }
}

type RectificationHourView = {
  hour_index?: number
  hour_name?: string
  life_house_stars?: string
}

async function runVerification() {
  console.log('🔍 開始驗證命盤計算...\n')

  let passed = 0
  let failed = 0
  const errors: string[] = []

  for (const tc of testCases) {
    console.log(`📋 ${tc.name}`)

    // 跳過未填入答案的案例（目前策略：bazi.day 為空就跳過）
    if (!tc.expected.bazi.day) {
      console.log(`   ⏭️  跳過（尚未填入預期八字答案）\n`)
      continue
    }

    const baziResult = calculateBazi(tc.input)
    const ziweiResult = calculateZiwei(tc.input)
    const sunSign = getSunSign(tc.input.month, tc.input.day)

    const baziChecks = [
      { label: '年柱', got: baziResult.year, want: tc.expected.bazi.year },
      { label: '月柱', got: baziResult.month, want: tc.expected.bazi.month },
      { label: '日柱', got: baziResult.day, want: tc.expected.bazi.day },
      { label: '時柱', got: baziResult.time, want: tc.expected.bazi.time },
    ]

    for (const check of baziChecks) {
      if (check.got === check.want) {
        console.log(`   ✅ 八字${check.label}：${check.got}`)
        passed++
      } else {
        console.log(`   ❌ 八字${check.label}：預期 ${check.want}，實際 ${check.got}`)
        failed++
        errors.push(`${tc.name} - 八字${check.label}`)
      }
    }

    // 僅針對基準案例：驗證大運 + 五行（需符合規格文件中的陳伯瑋數值）
    if (tc.id === 'case-001') {
      if (baziResult.currentDaYun === '丁未') {
        console.log(`   ✅ 目前大運：${baziResult.currentDaYun}`)
        passed++
      } else {
        console.log(`   ❌ 目前大運：預期 丁未，實際 ${baziResult.currentDaYun || ''}`)
        failed++
        errors.push(`${tc.name} - 目前大運`)
      }

      if (baziResult.daYunAge === 43) {
        console.log(`   ✅ 大運起歲：${baziResult.daYunAge}`)
        passed++
      } else {
        console.log(`   ❌ 大運起歲：預期 43，實際 ${baziResult.daYunAge || ''}`)
        failed++
        errors.push(`${tc.name} - 大運起歲`)
      }

      const fire = baziResult.wuXing.fire ?? 0
      const metal = baziResult.wuXing.metal ?? 0
      if (fire > 0 && metal > 0) {
        console.log(`   ✅ 五行包含火與金：火${fire} 金${metal}`)
        passed++
      } else {
        console.log(`   ❌ 五行包含火與金：火${fire} 金${metal}`)
        failed++
        errors.push(`${tc.name} - 五行包含火與金`)
      }
    }

    if (ziweiResult.lifeHouse === tc.expected.ziwei.lifeHouse) {
      console.log(`   ✅ 紫微命宮：${ziweiResult.lifeHouse}`)
      passed++
    } else {
      console.log(
        `   ❌ 紫微命宮：預期 ${tc.expected.ziwei.lifeHouse}，實際 ${ziweiResult.lifeHouse}`,
      )
      failed++
      errors.push(`${tc.name} - 紫微命宮`)
    }

    if (sunSign === tc.expected.western.sunSign) {
      console.log(`   ✅ 太陽星座：${sunSign}`)
      passed++
    } else {
      console.log(`   ❌ 太陽星座：預期 ${tc.expected.western.sunSign}，實際 ${sunSign}`)
      failed++
      errors.push(`${tc.name} - 太陽星座`)
    }

    console.log('')
  }

  // ==========================================
  // 生命靈數驗證（基準案例 1982-02-25）
  // 生命路徑數 11（主數）、生日數 7、個人年 2026 = 1
  // ==========================================
  console.log('📋 生命靈數（Pythagorean）')

  const lpResult = calculateLifePath(1982, 2, 25)
  if (lpResult.number === 11 && lpResult.isMaster === true) {
    console.log(`   ✅ 生命路徑數：${lpResult.number}（主數 ${lpResult.isMaster}）`)
    passed++
  } else {
    console.log(`   ❌ 生命路徑數：預期 11（主數），實際 ${lpResult.number}（isMaster=${lpResult.isMaster}）`)
    failed++
    errors.push('生命靈數 - 生命路徑數')
  }

  const bdResult = calculateBirthdayNumber(25)
  if (bdResult.number === 7) {
    console.log(`   ✅ 生日數：${bdResult.number}`)
    passed++
  } else {
    console.log(`   ❌ 生日數：預期 7，實際 ${bdResult.number}`)
    failed++
    errors.push('生命靈數 - 生日數')
  }

  const pyResult = calculatePersonalYear(2, 25, 2026)
  if (pyResult.number === 1 && pyResult.year === 2026) {
    console.log(`   ✅ 個人年 ${pyResult.year}：${pyResult.number}`)
    passed++
  } else {
    console.log(`   ❌ 個人年 2026：預期 1，實際 ${pyResult.number}`)
    failed++
    errors.push('生命靈數 - 個人年')
  }

  console.log('')

  console.log('📋 未知出生時間定盤模式')
  const unknownTimeResult = await buildChartResponse({
    name: '未知時間測試',
    gender: '男',
    year: 1982,
    month: 2,
    day: 25,
    hour: 12,
    minute: 0,
    hourIndex: null,
    birthTimeUnknown: true,
    city: '台北',
    latitude: 25.033,
    longitude: 121.5654,
    timezoneOffset: 8,
    timezoneOffsetStandard: 8,
    timezoneName: 'Asia/Taipei',
    dstInEffect: false,
    currentLocation: {
      city: '台北',
      latitude: 25.033,
      longitude: 121.5654,
    },
  })

  const unknownBazi = unknownTimeResult.chart.bazi as UnknownBaziSection
  const unknownZiwei = unknownTimeResult.chart.ziwei as UnknownZiweiSection
  const unknownWestern = unknownTimeResult.chart.western as UnknownWesternSection
  const rectificationHours = (unknownTimeResult.chart.rectification?.hourly_palaces ?? []) as RectificationHourView[]
  const xuHour = rectificationHours.find((item: RectificationHourView) => item.hour_index === 10)

  const unknownTimeChecks = [
    {
      label: '出生時間標記',
      ok: unknownTimeResult.chart.profile.birth.birth_time_known === false,
      detail: `birth_time_known=${unknownTimeResult.chart.profile.birth.birth_time_known}`,
    },
    {
      label: '定盤模式啟動',
      ok: unknownTimeResult.chart.rectification?.needed === true,
      detail: `rectification.needed=${unknownTimeResult.chart.rectification?.needed}`,
    },
    {
      label: '八字時柱留空',
      ok: unknownBazi?.four_pillars?.time?.known === false && unknownBazi?.four_pillars?.time?.text === '',
      detail: `time.known=${String(unknownBazi?.four_pillars?.time?.known)} text=${unknownBazi?.four_pillars?.time?.text || '(empty)'}`,
    },
    {
      label: '紫微宮位留空',
      ok: Array.isArray(unknownZiwei?.palaces) && unknownZiwei.palaces.length === 0,
      detail: `palaces=${Array.isArray(unknownZiwei?.palaces) ? unknownZiwei.palaces.length : 'invalid'}`,
    },
    {
      label: '西占行星宮位留空',
      ok:
        Object.keys(unknownWestern?.planets?.placidus ?? {}).length === 0 &&
        Object.keys(unknownWestern?.planets?.whole_sign ?? {}).length === 0,
      detail: `placidus=${Object.keys(unknownWestern?.planets?.placidus ?? {}).length} whole_sign=${Object.keys(unknownWestern?.planets?.whole_sign ?? {}).length}`,
    },
    {
      label: 'Prompt 啟動定盤指令',
      ok: unknownTimeResult.prompt.includes('12個時辰的命盤差異') && unknownTimeResult.prompt.includes('第一輪：外貌與個性'),
      detail: 'prompt includes 12個時辰的命盤差異 + 第一輪：外貌與個性',
    },
    {
      label: '12個時辰差異表完整',
      ok: Array.isArray(rectificationHours) && rectificationHours.length === 12,
      detail: `hourly_palaces=${Array.isArray(rectificationHours) ? rectificationHours.length : 'invalid'}`,
    },
    {
      label: '戌時列已生成',
      ok: Boolean(xuHour?.hour_name?.includes('戌時') && xuHour?.life_house_stars),
      detail: `hour_index=10 ${xuHour?.hour_name || 'missing'} ${xuHour?.life_house_stars || ''}`,
    },
  ]

  for (const check of unknownTimeChecks) {
    if (check.ok) {
      console.log(`   ✅ ${check.label}`)
      passed++
    } else {
      console.log(`   ❌ ${check.label}：${check.detail}`)
      failed++
      errors.push(`未知出生時間定盤模式 - ${check.label}`)
    }
  }

  if (xuHour) {
    console.log(`   ℹ️ 戌時（hour_index=10）目前命宮主星：${xuHour.life_house_stars}`)
  }

  console.log('')

  console.log('─────────────────────')
  console.log(`結果：✅ ${passed} 通過　❌ ${failed} 失敗`)

  if (errors.length > 0) {
    console.log('\n需要修正的項目：')
    errors.forEach(e => console.log(`  • ${e}`))
    process.exitCode = 1
  } else {
    console.log('\n🎉 所有測試通過！')
  }
}

runVerification()
