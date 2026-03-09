import {
  IBet,
  ISpinResult,
} from "@championgameteam/ah-slot-game-server-plugin";
import { status } from "../enums/status";
import { InitInfo } from "./InitInfo";
import { NgWinInfo } from "./NgWinInfo";
// import { FgWinInfo } from "./FgWinInfo";
import { IGameSelectedInfo } from "./IGameSelectedInfo";

import { IGameSpinResult } from "./IGameSpinResult";
import { FgWinInfo } from "./FgWinInfo";
import { PrizeList } from "../setup/prize_list";
import { BuyFeature } from "@championgameteam/cg-system-library";

export class SpinResult implements ISpinResult, IGameSpinResult {
  state: status;

  nextState: status;

  totalWin: number;

  reels?: number[];

  // NgWinInfo
  initInfo?: InitInfo;

  // NgWinInfo
  ngWinInfo?: NgWinInfo;

  // fgWinInfo
  fgWinInfo?: FgWinInfo;

  bet: IBet[];

  reelBet: number;

  isForceBingo?: boolean;

  // ////////////////////////
  gameSelectingInfo?: IGameSelectedInfo;

  ngReels?: Array<Array<number>>;

  resultHistory: number[];

  prizeListCount: number[];

  playback: {
    /**
     * 盤面資訊
     */
    result: { [key: string]: any };

    /**
     * 遊戲額外資訊
     */
    playbackGameInfo: { [key: string]: any };
  };

  isBuyFeature?: boolean; // [BuyFeature]

  buyFeature?: BuyFeature; // [BuyFeature]
  rtpModifyMode?: number;

  constructor() {
    this.state = status.NormalGame;
    this.nextState = status.NormalGame;
    this.bet = [{ name: "anyWays", bet: 1 }];
    this.reelBet = 1;
    this.totalWin = 0;
    this.resultHistory = [];
    this.prizeListCount = new Array(Object.keys(PrizeList).length).fill(0);

    this.playback = { result: {}, playbackGameInfo: {} };
  }
}
