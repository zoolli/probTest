import { Config } from "../setup/config";

export class ProbMachineData {
  totalRound: number;

  hitRound: number;

  hitRate: number;

  totalBet: number;

  totalWin: number;

  expect: number;

  monthBet: number;

  monthWin: number;

  monthExpect: number;

  betUnit: number;

  bet: number;

  row: number;

  column: number;

  ngStripType: number;

  preBet: number;

  maxNoWinRounds: number;

  countNoWinRounds: number;

  maxBlackPeriodRounds: number;

  isForceBingoCard: boolean; // 虛寶卡

  isBuyFeature: boolean; // [BuyFeature]

  constructor() {
    /**
     * 目前機台總局數
     *
     * @type {number}
     * @see @/enums/feature
     */
    this.totalRound = 0;

    /**
     * 目前機台中獎局數
     *
     * @type {number}
     */
    this.hitRound = 0;

    /**
     * 目前機台中獎率
     *
     * @type {number}
     */
    this.hitRate = 0;

    /**
     * 目前機台總押分
     *
     * @type {number}
     */
    this.totalBet = 0;

    /**
     * 目前機台總贏分
     *
     * @type {number}
     */
    this.totalWin = 0; // 總贏分

    /**
     * 目前機台期望值
     *
     * @type {number}
     */
    this.expect = 0;

    /**
     * 目前機台 月總押分，每86400局要歸0
     *
     * @type {number}
     */
    this.monthBet = 0;

    /**
     * 目前機台 月總贏分，每86400局要歸0
     *
     * @type {number}
     */
    this.monthWin = 0;

    /**
     * 目前機台 月期望值
     *
     * @type {number}
     */
    this.monthExpect = 0;

    /**
     * 押注單位 / 基本單輪押注
     *
     * @type {number}
     */
    this.betUnit = 1;

    /**
     * 押注值
     *
     * @type {number}
     */
    this.bet = 1;

    /**
     * 每輪 symbol 數
     *
     * @type {number}
     */
    this.row = Config.setting.row;

    /**
     * 轉輪數
     *
     * @type {number}
     */
    this.column = Config.setting.column;

    /**
     * NG使用的轉輪
     *
     * @type {number}
     */
    this.ngStripType = 0;

    /**
     * 前一局押分
     *
     * @type {<number>}
     */
    this.preBet = 1;

    /**
     * 紀錄最大沒有贏分局數
     *
     * @type {<number>}
     */
    this.maxNoWinRounds = 0;

    /**
     * 累計未中獎局數
     *
     * @type {<number>}
     */
    this.countNoWinRounds = 0;

    /**
     * 設定最大黑暗期局數
     *
     * @type {<number>}
     */
    this.maxBlackPeriodRounds = 0;

    /**
     * 虛寶卡 使用
     *
     * @type {<boolean>}
     */
    this.isForceBingoCard = false;

    /**
     * [BuyFeature] 買特色遊戲
     *
     * @type {<boolean>}
     */
    this.isBuyFeature = false;
  }
}

// export class ProbMachineData extends MachineData {
//   data: MachineDataProbData;
// }
