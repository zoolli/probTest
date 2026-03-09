import { Utils } from "../utils/index";
import { Config } from "../setup/config";
import { SwitchChance } from "./switch_chance";

const DoReelSymbol = (In: string, prob = 0): Array<number> => {
  let snWheels: string[][];

  // 取得轉輪帶
  if (In === "ng") {
    snWheels = SwitchChance.ng(prob); // Spin()時決定用哪個轉輪帶
  } else {
    snWheels = SwitchChance.fg(prob); // Spin()時決定用哪個轉輪帶
  }

  const Wheels = Utils.snStriptTableToId(snWheels); // 轉輪帶sn => id
  const temp = new Array(Config.setting.column).fill(0);

  const reelSymbol = new Array(Config.setting.row * Config.setting.column).fill(
    -1
  );

  // [隨機]停輪位置
  for (let i = 0; i < Config.setting.column; i += 1) {
    temp[i] = Utils.myRand(Wheels[i].length);
  }

  for (let i = 0; i < Config.setting.row; i += 1) {
    // 將每輪第一個存起來
    for (let j = 0; j < Config.setting.column; j += 1) {
      reelSymbol[j + i * Config.setting.column] = Wheels[j][temp[j]];
    }

    // 更新每輪下一個symbol
    for (let j = 0; j < Config.setting.column; j += 1) {
      temp[j] += 1;
      temp[j] %= Wheels[j].length;
    }
  }

  return reelSymbol;
};

export const ReelSymbol = {
  ng(prob = 0): number[] {
    return DoReelSymbol("ng", prob);
  },

  fg(prob = 0): number[] {
    return DoReelSymbol("fg", prob);
  },
};
