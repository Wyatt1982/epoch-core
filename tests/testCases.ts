import type { BirthInput } from '../src/bazi/calc'

type ExpectedCase = {
  bazi: {
    year: string
    month: string
    day: string
    time: string
    dayMaster: string
    dayMasterElement: string
  }
  ziwei: {
    lifeHouse: string
    lifeStar: string
    mingZhu: string
    shenZhu: string
  }
  western: {
    sunSign: string
  }
}

export type VerificationCase = {
  id: string
  name: string
  input: BirthInput
  expected: ExpectedCase
}

export const testCases: VerificationCase[] = [
  // ==========================================
  // 案例一：基準案例（已知正確答案）
  // ==========================================
  {
    id: 'case-001',
    name: '陳伯瑋（基準案例）',
    input: {
      year: 1982,
      month: 2,
      day: 25,
      hourIndex: 10, // 戌時（19:00-21:00）= index 10
      gender: '男',
    },
    expected: {
      bazi: {
        year: '壬戌',
        month: '壬寅',
        day: '己卯',
        time: '甲戌',
        dayMaster: '己',
        dayMasterElement: '土',
      },
      ziwei: {
        lifeHouse: '巳',
        lifeStar: '七殺',
        mingZhu: '武曲',
        shenZhu: '文昌',
      },
      western: {
        sunSign: '雙魚座',
      },
    },
  },

  // ==========================================
  // 案例二：子時換日邊界測試
  // ==========================================
  {
    id: 'case-002',
    name: '子時換日邊界（請至網站查正確答案填入）',
    input: {
      year: 1990,
      month: 6,
      day: 15,
      hourIndex: 11, // 亥時（21:00-23:00）= index 11
      gender: '女',
    },
    expected: {
      bazi: {
        year: '', // 待填入
        month: '',
        day: '',
        time: '',
        dayMaster: '',
        dayMasterElement: '',
      },
      ziwei: {
        lifeHouse: '',
        lifeStar: '',
        mingZhu: '',
        shenZhu: '',
      },
      western: {
        sunSign: '雙子座',
      },
    },
  },

  // ==========================================
  // 案例三：立春前後換年測試
  // ==========================================
  {
    id: 'case-003',
    name: '立春換年邊界（請至網站查正確答案填入）',
    input: {
      year: 1984,
      month: 2,
      day: 3, // 立春前一天
      hourIndex: 4, // 辰時
      gender: '男',
    },
    expected: {
      bazi: {
        year: '癸亥', // 立春前應為癸亥年
        month: '',
        day: '',
        time: '',
        dayMaster: '',
        dayMasterElement: '',
      },
      ziwei: {
        lifeHouse: '',
        lifeStar: '',
        mingZhu: '',
        shenZhu: '',
      },
      western: {
        sunSign: '水瓶座',
      },
    },
  },

  // ==========================================
  // 案例四：農曆閏月測試
  // ==========================================
  {
    id: 'case-004',
    name: '農曆閏月測試（請至網站查正確答案填入）',
    input: {
      year: 2001,
      month: 5,
      day: 20,
      hourIndex: 2, // 寅時
      gender: '女',
    },
    expected: {
      bazi: {
        year: '',
        month: '',
        day: '',
        time: '',
        dayMaster: '',
        dayMasterElement: '',
      },
      ziwei: {
        lifeHouse: '',
        lifeStar: '',
        mingZhu: '',
        shenZhu: '',
      },
      western: {
        sunSign: '雙子座',
      },
    },
  },

  // ==========================================
  // 案例五：年底換年測試
  // ==========================================
  {
    id: 'case-005',
    name: '年底換年邊界（請至網站查正確答案填入）',
    input: {
      year: 2000,
      month: 12,
      day: 31,
      hourIndex: 0, // 子時
      gender: '男',
    },
    expected: {
      bazi: {
        year: '',
        month: '',
        day: '',
        time: '',
        dayMaster: '',
        dayMasterElement: '',
      },
      ziwei: {
        lifeHouse: '',
        lifeStar: '',
        mingZhu: '',
        shenZhu: '',
      },
      western: {
        sunSign: '摩羯座',
      },
    },
  },
]
