import { Config } from "../setup/config";
import { RegulationTag } from "@championgameteam/ah-slot-game-server-plugin";

export class FGInput {
  row: number;

  column: number;

  rtp: number;

  reelBet: number;

  bet: number[];

  totalWinLimit: number;

  minBet: number;

  maxBet: number;

  fgRounds: number;

  select: number;

  fgTotalRound: number;

  fgGetScore: number;

  strip: Array<number>;

  debugWDMulti: number;

  forceBingo: number;

  fgTotalTimes: number;

  maxFGRounds: number;

  maxFGTimes: number;

  newBitTags: RegulationTag[]; // [新手機率]

  constructor(row: number, column: number) {
    /**
     * 目前設定機率
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
    this.reelBet = 1;

    /**
     * 押注值
     *
     * @type {number}
     */
    this.bet = [1];

    /**
     * 最大總贏分限制
     *
     * @type {number}
     * @see -1: 不限制
     */
    this.totalWinLimit = -1;

    /**
     * FG最大局數限制
     *
     * @type {number}
     * @see -1: 不限制
     */
    this.maxFGRounds = Config.setting.maxFGRounds;

    /**
     * FG最大次數限制
     *
     * @type {number}
     * @see -1: 不限制
     */
    this.maxFGTimes = Config.setting.maxFGTimes;

    /**
     * 最低押注分數
     *
     * @type {number}
     */
    this.minBet = 50;

    /**
     * 最高押注分數
     *
     * @type {number}
     */
    this.maxBet = 5000;

    /**
     * FG剩餘局數
     *
     * @type {number}
     */
    this.fgRounds = 0;

    /**
     * 玩家選擇的FG種類( 0:20+5局, 1:15+5局, 2:10+5局, 3:8+5局, 4:5+5)
     *
     * @type {number}
     */
    this.select = 0;

    /**
     * FG總局數(含加局)
     *
     * @type {number}
     */
    this.fgTotalRound = 0;

    /**
     * 目前FG累積總贏分
     *
     * @type {number}
     */
    this.fgGetScore = 0;

    /**
     * Debug轉輪
     *
     * @type {Array.<number>} // Debug輪子編號。Strip[0]~strip[4]:-1  ; Debug：Strip[0]~strip[4]:轉輪表輪子編號
     * @see size = column
     */
    this.strip = new Array(column).fill(-1);

    /**
     * DEBUG 設定WD倍數 default: -1, 必須條件是srip[]為Debug轉輪
     *
     * @type {number}
     *
     */
    this.debugWDMulti = -1;

    /**
     * 強迫中獎(Remote)
     *
     * @type -1: 預設值 -1，表示不強制開獎；編號從0開始，表示對應之獎項(獎項由PM開規格)
     *
     */
    this.forceBingo = -1;

    /**
     * FG 總次數
     *
     * @type number
     */
    this.fgTotalTimes = 0;
    /**
     * [新手機率] RegulationTag
     *
     * @type {RegulationTag}
     */
    this.newBitTags = [];
  }
}
