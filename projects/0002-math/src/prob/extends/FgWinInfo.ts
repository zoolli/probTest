import { IFgWinInfo, IBet } from "@championgameteam/ah-slot-game-server-plugin";
import { FgStrip } from "../setup/fg_strip";
import { Utils } from "../utils";
import { IGameFgWinInfo } from "./IGameFgWinInfo";

export class FgWinInfo implements IFgWinInfo, IGameFgWinInfo {
  roundWin: number;

  winPay: number;

  fgRounds: number;

  fgRemainingTimes: number;

  redPacketMultiple?: number;

  redPacketWin?: number;

  winMultiple: number;

  hitFg: boolean;

  fgMode: number;

  fgTotalWin: number;

  fgTotalWinPay: number;

  winInfo: { symbol: number; win: number; position: number[] }[];

  fgTotalRound: number;

  generalWin: number;

  fgReels: Array<number>;

  fgStrip: Array<Array<number>>;

  betUnit: number;

  bet: IBet[];

  fgRoundIndex: number;

  constructor() {
    this.roundWin = 0;
    this.winPay = 0;
    this.fgRounds = 0;
    this.fgRemainingTimes = 0;
    this.redPacketMultiple = 0;
    this.winMultiple = 1;
    this.hitFg = false;
    this.fgMode = 0;
    this.fgTotalWin = 0;
    this.fgTotalWinPay = 0;
    this.generalWin = 0;
    this.fgTotalRound = 0;
    this.winInfo = [];
    this.fgRoundIndex = 0;
    this.bet = [{ name: "", bet: 1 }];
    this.fgStrip = Utils.snStriptTableToId(FgStrip.type0);
  }
}
