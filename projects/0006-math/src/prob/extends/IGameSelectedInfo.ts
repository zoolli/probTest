import { Config } from "../setup/config";

export interface IGameSelectedInfo {
  /**
   * Fg 選項對應可遊玩的局數
   *
   * @see Ng 中獎時會在此帶入可選局數，供選擇畫面顯示使用
   */
  selectFgRounds: number[];

  /**
   * Fg 選項對應中獎後出現的倍數列表
   *
   * @see Ng 中獎時會在此帶入可選局數，供選擇畫面顯示使用
   */
  selectWinMultiple: number[][];
}

export class GameSelectedInfo implements IGameSelectedInfo {
  selectFgRounds: Array<number>;

  selectWinMultiple: Array<Array<number>>;

  constructor() {
    this.selectFgRounds = Config.setting.fgRounds;
    this.selectWinMultiple = Config.WDMulti;
  }
}
