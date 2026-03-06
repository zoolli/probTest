import * as MersenneTwister from "mersenne-twister";
import { Config } from "../setup/config";
import { NGInput } from "../prob/ngInput";
import { FGInput } from "../prob/fgInput";
import { SpinResult } from "../extends/SpinResult";
import { WinType } from "@championgameteam/ah-slot-game-server-plugin";
import { status } from "../enums/status";

// Memo: 只產生一次，固定亂數種子
const mtRng = new MersenneTwister(Math.floor(Math.random() * 10000000000));

export class Utils {
  /**
   * 隨機亂數
   *
   * @memberof Utils.Prob
   * @param {number} maxValue
   * @returns {number} a number between 0 and maxValue
   * @see 使用 mersenne-twister 亂數庫產生
   */
  static myRand(maxValue: number): number {
    let rngValue = -1;

    if (maxValue > 0) {
      rngValue = mtRng.random_int();
      rngValue %= maxValue;

      return rngValue;
    }

    return rngValue;
  }

  /**
   * 盤面直橫轉換
   *
   * @param {Array<number>} source
   * @returns {Array<number>} a re-indexed reel positions from source [ref: config.reelPosition]
   * @see 暫時使用，算法優化後移除
   */
  static transformReels(source: Array<number>): Array<number> {
    const transformMatrix = Config.reelPosition;
    const size = source.length;

    if (transformMatrix.length !== size) {
      throw new Error(
        `Invalid source size, transformMatrix.length = ${transformMatrix.length}`
      );
    }

    const temp = source.slice();
    for (let i = 0; i < size; i += 1) {
      temp[i] = source[transformMatrix[i]];
    }

    return temp;
  }

  /**
   * 盤面索引轉換
   *
   * @param {number | Array.<number>} source
   * @returns {number | Array.<number>} 盤面直橫轉換後索引的改變結果
   * @see 暫時使用，算法優化後移除
   */
  static transformReelIndex(
    source: number | Array<number>
  ): number | Array<number> {
    const transformMatrix = Config.reelReIndex;
    if (Array.isArray(source)) {
      const result: any = [];
      source.forEach((index) => {
        if (index < 0 || index >= transformMatrix.length) {
          throw new Error(`Invalid reel index to transform (${index})`);
        }

        result.push(transformMatrix[index]);
      });
      return result;
    }

    return transformMatrix[source];
  }

  /**
   * 機率權重決定哪一個
   * @param {Array} Arr
   * @returns {number} a number between 0 and Arr.length-1
   */
  static myArrayI(Arr: Array<number>): number {
    if (Arr.length <= 0) return -1;
    // 與之前的數值加總，回傳後代入下一輪的處理
    let all = Arr.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0
    );

    if (all < 0) return -1;
    all = Utils.myRand(all);

