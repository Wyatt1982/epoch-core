import type { RectificationData } from './rectification'

export function generateRectificationPrompt(input: {
  name: string
  gender: string
  year: number
  month: number
  day: number
  data: RectificationData
  userQuestion?: string
}) {
  const hourTable = input.data.hourly_palaces
    .map(
      hour =>
        `${hour.hour_name} → 紫微命宮：${hour.life_house_branch || '未知'}宮 ${hour.life_house_stars}｜西洋上升參考：${hour.ascendant}`,
    )
    .join('\n')

  const extraQuestion = input.userQuestion?.trim() ? `\n## 我另外想問\n${input.userQuestion.trim()}\n` : ''

  return `# 命盤定盤請求

## 基本資料
姓名：${input.name}
性別：${input.gender}
生日：${input.year}年${input.month}月${input.day}日
出生時間：未知

---
## 排盤口徑
紫微斗數：三合派（古籍安星訣）算法
西洋占星：Tropical / Placidus / True Node
八字：子平法

---

## 八字（時柱未知）
年柱：${input.data.bazi_without_time.year}
月柱：${input.data.bazi_without_time.month}
日柱：${input.data.bazi_without_time.day}
時柱：待定盤確認
日主：${input.data.bazi_without_time.day_master}（${input.data.bazi_without_time.day_master_element}）

---

## 12個時辰的命盤差異
不同出生時辰，會產生不同的命宮主星與上升傾向：

${hourTable}

---

## 定盤請求
我不知道自己的出生時辰，請你擔任命理師，透過以下步驟幫我縮小時辰範圍。

### 第一輪：外貌與個性（3個問題）
請先問我外貌特徵、氣質與第一印象相關問題，用來對照不同的紫微命宮主星與西洋上升傾向。

例如：
- 你的臉型偏圓、偏長、偏方還是線條明顯？
- 你給人的第一印象是溫和、冷靜、強勢還是聰明機敏？
- 你在人群中通常低調，還是容易被注意到？

### 第二輪：人生重大事件（3個問題）
請再問我幾個重大人生事件與年份，用來對照不同時辰的大限流年與命盤結構。

例如：
- 人生第一個重大轉折大約發生在幾歲？
- 有沒有某段時期特別順，或特別卡、特別低潮？
- 感情、婚姻、分手、同居、搬家、轉職，哪一年變化最明顯？

### 第三輪：給出候選時辰
根據我的回答，請列出 2 到 3 個最可能的時辰，並說明每個時辰的命盤特質、判斷依據與仍待驗證之處。

### 最後
請告訴我下一步應該用哪個時辰去重新排盤驗證，以及驗證時要特別注意哪些命盤特徵。
在證據不足前，不要把任何一個時辰當作已經完全確定。
${extraQuestion}

---

請開始定盤，從第一輪的第一個問題開始。`
}
