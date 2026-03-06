export enum status {
  /**
   * 一般遊戲 / 主遊戲
   */
  NormalGame = 0,

  /**
   * 免費遊戲
   */
  FreeGame = 1,

  /**
   * 副獎遊戲一 / Respin
   */
  BonusGame1 = 2,

  /**
   * 副獎遊戲二
   */
  BonusGame2 = 4,

  /**
   * 比倍遊戲
   */
  DoubleGame = 8,

  /**
   * 彩金遊戲
   */
  JackpotGame = 16,

  /**
   * 免費遊戲初始狀態
   */
  // FreeGameInit = 32,

  /**
   * 免費遊戲選擇 / 副獎遊戲選擇
   */
  GameSelecting = 64,

  /**
   * 取分
   */
  Collect = 128,

  /**
   * NG 免費遊戲
   */
  NGRespin = 256,

  /**
   * FG 免費遊戲
   */
  FGRespin = 512,
}
