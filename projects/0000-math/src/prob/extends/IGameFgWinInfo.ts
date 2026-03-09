import { IBet } from "@championgameteam/ah-slot-game-server-plugin";

export interface IGameFgWinInfo {
  /**
   * 此局倍數
   * 5x: BigWin
   * 10x: MegaWin
   * 20x: ExtraWin
   */
  winPay: number;

  /**
   * Fg 此次剩餘局數
   *
   * @see 供畫面顯示使用
   */
  fgRounds?: number;

  /**
   * Fg 剩餘次數
   *
   * @see Fg 中再次中 fg 時加一次
   */
  fgRemainingTimes?: number;

  /**
   * Fg 中獎紅包倍數
   *
   * @see 中 紅包時有連線時的賠率倍數
   */
  redPacketMultiple?: number;

  /**
   * Fg 中獎紅包分數
   *
   * @see
   */
  redPacketWin?: number;

  /**
   * Fg 中獎WD倍數
   *
   * @see 中 WD 時有連線時的賠率倍數
   */
  winMultiple?: number;

  /**
   * Fg 中再次中 fg
   */
  hitFg?: boolean;

  /**
   * 該次進入 fg 前選擇的倍率選項
   */
  fgMode?: number;

  /**
   * TotalWin的倍數
   * 5x: BigWin
   * 10x: MegaWin
   * 20x: ExtraWin
   */
  fgTotalWinPay: number;

  /**
   * fg 未加上其他贏分分數
   */
  generalWin: number;

  /**
   * 贏分資訊
   *
   * @see symbol 圖騰索引值, 對應 enum symbol
   * @see win 贏分
   * @see position 中獎的盤面位置清單，位置索引對應
   */
  winInfo?: { symbol: number; win: number; position: number[] }[];

  /**
   * 進Free Game的初始盤面 ie.NG結束盤面
   *
   * @see
   */
  fgReels: Array<number>;

  /**
   * Fg 輪帶表
   *
   * @see
   */
  fgStrip: Array<Array<number>>;

  /**
   * 押注單位 / 基本單輪押注
   *
   * @type {number}
   */
  betUnit: number;

  /**
   * 押注值
   *
   * @type {IBet}
   */
  bet: IBet[];
}
