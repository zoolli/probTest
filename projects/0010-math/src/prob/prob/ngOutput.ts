import { Config } from "../setup/config";
import { PrizeList } from "../setup/prize_list";
import { eForceType } from "./probLocalData";
// const { symbol } = require("@/setup/config");
// const { PrizeList } = require("@/setup");

export class NGOutput {
  row: number;

  column: number;

  reelSymbol: Array<number>;

  fgPassReel: Array<number>;

  roundWin: number;

  winType: number;

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

  selectFgRounds?: Array<number>;

  selectWinMultiple?: Array<Array<number>>;

  isForceBingo: boolean;

  bet: number[];

  betUnit: number;

  rtpModify: number; //0:不校正,  1: 上修, -1:下修

  isNewbieTrigger: boolean;
  forceBingoType: number;

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
     * 中獎的資訊 ex: [{symbol: 2, win: 320, position: [1, 3, 6, 7]}, ...]
     *
     * @type {Array.<number>}
     *
     */
    this.winInfo = [];

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
     * 是否有中獎
     *
     * @type {boolean}
     */
    this.isForceBingo = false;

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

    this.rtpModify = 0; //0:不校正,  1: 上修, -1:下修
    /**
     * 是否有新手機率中獎
     *
     * @type {boolean}
     */
    this.isNewbieTrigger = false;

    this.forceBingoType = eForceType.None;
  }
}
