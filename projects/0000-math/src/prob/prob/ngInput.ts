import { RegulationTag } from "@championgameteam/ah-slot-game-server-plugin";
export class NGInput {
  rtp: number;

  row: number;

  column: number;

  reelBet: number;

  bet: number[];

  totalWinLimit: number;

  minBet: number;

  maxBet: number;

  strip: Array<number>;

  forceBingo: string;

  isAwardItem: boolean; // 虛寶卡

  isBuyFeature: boolean; // [BuyFeature] 買免費遊戲

  strBuyFeature: string; // [BuyFeature] 買免費遊戲

  newBitTags: RegulationTag[]; // [新手機率]

  liveStatus: {
    liveRtp: number;
    liveCnt: number;
    liveTotalbet: number;
    liveTotalwin: number;
  };

  controlRTP: boolean;
  controlNewbie: boolean;

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
    this.minBet = 50;

    /**
     * 最高押注分數
     *
     * @type {number}
     */
    this.maxBet = 5000;

    /**
     * Debug轉輪
     *
     * @type {Array.<number>} // Debug輪子編號。Strip[0]~strip[4]:-1  ; Debug：Strip[0]~strip[4]:轉輪表輪子編號
     * @see size = column
     */
    this.strip = new Array(column).fill(-1);

    /**
     * 強迫中獎(Remote)
     *
     * @type -1: 預設值 -1，表示不強制開獎；編號從0開始，表示對應之獎項(獎項由PM開規格)
     *
     */
    this.forceBingo = "";

    /**
     * 虛寶卡 是否使用
     *
     * @type {boolean}
     */
    this.isAwardItem = false;

    /**
     * [BuyFeature] 是否使用
     *
     * @type {boolean}
     */
    this.isBuyFeature = false;
    this.strBuyFeature = "";
    /**
     * [新手機率] RegulationTag
     *
     * @type {RegulationTag}
     */
    this.newBitTags = [];
    this.liveStatus = {
      liveRtp: 0,
      liveCnt: 0,
      liveTotalbet: 0,
      liveTotalwin: 0,
    };
    this.controlRTP = false; // 是否控制 RTP
    this.controlNewbie = false; // 是否控制新手
  }
}
