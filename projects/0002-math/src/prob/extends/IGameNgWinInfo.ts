export interface IGameNgWinInfo {
  /**
   * 此局倍數
   * 5x: BigWin
   * 10x: MegaWin
   * 20x: ExtraWin
   */
  winPay: number;

  /**
   * 贏分資訊
   *
   * @see symbol 圖騰索引值, 對應 enum symbol
   * @see win 贏分
   * @see position 中獎的盤面位置清單，位置索引對應
   */
  winInfo?: { symbol: number; win: number; position: number[] }[];
}
