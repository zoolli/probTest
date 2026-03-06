import { IInitInfo, IBet } from "@championgameteam/ah-slot-game-server-plugin";
import { Config } from "../setup/config";
import { Utils } from "../utils/index";
import { NgStrip } from "../setup/ng_strip";

import { IGameInitInfo } from "./IGameInitInfo";

export class InitInfo implements IInitInfo, IGameInitInfo {
  probId: string;

  betLimit: number;

  betList: number[];

  betIndex: number;

  payTable: number[][];

  ngStrip: number[][];

  reelBet: number;

  resultHistory: number[];

  maxBet: number;

  maxSingleBet: number;

  bet: IBet[];

  // [BuyFeature]
  oddsBuyFeatureFG: number;

  oddsBuyFeatureBG: number;

  isOpenBuyFeature: boolean;

  buyFeatureBetMax: number;

  constructor() {
    this.probId = Config.probId;
    this.betLimit = Config.setting.betLimit;
    this.betList = Config.setting.betList;
    this.betIndex = 0;
    const tmp = new Array(Config.payTable.length);
    for (let i = 0; i < Config.payTable.length; i += 1) {
      tmp[i] = new Array(Config.payTable[i].length).fill(0);
      for (let j = 0; j < Config.payTable[i].length; j += 1) {
        if (i !== Config.symbol.FG) {
          tmp[i][j] = Utils.bigNumber(Config.payTable[i][j] / 25);
        } else {
          tmp[i][j] = Config.payTable[i][j];
        }
      }
    }
    this.payTable = tmp; // Config.payTable;
    this.ngStrip = Utils.snStriptTableToId(NgStrip.type0);
    this.reelBet = Config.setting.reelBet;
    this.resultHistory = [];
    this.maxBet = Config.setting.maxBet;

    this.maxSingleBet = Config.setting.maxSingleBet;

    this.bet = [{ name: "anyWays", bet: 1 }];

    // [BuyFeature]
    this.oddsBuyFeatureFG = Config.extraInfo.oddsBuyFeatureFG;
    // this.oddsBuyFeatureBG = Config.extraInfo.oddsBuyFeatureBG;
    this.isOpenBuyFeature = false;

    const len = Config.setting.betList.length;
    this.buyFeatureBetMax = Config.setting.betList[len - 1] * 100;
  }
}
