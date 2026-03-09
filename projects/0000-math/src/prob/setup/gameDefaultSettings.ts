export const gameDefault = {
  DEFAULT: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 1,000,000
    totalWinLimit: [0, 1000000],
    // 押注群組
    betList: [
      0.5,
      1,
      1.5,
      2.5,
      5,
      7.5,
      10,
      12.5,
      15,
      20,
      25,
      50,
      75,
      100,
      125,
      150,
      200,
      250,
      300,
      350,
      400,
      450,
      500,
      550,
      600,
    ],
    // 押注上限
    betLimit: [0, 10000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 10000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 10000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
    // 啟動基金
    gameRegulation: {
      newbie: {
        startupCapital: {
          base: 15000,
          commission: 0.4, // 新手期間
          limit: 30000,
        },
      },
    },
    // [BuyFeature] 開關購買遊戲功能 0: fslse, 1: true
    isOpenBuyFeature: ["False", "True"],
    // [BuyFeature] 購買遊戲押注上限
    buyFeatureBetMax: [0, 20000 * 100],
    // [controlRTP] 開關機率調控
    controlRTP: ["False", "True"],

    // [controlNewbie] 開關新手功能
    controlNewbie: ["False", "True"],
  },
  /*
  CNY: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 1,000,000
    totalWinLimit: [0, 1000000],
    // 押注群組
    betList: [
      0.5,
      1,
      1.5,
      2.5,
      5,
      7.5,
      10,
      12.5,
      15,
      20,
      25,
      50,
      75,
      100,
      125,
      150,
      200,
      250,
      300,
      350,
      400,
      450,
      500,
      550,
      600,
    ],
    // 押注上限
    betLimit: [0, 10000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 10000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 10000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
  },
  USD: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 1,000,000
    totalWinLimit: [0, 500000],
    // 押注群組
    betList: [0.5, 1, 1.5, 2, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 50, 75, 100],
    // 押注上限
    betLimit: [0, 10000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 10000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 10000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
  },
  MABU: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 1,000,000
    totalWinLimit: [0, 5000000000000],
    // 押注群組
    betList: [
      2000,
      3000,
      4000,
      5000,
      6000,
      8000,
      10000,
      15000,
      20000,
      25000,
      30000,
      50000,
      100000,
      200000,
      250000,
      300000,
      500000,
      1000000,
      1500000,
      2000000,
      2500000,
      3000000,
      3500000,
      4000000,
      5000000,
      6000000,
      7000000,
      8000000,
      9000000,
      10000000,
    ],
    // 押注上限
    betLimit: [0, 50000000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 50000000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 50000000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
    levelThreshold: [],
    betThreshold: [],
  },
  TWD: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 5,000,000
    totalWinLimit: [0, 5000000],
    // 押注群組
    betList: [
      5,
      10,
      20,
      50,
      100,
      150,
      200,
      300,
      400,
      500,
      1000,
      2000,
      3000,
      4000,
      5000,
    ],
    // 押注上限
    betLimit: [0, 10000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 10000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 10000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
  },
  DSSZ: {
    // 機率期望值
    rtp: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    // NG/FG/BG最大總贏分限制 600,000,000
    totalWinLimit: [0, 600000000],
    // 押注群組
    betList: [100, 200, 250, 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000],
    // 押注上限
    betLimit: [0, 10000],
    // 押注單位，可選輪押注時才會有非 1 的值
    reelBet: 1,
    // 最大總押分(多押注遊戲)
    maxBet: [0, 10000],
    // 最大單注押分(多押注遊戲)
    maxSingleBet: [0, 10000],
    // 送獎
    forceBingo: ["UltraWin", "MegaWin", "BigWin", "FG", "CardFG"],
    JP1: ["JP1"],
    DebugStrip: [-1, -1, -1, -1, -1],
  },
  */
};