    let i = 0;
    let ptr = 0;
    for (i = 0; i < Arr.length; i += 1) {
      ptr += Arr[i];
      if (all < ptr) {
        break;
      }
    }
    return i;
  }

  /**
   * debugerMSG
   * @param
   * @returns
   */
  static debugMSG(level = 0, message: string): void {
    switch (level) {
      case 0:
        console.log(message);
        break;
      default:
        break;
    }
  }

  /**
   * 輪帶表 sn 轉 id
   * @param {Array.<number[]>} snStripList 輪帶表
   * @returns
   */
  static snStriptTableToId(
    snStripList: Array<Array<string>>
  ): Array<Array<number>> {
    const infos: { [k: string]: any } = Config.symbol;

    return snStripList.map((snStrip) => snStrip.map((sn) => infos[sn]));
  }

  /**
   *  取機率轉輪帶種類
   *  @param {In} NG和FG輸入值
   *  @returns {number} 轉輪帶種類
   *
   */
  static getReelTableIndex(
    In: NGInput | FGInput,
    highRTP = Config.setting.wheelsRTP[0],
    lowRTP = Config.setting.wheelsRTP[1]
  ): number {
    let idx = 1; // default: 1(lower)

    if (In.rtp < lowRTP || In.rtp > highRTP) {
      throw new Error(`Invalid In.rtp (${In.rtp})`);
    }

    if (In.rtp > highRTP || In.rtp < lowRTP) {
      return idx; // 預設lowChance轉輪帶
    }

    // wight[0]: High Chance,  wight[1]: Low Chance
    const wight = [(In.rtp - lowRTP) * 1000000, (highRTP - In.rtp) * 1000000];
    idx = Utils.myArrayI(wight);

    return idx;
  }

  /**
   *  大數處理
   *  @param {number}
   *  @returns {number}
   *
   */

  // static bigNumber(num, precision = 12): number {
  //   return +parseFloat(num.toPrecision(precision));
  // }

  static bigNumber(num, fixed = 6, ceil = 2): number {
    const val = Number(num.toFixed(fixed));
    // 無條件進位小數ceil位
    const base = Math.pow(10, ceil);
    return Math.ceil(Number((val * base).toFixed(fixed - ceil))) / base;
  }

  /**
   *  轉速表處理
   *  @param {}
   *  @returns {}
   *
   */
  static publicInfoProb(param: {
    publicInfo: any;
    spinResult: SpinResult;
    gameFeature: string[];
  }): any {
    const { publicInfo, spinResult, gameFeature } = param;
    let { FGInfo } = publicInfo || [];
    let { BG1Info } = publicInfo || [];
    let { BG2Info } = publicInfo || [];

    // default
    if (!spinResult) {
      gameFeature.forEach((val) => {
        if (val === WinType.FreeGame) {
          FGInfo = FGInfo || [0];
          publicInfo.FGInfo = FGInfo;
        }
        // BonusGame1
        else if (val === WinType.BonusGame1) {
          BG1Info = BG1Info || [0];
          publicInfo.BG1Info = BG1Info;
        } // BonusGame2
        else if (val === WinType.BonusGame2) {
          BG2Info = BG2Info || [0];
          publicInfo.BG2Info = BG2Info;
        }
      });

      return publicInfo;
    }

    const { state, nextState } = spinResult;
    const maxRecordLen = 4;

    gameFeature.forEach((val) => {
      // FreeGame
      if (val === WinType.FreeGame) {
        FGInfo = FGInfo || [0];

        if (state === status.FreeGame && nextState === status.NormalGame) {
          FGInfo[0] = 0;
        } else if (
          state === status.NormalGame &&
          (nextState === status.FreeGame || nextState === status.GameSelecting)
        ) {
          // 局數+1
          // FGInfo[0] += 1;

          // 新的紀錄
          FGInfo.unshift(0);

          if (FGInfo.length > maxRecordLen) {
            FGInfo.pop();
          }
        } else if (
          state === status.NormalGame &&
          nextState === status.NormalGame
        ) {
          FGInfo[0] += 1;
        }

        publicInfo.FGInfo = FGInfo;
      }
      // BonusGame1
      else if (val === WinType.BonusGame1) {
        BG1Info = BG1Info || [0];
        if (state === status.BonusGame1 && nextState === status.NormalGame) {
          BG1Info[0] = 0;
        } else if (
          (state === status.NormalGame || state === status.FreeGame) &&
          nextState === status.BonusGame1
        ) {
          // 局數+1
          // BG1Info[0] += 1;

          // 新的紀錄
          BG1Info.unshift(0);

          if (BG1Info.length > maxRecordLen) {
            BG1Info.pop();
          }
        } else if (
          state === status.NormalGame &&
          nextState === status.NormalGame
        ) {
          // 局數+1
          BG1Info[0] += 1;
        }

        publicInfo.BG1Info = BG1Info;
      }
      // BonusGame2
      // else if (val === WinType.BonusGame2) {
      //   BG2Info = BG2Info || [[0]];
      // }
    });

    return publicInfo;
  }
}
