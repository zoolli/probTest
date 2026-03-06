import { Config } from "../setup/config";
import { PrizeList } from "../setup/prize_list";
// const { symbol } = require('@/setup/config');
// const { PrizeList } = require('@/setup');

export class FGOutput {
  row: number;

  column: number;

  reelSymbol: Array<number>;

  ngReels: Array<number>;

  fgPassReel: Array<number>;

  roundWin: number;

  winType: number;

  fgGetScore: number;

  fgTotalWin: number;

  fgRemainingRounds: number;

  // Fg 剩餘局數 (含加局)
  fgRounds: number;

  fgAddRound: number;

  lineLink: Array<number>;

  lineCount: Array<Array<number>>;

  lineNumb: Array<number>;

  lineSymbol: Array<number>;

  lineWin: Array<number>;

  symbolCount: Array<number>;

  symbolWin: Array<number>;

  prizeList: Array<number>;

  winInfo: any;

  hitLineSymbolReel: Array<Array<number>>;

  lineCountNoWD: Array<Array<number>>;

  RPDoublePrize: number;

  RPWin: number;

  isWDDouble: boolean;

  lineWDMulti: number;

  fgTotalTimes: number;

  fgMode: number;

  hitFg: boolean;

  /**
   * Fg 選項對應可遊玩的局數
   *
   * @see Ng 中獎時會在此帶入可選局數，供選擇畫面顯示使用
   */
  selectFgRounds?: Array<number>;

  /**
   * Fg 選項對應中獎後出現的倍數列表
   *
   * @see Ng 中獎時會在此帶入可選局數，供選擇畫面顯示使用
   */
  selectWinMultiple?: number[][];

  isForceBingo?: boolean;

  betUnit: number;

  bet: number[];

  generalWin: number;

  subLineWinWd: Array<number>;

  subLineWinNoWd: Array<number>;

  isSubLinWin: Array<boolean>;

  constructor(row: number, column: number) {
    /**
     * 每輪 symbol 數
     *
     * @type {number}
     */
    this.row = row;

    /**
     * 轉輪數
     *
     * @type {number}
     */
    this.column = column;

    /**
     * 每局產出之轉輪結果
     *
     * @type {Array.<number>}
     */
    this.reelSymbol = new Array(row * column).fill(-1);

    /**
     * 當FG結束時回到NG時的初始盤面
     *
     * @type {Array.<number>}
     */
    this.ngReels = new Array(row * column).fill(-1);

    /**
     * FG Scatter經過的位置
     *
     * @type {Array.<number>}
     */
    this.fgPassReel = new Array(row * column).fill(-1);

    /**
     * 此局贏分
     *
     * @type {number}
     */
    this.roundWin = 0;

    /**
     * 中獎狀態
     *
     * @type {number}
     */
    this.winType = 0;

    /**
     * 目前FG累積總贏分
     *
     * @type {number}
     */
    this.fgGetScore = 0;

    /**
     * Fg 累積總贏分(當Fg中Fg繼續累積)
     *
     * @type {number}
     */
    this.fgTotalWin = 0;

    /**
     * FG目前剩餘總局數(不含加局)
     *
     * @type {number}
     */
    this.fgRemainingRounds = 0;

    /**
     * Fg 剩餘局數 (含加局)
     *
     * @type {number}
     */
    this.fgRounds = 0;

    /**
     * FG加局局數
     *
     * @type {number}
     */
    this.fgAddRound = 0;

    /**
     * 連線到第幾輪
     *
     * @type {Array.<number>}
     */
    this.lineLink = new Array(row).fill(0);

    /**
     * 總共有幾連線 (1,1,1,2,1)=> 1 X 1 X 1 X 2 X 1 = 連線數
     *
     * @type {Array.<number>}
     */
    this.lineCount = new Array(column);
    for (let i = 0; i < column; i += 1) {
      this.lineCount[i] = new Array(row).fill(0);
    }

    /**
     * 無鬼牌總共有幾連線 (1,1,1,2,1)=> 1 X 1 X 1 X 2 X 1 = 連線數
     *
     * @type {Array.<number>}
     */
    this.lineCountNoWD = new Array(column);
    for (let i = 0; i < column; i += 1) {
      this.lineCountNoWD[i] = new Array(row).fill(0);
    }

    /**
     * 連線數
     *
     * @type {Array.<number>}
     */
    this.lineNumb = new Array(row).fill(0);

    /**
     * 中獎圖示
     *
     * @type {Array.<number>}
     */
    this.lineSymbol = new Array(row).fill(0);

    /**
     * 每線贏分
     *
     * @type {Array.<number>}
     */
    this.lineWin = new Array(row).fill(0);

    // 有無WD贏分
    this.subLineWinNoWd = new Array(row).fill(0);
    this.subLineWinWd = new Array(row).fill(0);
    this.isSubLinWin = new Array(row).fill(false);

    /**
     * 每種圖示出現個數
     *
     * @type {Array.<number>}
     */
    this.symbolCount = new Array(Object.keys(Config.symbol).length).fill(0);

    /**
     * 每種圖示贏分
     *
     * @type {Array.<number>}
     */
    this.symbolWin = new Array(Object.keys(Config.symbol).length).fill(0);

    /**
     * 大牌表
     *
     * @type {Array.<number>}
     */
    this.prizeList = new Array(Object.keys(PrizeList).length).fill(0);

    /**
     * RP紅包加倍倍數(0為預設值,沒中RP加倍)
     *
     * @type {number}
     */
    this.RPDoublePrize = 0;

    /**
     * WD加倍倍數
     *
     * @type {number}
     */
    this.isWDDouble = false;
    /**
     * 中獎連線含鬼牌加乘倍數
     *
     * @type {number}
     */
    this.lineWDMulti = 1;

    /**
     * FG 總次數
     *
     * @type number
     */
    this.fgTotalTimes = 0;

    /**
     * 各 symbol 中獎的位置 (0~14)，有中獎才塞
     *
     * @type {Array.<number>}
     * @size [Object.keys(symbol).length][row*column]
     */
    this.hitLineSymbolReel = new Array(Object.keys(Config.symbol).length);
    for (let i = 0; i < Object.keys(Config.symbol).length; i += 1) {
      this.hitLineSymbolReel[i] = Array(row * column).fill(-1);
    }

    /**
     * 該次進入 fg 前選擇的倍率選項
     */
    this.fgMode = 0;

    /**
     * 該次fg進入fg
     */
    this.hitFg = false;

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
    this.bet = [1];

    /**
     * fg 未加上其他贏分分數
     */
    this.generalWin = 0;

    /**
     * 紅包獎贏分分數
     */
    this.RPWin = 0;
  }
}
