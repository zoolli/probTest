import { ProbConfig } from "../extends/probConfig";

// 與底層共用標準介面
const probConfig = new ProbConfig();

export const Config = {
  // 機率版編
  probId: "20260304_01", // 編碼定義: 日期4碼+ 機率版本2碼 + _ + 內測版本1碼

  // 遊戲語系
  language: probConfig.language,

  // 設定值
  setting: probConfig.setting,

  // MA可設定機率期望值
  rtpMasterAgent: probConfig.rtpMasterAgent,

  // 後台資料設定
  gameSettingList: probConfig.gameSettingList,

  // 送獎List
  forceBingoList: probConfig.forceBingoList,

  // 其他相關設定 For GM
  extraInfo: probConfig.extraInfo,

  // [新手機率]調控
  gameRegulation: probConfig.gameRegulation,

  //
  payName: ["anyWays"],

  // [BuyFeature] BuyFeatureName
  buyFeatureName: { FG: "BuyFeatureFG", BG: "BuyFeatureBG" },

  // 機率期望值
  rtp: {
    rtp80: 80,
    rtp90: 90,
    rtp91: 91,
    rtp92: 92,
    rtp93: 93,
    rtp94: 94,
    rtp95: 95,
    rtp96: 96,
    rtp97: 97,
    rtp98: 98,
    rtp98_5: 98.5,
    rtp99: 99,
    rtp100: 100,
  },

  // 盤面直橫轉換索引
  reelPosition: [0, 5, 10, 1, 6, 11, 2, 7, 12, 3, 8, 13, 4, 9, 14],
  // 盤面索引轉換對應
  reelReIndex: [0, 3, 6, 9, 12, 1, 4, 7, 10, 13, 2, 5, 8, 11, 14],

  // Symbol 索引定義
  symbol: {
    S1: 0,
    S2: 1,
    S3: 2,
    S4: 3,
    S5: 4,
    A: 5,
    K: 6,
    Q: 7,
    J: 8,
    T: 9,
    N: 10,
    FG: 11,
    WD: 12,
    WD0: 13, // fgMode: 0
    WD1: 14, // fgMode: 1
    WD2: 15, // fgMode: 2
    WD3: 16, // fgMode: 3
    WD4: 17, // fgMode: 4
  },

  // 賠率定義
  payTable: [
    [0, 0, 50, 100, 1000], // SN_S1
    [0, 0, 35, 100, 800], // SN_S2
    [0, 0, 30, 100, 800], // SN_S3
    [0, 0, 20, 50, 300], // SN_S4
    [0, 0, 20, 35, 300], // SN_S5 (Red Packet)
    [0, 0, 15, 30, 200], // SN_A
    [0, 0, 15, 20, 200], // SN_K
    [0, 0, 10, 20, 150], // SN_Q
    [0, 0, 10, 15, 100], // SN_J
    [0, 0, 5, 15, 75], // SN_T
    [0, 0, 5, 10, 50], // SN_N
    [0, 0, 5, 10, 50], // SN_FG
    [0, 0, 0, 0, 0], // SN_WD
  ],

  // FG Type
  fgType: {
    Select1: 0,
    Select2: 1,
    Select3: 2,
    Select4: 3,
    Select5: 4,
    // SelectExtra: 5
  },

  // WD倍數定義
  WDMulti: [
    [2, 3, 5], // 1R: 2x 3x 5x
    [3, 5, 7], // 2R: 3x 5x 7x
    [5, 7, 11], // 3R: 5x 7x 11x
    [7, 11, 16], // 4R: 7x 11x 16x
    [11, 16, 30], // 5R: 11x 16x 30x
  ],

  // 2x 3x 5x  // 3x 5x 7x  // 5x 7x 11x  // 7x 11x 16x  // 11x 16x 30x
  WDMultiHighWeight: [
    // 5R
    [6, 4, 1],
    [7, 5, 1],
    [7, 5, 1],
    [8, 5, 1],
    [5, 2, 1],
  ],

  WDMultiLowWeight: [
    // 5R
    [9, 5, 1],
    [9, 6, 1],
    [9, 5, 1],
    [10, 5, 1],
    [5, 3, 1],
  ],

  // 紅包倍數定義
  S5Multi: [2, 5, 10, 15, 20, 50],

  // 2x 5x 10x 15x 20x 50x
  S5MultiHighWeight: [
    // 5R
    [16, 10, 5, 4, 2, 1],
    [16, 10, 6, 4, 2, 1],
    [16, 11, 7, 4, 2, 1],
    [16, 10, 7, 4, 2, 1],
    [10, 10, 7, 4, 2, 1],
  ],

  S5MultiLowWeight: [
    // 5R
    [14, 13, 5, 4, 2, 1],
    [14, 10, 6, 4, 2, 1],
    [12, 11, 6, 4, 2, 1],
    [11, 9, 7, 4, 2, 1],
    [10, 10, 7, 4, 2, 1],
  ],

  // [BuyFeature]
  // 2x 3x 5x  // 3x 5x 7x  // 5x 7x 11x  // 7x 11x 16x  // 11x 16x 30x
  WDMultiHighWeightBF: [
    // 5R
    [6, 3, 2], // 50.04
    [6, 4, 2], // 50.36
    [6, 3, 2], // 50.25
    [7, 5, 2], // 50.26
    [2, 2, 1], // 50.14
  ],

  WDMultiLowWeightBF: [
    // 5R
    [8, 2, 1], // 39.62
    [8, 2, 1], // 39.83
    [9, 2, 1], // 40.78
    [9, 1, 1], // 40.36
    [8, 2, 1], // 39.69
  ],

  // 2x 5x 10x 15x 20x 50x
  S5MultiHighWeightBF: [
    // 5R
    [16, 10, 7, 4, 2, 1],
    [16, 10, 7, 4, 2, 1],
    [16, 10, 7, 4, 2, 1],
    [16, 10, 7, 4, 2, 1],
    [16, 10, 7, 4, 2, 1],
  ],

  S5MultiLowWeightBF: [
    // 5R
    [14, 13, 5, 4, 2, 1],
    [14, 13, 5, 4, 2, 1],
    [14, 13, 5, 4, 2, 1],
    [14, 13, 5, 4, 2, 1],
    [14, 13, 5, 4, 2, 1],
  ],
};
