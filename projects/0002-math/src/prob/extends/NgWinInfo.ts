import { INgWinInfo } from "@championgameteam/ah-slot-game-server-plugin";
import { IGameNgWinInfo } from "./IGameNgWinInfo";

export class NgWinInfo implements INgWinInfo, IGameNgWinInfo {
  roundWin: number;

  winPay: number;

  // 此局贏分
  winInfo?: { symbol: number; win: number; position: number[] }[];

  constructor() {
    this.roundWin = 0;
    this.winPay = 0;
  }
}
