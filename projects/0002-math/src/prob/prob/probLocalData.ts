// import { Config } from "../setup/config";
// const { Config } = require("@/setup");

const N_HISTORY_ZERO = 9000000000000000000; // 歷史資料歸0上限值(900京，1:100)
const N_MONTHROUND = 100000;

/**
 * 中獎類型
 */
export const EWinType = {
  /** 0000 0000，沒中獎 */
  noWin: 0x00,

  win: 0x01, // /< = 0000 0001，有中獎.

  winNG: 0x02, // /< = 0000 0010，中一般獎.

  winFG: 0x04, // /< = 0000 0100，中FG獎

  winRPDouble: 0x08, // /< = 0000 1000，在FG中,中RP加倍

  winWDDouble: 0x10, // /< = 0001 0000，在FG中,中WD加倍
};

// ////////////////////////////////////////////
//
export class ProbLocalData {
  N_MONTHROUND: number;

  N_HISTORY_ZERO: number;

  payReelLine: Array<Array<number>>;

  blackPeriodInitRounds: number;

  blackPeriodRoundWight: Array<number>;

  fgCountWight: Array<number>;

  bigPrizePayRange: Array<Array<number>>;

  forceBingoCardMaxOdds: number;

  rtpAdjustment: {
    [key: string]: {
      iniRound: number;
      upperVariance: number;
      lowerVariance: number;
      fgBlockFreq: number;
      fgExtraTriggerProb: [number, number];
    };
  };

  constructor() {
    this.N_MONTHROUND = N_MONTHROUND;
    this.N_HISTORY_ZERO = N_HISTORY_ZERO;

    // 押不同輪子的計分線
    this.payReelLine = [
      [
        // 押1輪
        1,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
        0,
      ],
      [
        // 押2輪
        1,
        1,
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
        0,
      ],
      [
        // 押3輪
        1,
        1,
        1,
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0,
      ],
      [
        // 押4輪
        1,
        1,
        1,
        1,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
      ],
      [
        // 押5輪
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
      ],
      [
        // 押Extra輪
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
      ],
    ];

    // 黑暗期
    this.blackPeriodInitRounds = 6; // 初始局數
    this.blackPeriodRoundWight = [15, 20, 30, 30, 5]; // 加局數的權重 ex: 6+4 =10

    // FG 相關
    //                  0FG 1FG 2FG 3FG 4FG 5FG
    this.fgCountWight = [0, 0, 0, 180, 20, 0];
    this.bigPrizePayRange = [
      [100, 500],
      [50, 100],
      [10, 50],
    ];

    // 虛寶卡最大倍數
    this.forceBingoCardMaxOdds = 100;

    // Rtp校正參數: 門檻高到低排序
    this.rtpAdjustment = {
      config500W: {
        iniRound: 5_000_000, //50000, //5_000_000
        upperVariance: 0.01, //上波動
        lowerVariance: 0.02, //下波動
        fgBlockFreq: 5,
        fgExtraTriggerProb: [99, 1],
      },
      config100W: {
        iniRound: 1_000_000, //50000, //1_000_000
        upperVariance: 0.1, //上波動
        lowerVariance: 0.15, //下波動
        fgBlockFreq: 5,
        fgExtraTriggerProb: [99, 1],
      },
      config50W: {
        iniRound: 500_000, //10000, //500_000,
        upperVariance: 0.5, //上波動
        lowerVariance: 0.75, //下波動
        fgBlockFreq: 10,
        fgExtraTriggerProb: [99, 1],
      },
      config10W: {
        iniRound: 100_000, //10000, //100_000
        upperVariance: 3, //上波動
        lowerVariance: 4.5, //下波動
        fgBlockFreq: 10, //10
        fgExtraTriggerProb: [99, 1], //[99, 1]
      },
      // config100: {
      //   // 測試用
      //   iniRound: 100, //10000, //100_000
      //   upperVariance: 3, //上波動
      //   lowerVariance: 3, //下波動
      //   fgBlockFreq: 1, //10
      //   fgExtraTriggerProb: [0, 1], //[99, 1]
      // },
    };
  }
}

// exports.InputInfo = InputInfo;
// export var localData = {
//   EWinType,
//   ReelType,
//   ProbLocalData
// };
