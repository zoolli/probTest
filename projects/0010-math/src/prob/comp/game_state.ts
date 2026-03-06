import { status } from "../enums/status";
import { eForceType } from "../prob/probLocalData";
import { Config } from "../setup/config";
// const { State } = require('@/enums');

export class GameState {
  state: status;

  nextState: status;

  rtp: number;

  row: number;

  column: number;

  betUnit: number;

  bet: number[];

  totalWinLimit: number;

  minBet: number;

  maxBet: number;

  ngReels: Array<number>;

  ngReelSymbolFinal: Array<number>;

  fgReels: Array<number>;

  fgReelSymbolFinal: Array<number>;

  fgMode: number;

  fgTotalRound: number;

  fgTotalWin: number;

  fgRemainingRounds: number;

  isForceBingo: boolean;

  fgTotalTimes: number;

  //
  fgRoundIndex: number;
  currentWin: number;
  roundTotalwin: number;

  liveRtp: number; //目前實時累積rtp
  liveCnt: number; //目前實時累積局數
  liveTotalbet: number; //目前實時累積押注
  liveTotalwin: number; //目前實時累積贏分

  rtpModify: number;
  controlNewbie: boolean;
  controlRTP: boolean;

  forceBingoType: number;

  constructor(row: number, column: number) {
    /**
     * 紀錄上次遊戲狀態
     *
     * @type {number}
     * @see @/enums/state
     */
    this.state = status.NormalGame;

    /**
     * 預計進入的遊戲狀態
     *
     * @type {number}
     * @see @/enums/state
     */
    this.nextState = status.NormalGame;

    /**
     * 目前使用的 rtp 數值
     *
     * @type {number}
     */
    this.rtp = 96;

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
     * 押注單位 / 基本單輪押注
     *
     * @type {number}
     */
    this.betUnit = 1;

    /**
     * 當局押分bet
     *
     * @type {number}
     */
    const [a] = Config.setting.betList;
    this.bet = [a]; // Config.setting.betList[0];

    /**
     * 最大贏分限制
     *
     * @type {number}
     * @see -1: 不限制
     */
    this.totalWinLimit = -1;

    /**
     * 最低押注分數
     *
     * @type {number}
     */
    this.minBet = 0;

    /**
     * 最高押注分數
     *
     * @type {number}
     */
    this.maxBet = 5000;

    /**
     * Ng 盤面存檔
     *
     * @type {Array.<number>}
     * @see size = row * column
     */
    this.ngReels = new Array(row * column).fill(-1);

    /**
     * Ng 盤面存檔 (變牌後)
     *
     * @type {Array.<number>}
     * @see size = row * column
     */
    this.ngReelSymbolFinal = new Array(row * column).fill(-1);

    /**
     * Fg 盤面存檔
     *
     * @type {Array.<number>}
     * @see size = row * column
     */
    this.fgReels = new Array(row * column).fill(-1);

    /**
     * Fg 盤面存檔 (變牌後)
     *
     * @type {Array.<number>}
     * @see size = row * column
     */
    this.fgReelSymbolFinal = new Array(row * column).fill(-1);

    /**
     * 玩家選項
     *
     * @type {number}
     * @see 參照各遊戲定義
     */
    this.fgMode = 0;

    /**
     * Fg 總局數 (含加局)
     *
     * @type {number}
     */
    this.fgTotalRound = 0;

    /**
     * Fg 累積總贏分(當Fg中Fg繼續累積)
     *
     * @type {number}
     */
    this.fgTotalWin = 0;

    /**
     * Fg 剩餘局數 (不含加局)
     *
     * @type {number}
     */
    this.fgRemainingRounds = 0;

    /**
     * 此局是否送獎
     *
     * @type bool
     */
    this.isForceBingo = false;

    /**
     * FG 總次數
     *
     * @type number
     */
    this.fgTotalTimes = 0;

    this.fgRoundIndex = 0;

    this.currentWin = 0;
    this.roundTotalwin = 0;

    this.liveRtp = 0; // 實時累積rtp
    this.liveCnt = 0;
    this.liveTotalbet = 0;
    this.liveTotalwin = 0;
    this.rtpModify = 0;

    this.liveRtp = 0; // 實時累積rtp
    this.liveCnt = 0;
    this.liveTotalbet = 0;
    this.liveTotalwin = 0;
    this.rtpModify = 0;
    this.controlNewbie = false; // 是否控制新手
    this.controlRTP = false; // 是否控制RTP

    this.forceBingoType = eForceType.None;
  }
}
