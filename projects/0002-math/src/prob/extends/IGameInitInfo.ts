import { IBet } from "@championgameteam/ah-slot-game-server-plugin";

export interface IGameInitInfo {
  /**
   * 押注值 紀錄Ng押分
   *
   * @type {IBet}
   */
  bet: IBet[];

  /**
   * 押注Index
   *
   * @type {number}
   */

  betIndex: number;
}
