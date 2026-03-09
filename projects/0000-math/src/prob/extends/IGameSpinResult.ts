import { IGameSelectedInfo } from "./IGameSelectedInfo";

export interface IGameSpinResult {
  gameSelectingInfo?: IGameSelectedInfo;

  ngReels?: Array<Array<number>>;

  resultHistory: number[];
}
