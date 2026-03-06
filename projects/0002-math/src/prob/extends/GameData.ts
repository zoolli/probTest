import { IGameData } from "@championgameteam/ah-slot-game-server-plugin";
import { Config } from "../setup/config";

export class GameData implements IGameData {
  /**
   * 機率設定,預設全遊戲的機率
   */
  rtp: number;

  constructor() {
    this.rtp = Config.setting.rtp;
  }
}
