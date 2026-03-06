// /* eslint-disable no-bitwise, no-param-reassign */
/* eslint-disable no-bitwise */
import { Utils } from "../utils/index";
import { Config } from "../setup/config";
// import { NgStrip } from "../setup/ng_strip";
import { PrizeList } from "../setup/prize_list";

import { SwitchChance } from "../comp/switch_chance";
import { EWinType, ProbLocalData } from "./probLocalData";
import { NGOutput } from "./ngOutput";
// import { typeForceBingo } from "../enums/foceBingList";
import { NGInput } from "./ngInput";
import { ProbMachineData } from "../comp/probMachineData";
// import { GameState } from "../comp";
import { ReelSymbol } from "../comp/reel_symbol";
import {
  log,
  MissionType,
  WinType,
  RegulationTag,
} from "@championgameteam/ah-slot-game-server-plugin";

const LocalData = new ProbLocalData();

/**
 * 計算分數
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function LineCalculate(In: NGInput, Out: NGOutput): NGOutput {
  const output: NGOutput = Out;

  output.roundWin = 0;
  output.winType = EWinType.noWin;

  const betIdx = 4; // Config.betUnitList.indexOf(In.betUnit);
  const tempSymbol = new Array(In.column);
  for (let i = 0; i < In.column; i += 1) {
    tempSymbol[i] = new Array(In.row);
  }

  // test
  // const test = [11, 11, 11, 12, 6, 7, 7, 5, 10, 0, 10, 9, 0, 8, 5];
  // output.reelSymbol = test;

  for (let i = 0; i < In.column; i += 1) {
    for (let j = 0; j < In.row; j += 1) {
      tempSymbol[i][j] = output.reelSymbol[j * In.column + i];
      // tempSymbol[i][j] = test[j * In.column + i];
    }
  }

  output.lineLink = new Array(In.row).fill(1); // 連線到第幾輪
  output.lineCount = new Array(In.column); // 總共有幾連線 (1,1,1,2,1)=> 1 X 1 X 1 X 2 X 1 = 連線數
  for (let i = 0; i < In.column; i += 1) {
    output.lineCount[i] = new Array(In.row).fill(0);
  }
  output.lineNumb = new Array(In.row).fill(1); // 連線數
  output.lineSymbol = new Array(In.row).fill(-1); // 中獎圖示
  output.lineWin = new Array(In.row).fill(0); // 每線贏分

  // Initial Ng_Out parameter
  for (let i = 0; i < In.row; i += 1) {
    output.lineCount[0][i] = 1; // 第一個row相同數必為1
    output.lineSymbol[i] = tempSymbol[0][i]; // 記錄第一個Symbol
  }

  let temp = 0; // 比對第幾個數

  do {
    for (let i = 1; i < In.column; i += 1) {
      for (let j = 0; j < In.row; j += 1) {
        if (output.lineSymbol[temp] === Config.symbol.FG) {
          if (tempSymbol[i][j] === output.lineSymbol[temp]) {
            output.lineCount[i][temp] += 1;
          }
        }
        // 不同押輪
        else if (
          LocalData.payReelLine[betIdx][j * In.column + i] === 1 &&
          (tempSymbol[i][j] === output.lineSymbol[temp] ||
            tempSymbol[i][j] === Config.symbol.WD)
        ) {
          output.lineCount[i][temp] += 1;
        }
      }
      if (output.lineCount[i][temp] === 0) {
        break;
      }
    }

    // 計算線數 (從最後一輪開始檢查是否有個數 0-base)
    for (let k = 4; k > 0; k -= 1) {
      // 比到第二個還是沒個數的話令連線數為零、幾連線也為零
      if (k === 2 && output.lineCount[k][temp] === 0) {
        output.lineNumb[temp] = 0;
        output.lineLink[temp] = 1; // 0-base -> 1-base
      }
      // 有個數時要累乘以計算總線數並留下最大的不為零的位置
      else if (output.lineCount[k][temp] !== 0) {
        output.lineNumb[temp] *= output.lineCount[k][temp];
        // 0-base -> 1-base
        if (k + 1 > output.lineLink[temp] && k + 1 > 2) {
          output.lineLink[temp] = k + 1;
        }
      }
    }

    if (output.lineLink[temp] > 0) {
      output.lineWin[temp] =
        output.lineNumb[temp] *
        Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
    }
    temp += 1;
  } while (temp < In.row);

  // 傳出各Symbol中獎資訊
  for (let i = 0; i < Object.keys(Config.symbol).length; i += 1) {
    output.hitLineSymbolReel[i] = Array(In.column * In.row).fill(-1); // [][15]
  }

  for (let i = 0; i < In.row; i += 1) {
    if (output.lineWin[i] > 0) {
      for (let k = 0; k < In.column; k += 1) {
        let connect = 0;
        for (let r = 0; r < In.row; r += 1) {
          const pos = r * In.column + k;
          const sym = output.lineSymbol[i];

          // FG 不在線獎範圍
          if (sym === Config.symbol.FG) {
            if (
              LocalData.payReelLine[betIdx][pos] === 1 &&
              output.reelSymbol[pos] === sym
            ) {
              output.hitLineSymbolReel[output.lineSymbol[i]][pos] = 1;
              connect = 1;
            }
          } else if (
            LocalData.payReelLine[betIdx][pos] === 1 &&
            (output.reelSymbol[pos] === sym ||
              output.reelSymbol[pos] === Config.symbol.WD)
          ) {
            output.hitLineSymbolReel[output.lineSymbol[i]][pos] = 1;
            connect = 1;
          }
        }
        // 非連續
        if (connect !== 1) {
          break;
        }
      }
    }
  }

  return output;
}

/**
 * 計算Symbol
 * @param {*} In
 * @param {*} Out
 */
function SymbolCalculate(In: NGInput, Out: NGOutput): NGOutput {
  const output: NGOutput = Out;

  // 初始化
  output.symbolCount = new Array(Object.keys(Config.symbol).length).fill(0);
  output.fgPassReel = new Array(In.column * In.row).fill(-1); // FGScatter經過的位置

  let isFGContinue = false;
  // FG 須連續
  for (let j = 0; j < In.column; j += 1) {
    isFGContinue = false;
    for (let i = 0; i < In.row; i += 1) {
      const k = i * In.column + j;
      if (output.reelSymbol[k] === Config.symbol.FG) {
        output.symbolCount[Config.symbol.FG] += 1;
        output.fgPassReel[k] = 1;
        isFGContinue = true;
      }
    }
    if (!isFGContinue) {
      break;
    }
  }

  if (output.symbolCount[Config.symbol.FG] < 3) {
    // 初始化
    output.symbolCount = new Array(Object.keys(Config.symbol).length).fill(0);
    output.fgPassReel = new Array(In.column * In.row).fill(-1);
  }

  return output;
}

/**
 * 算分function
 * @param {*} In
 * @param {*} Out
 * @param {*}
 * @param {*} probMachineData
 * @param {*}
 */
function Calc(In: NGInput, Out: NGOutput): NGOutput {
  let output: NGOutput = Out;

  // 計算線獎
  output = LineCalculate(In, output);

  // 計算個數
  output = SymbolCalculate(In, output);

  // 計算FG贏分(Total Bet)
  if (output.symbolCount[Config.symbol.FG] >= 3) {
    // const unit = In.reelBet > 25 ? 25 : In.reelBet;
    output.symbolWin[Config.symbol.FG] = Utils.bigNumber(
      In.bet[0] *
        In.reelBet *
        Config.payTable[Config.symbol.FG][
          output.symbolCount[Config.symbol.FG] - 1
        ]
    );
    output.winType |= EWinType.win | EWinType.winFG;
    output.roundWin = Utils.bigNumber(
      output.roundWin + output.symbolWin[Config.symbol.FG]
    );
  }

  // 計算線獎
  for (let i = 0; i < In.row; i += 1) {
    if (output.lineWin[i] > 0 && output.lineSymbol[i] !== Config.symbol.FG) {
      const { betUnit } = Config.setting;
      output.lineWin[i] = Utils.bigNumber(
        (output.lineWin[i] * In.bet[0]) / betUnit
      );
      output.roundWin = Utils.bigNumber(output.roundWin + output.lineWin[i]);
    }
  }

  // 記錄 winType
  if (output.roundWin > 0) {
    output.winType |= EWinType.win | EWinType.winNG;
  }

  // winInfo: [{symbol: 2, win: 320, position: [1, 3, 6, 7]}, ...]
  output.winInfo = [];
  for (let i = 0; i < In.row; i += 1) {
    if (output.lineWin[i] > 0) {
      const symbol = output.lineSymbol[i];
      let win = output.lineWin[i];
      // 假如FG Symbol
      if (symbol === Config.symbol.FG) {
        win = output.symbolWin[Config.symbol.FG];
      }
      const position = [];
      const transReels = Utils.transformReels(output.hitLineSymbolReel[symbol]);

      //
      for (let j = 0; j < In.column * In.row; j += 1) {
        if (transReels[j] === 1) {
          position.push(j);
        }
      }
      output.winInfo.push({ symbol, win, position });
    }
  }

  return output;
}

/**
 * 產生盤面
 * @param {*} In
 * @param {*} Out
 * @param {*}
 * @param {*}
 * @param {*}
 */
function DoWheelSymbol(In: NGInput): NGOutput {
  const output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );

  // return 0:high or 1:low
  const ngStripType = Utils.getReelTableIndex(In);
  output.reelSymbol = ReelSymbol.ng(ngStripType);

  return output;
}

/**
 * Demo 不中獎轉輪
 * @param {*} In
 * @param {*}
 */

function Demo(In: NGInput): NGOutput {
  let Out: NGOutput = null;

  const searchTimes = 5000;
  let loop = 0;
  do {
    // 產輪
    Out = DoWheelSymbol(In);

    // 計算分數
    Out = Calc(In, Out);

    loop += 1;
    if (loop > searchTimes) {
      break;
    }
  } while (Out.winType !== EWinType.noWin);

  return Out;
}

/**
 * 判斷是否強迫中獎
 * @param {*} In
 */
function isForceBingo(In: NGInput): boolean {
  const { typeForceBingo } = Config.setting;
  if (
    Object.values(typeForceBingo).findIndex(
      (element) => element === In.forceBingo
    ) !== -1
  ) {
    return true;
  }

  return false;
}

/**
 * [BuyFeature]獎項
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function DoBuyFeature(
  In: NGInput
): {
  Out: NGOutput;
  bSuccess: boolean;
  isBuyFeature: boolean;
} {
  let output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );
  let isBuyFeature = false;

  // 產生FG獎=>限制條件另外處理

  let loop = 0;
  let searchTimes = 5000;
  if (In.strBuyFeature === Config.buyFeatureName.FG) {
    // 決定FG模式
    let fgCount = Utils.myArrayI(LocalData.fgCountWight);

    // 產FG
    loop = 0;
    do {
      if (loop > searchTimes / 2) {
        fgCount = 3; // Utils.myArrayI(LocalData.fgCountWight);
      }

      // 產輪
      output = DoWheelSymbol(In);

      // 計算分數
      output = Calc(In, output);

      if (output.symbolCount[Config.symbol.FG] === fgCount) {
        isBuyFeature = true;
        break;
      }

      loop += 1;
    } while (loop < searchTimes);
  }

  // 沒有產出
  if (isBuyFeature === false) {
    output = Demo(In);
    log.error(`DoBuyFeature: fail.`);
  }

  return {
    Out: output,
    bSuccess: false,
    isBuyFeature,
  };
}

/**
 * 虛寶卡的獎項
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function DoAwardItemWin(
  In: NGInput
): {
  Out: NGOutput;
  bSuccess: boolean;
  isForceBingoCard?: boolean;
} {
  let output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );
  let isForceBingoCard = false;

  const roundBet: number = In.bet[0] * In.reelBet;
  let loop = 0;
  const searchTimes = 5000;

  // 虛寶卡
  if (In.forceBingo === WinType.CardFG) {
    // 決定FG模式
    let fgCount = Utils.myArrayI(LocalData.fgCountWight);

    // 產FG
    loop = 0;
    do {
      if (loop > searchTimes / 2) {
        fgCount = 3; // Utils.myArrayI(LocalData.fgCountWight);
      }
      // 產輪
      output = DoWheelSymbol(In);

      // 計算分數
      output = Calc(In, output);

      if (output.symbolCount[Config.symbol.FG] === fgCount) {
        isForceBingoCard = true;
        break;
      }

      loop += 1;
    } while (loop < searchTimes);
  } else {
    log.error(`DoAwardItemWin:: Error. input: ${JSON.stringify(In)} `);
  }

  // 沒有產出
  if (isForceBingoCard === false) {
    output = Demo(In);
    log.error(`DoAwardItemWin: fail.`);
  }

  return {
    Out: output,
    bSuccess: false,
    isForceBingoCard,
  };
}

/**
 * 產出強迫中獎的獎項
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function DoForceWin(
  In: NGInput
): {
  Out: NGOutput;
  bSuccess: boolean;
} {
  let bSuccess = false;
  let output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );

  if (!isForceBingo(In)) {
    return {
      Out: output,
      bSuccess,
    };
  }

  let winPay = 0; // 贏分倍數
  const roundBet: number = In.bet[0] * In.reelBet;
  let loop = 0;
  const searchTimes = 5000;

  // ForceBingo
  if (
    In.forceBingo === "UltraWin" ||
    In.forceBingo === "MegaWin" ||
    In.forceBingo === "BigWin"
  ) {
    loop = 0;
    let idx = -1;
    switch (In.forceBingo) {
      case "UltraWin":
        idx = 0;
        break;
      case "MegaWin":
        idx = 1;
        break;
      case "BigWin":
      default:
        idx = 2;
        break;
    }
    do {
      // 產輪
      output = DoWheelSymbol(In);

      // 計算分數
      output = Calc(In, output);

      winPay = output.roundWin / roundBet;

      if (
        winPay >= LocalData.bigPrizePayRange[idx][0] &&
        winPay < LocalData.bigPrizePayRange[idx][1] &&
        output.symbolCount[Config.symbol.FG] < 3
      ) {
        bSuccess = true;
        break;
      }

      loop += 1;
    } while (loop < searchTimes);
  } else if (
    In.forceBingo === Config.setting.typeForceBingo.CardFG ||
    In.forceBingo === Config.setting.typeForceBingo.FG
  ) {
    // 決定FG模式
    let fgCount = Utils.myArrayI(LocalData.fgCountWight);

    // 產FG
    loop = 0;
    do {
      if (loop > searchTimes / 2) {
        fgCount = 3; // Utils.myArrayI(LocalData.fgCountWight);
      }

      // 產輪
      output = DoWheelSymbol(In);

      // 計算分數
      output = Calc(In, output);

      if (output.symbolCount[Config.symbol.FG] === fgCount) {
        bSuccess = true;
        break;
      }

      loop += 1;
    } while (loop < searchTimes);

    if (!bSuccess) {
      output = Demo(In);
      log.error(`DoForceWin:FG/CardFG fail.`);
    }
  }

  return {
    Out: output,
    bSuccess,
  };
}

/**
 * 判斷是否Debug
 * @param {*} In
 */
function isDebug(In: NGInput): boolean {
  for (let i = 0; i < In.column; i += 1) {
    if (In.strip[i] !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * DebugMode Function
 * @param {} In
 * @param {*} Out
 * @param {*}
 * @param {*}
 * @param {*}
 */
function DoDebugMode(
  In: NGInput
): {
  Out: NGOutput;
  bSuccess: boolean;
} {
  const bSuccess = false;
  let output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );

  // 判斷是否Debug
  if (!isDebug(In)) {
    return {
      Out: output,
      bSuccess,
    };
  }

  // 決定使用的轉輪
  // return 0:high or 1:low
  // const ngStripType = Utils.getReelTableIndex(In);
  const ngStripType = In.rtp < 96 ? 1 : 0;

  // 取得轉輪帶
  const snWheels = SwitchChance.ng(ngStripType); // Spin()時決定用哪個轉輪帶
  const Wheels = Utils.snStriptTableToId(snWheels); // 轉輪帶sn => id

  // DEBUG 轉輪
  const temp = new Array(In.column).fill(-1);
  for (let i = 0; i < In.column; i += 1) {
    // 強制轉置
    const k = In.strip[i];
    if (k > -1) {
      temp[i] = k % Wheels[i].length;
    } else {
      temp[i] = Utils.myRand(Wheels[i].length);
    }
  }

  for (let i = 0; i < In.row; i += 1) {
    // 將每輪第一個存起來
    for (let j = 0; j < In.column; j += 1) {
      output.reelSymbol[j + i * In.column] = Wheels[j][temp[j]];
    }

    // 更新每輪下一個symbol
    for (let j = 0; j < In.column; j += 1) {
      temp[j] += 1;
      temp[j] %= Wheels[j].length;
    }
  }

  // 計算分數
  output = Calc(In, output);

  return {
    Out: output,
    bSuccess: true,
  };
}

/**
 * 內部統計資訊
 * @param {*} In
 * @param {*} Out
 * @param {*} probMachineData
 * @param {*}
 */
function CheckAndClearMonthExpect(
  In: NGInput,
  Out: NGOutput,
  probMachineData: ProbMachineData
): {
  Out: NGOutput;
  probMachineData: ProbMachineData;
  bSuccess: boolean;
} {
  // 累加贏分與押分
  const { roundWin } = Out;
  const roundBet = In.bet[0] * In.reelBet;
  const outProbMachineData: ProbMachineData = probMachineData;

  outProbMachineData.totalWin += roundWin;
  outProbMachineData.monthWin += roundWin;
  outProbMachineData.totalBet += roundBet;
  outProbMachineData.monthBet += roundBet;
  outProbMachineData.totalRound += 1;

  // 統計中獎次數
  if (Out.winType !== EWinType.noWin) {
    outProbMachineData.hitRound += 1;
  }

  // 中獎率
  outProbMachineData.hitRate =
    outProbMachineData.hitRound / outProbMachineData.totalRound;

  // 期望值
  if (outProbMachineData.totalBet > 0) {
    outProbMachineData.expect =
      outProbMachineData.totalWin / outProbMachineData.totalBet;
  } else {
    outProbMachineData.expect = 0;
  }

  // 月期望值
  if (outProbMachineData.monthBet > 0) {
    outProbMachineData.monthExpect =
      outProbMachineData.monthWin / outProbMachineData.monthBet;
  } else {
    outProbMachineData.monthExpect = 0;
  }

  // 86400局月總押分跟總贏分歸0
  if (outProbMachineData.totalRound % LocalData.N_MONTHROUND === 0) {
    outProbMachineData.monthBet = 0;
    outProbMachineData.monthWin = 0;
  }

  // 歷史資料超過上限值歸0
  if (
    outProbMachineData.totalRound > LocalData.N_HISTORY_ZERO ||
    outProbMachineData.totalBet > LocalData.N_HISTORY_ZERO ||
    outProbMachineData.totalWin > LocalData.N_HISTORY_ZERO
  ) {
    outProbMachineData.totalRound = 0;
    outProbMachineData.hitRound = 0;
    outProbMachineData.hitRate = 0;
    outProbMachineData.totalBet = 0;
    outProbMachineData.totalWin = 0;
    outProbMachineData.expect = 0;
    outProbMachineData.monthBet = 0;
    outProbMachineData.monthWin = 0;
    outProbMachineData.monthExpect = 0;
  }

  return {
    Out,
    probMachineData: outProbMachineData,
    bSuccess: false,
  };
}

/**
 * DoNatureRandPrize 自然產輪
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function DoNatureRandPrize(
  In: NGInput
): {
  Out: NGOutput;
  bSuccess: boolean;
} {
  let result = DoWheelSymbol(In);

  result = Calc(In, result);

  // console.log(`DoNatureRandPrize::Ng_Output.reelSymbol = ${Out.reelSymbol}`);
  // console.log(`DoNatureRandPrize::Ng_Output.RoundWin = ${Out.roundWin}`);

  return {
    Out: result,
    bSuccess: false, // 是否送獎
  };
}

/**
 * DoRtpModify 自然產輪
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function DoRtpModify(
  In: NGInput,
  Out_follow: NGOutput
): {
  Out: NGOutput;
  bSuccess: boolean;
} {
  let result = Out_follow;
  let rtpModify = 0;

  const rtpConfigs = Object.values(LocalData.rtpAdjustment);
  const matchedConfig = rtpConfigs.find(
    (cfg) => In.liveStatus.liveCnt >= cfg.iniRound
  );

  // 有需要校正才走以下流程
  if (matchedConfig) {
    const upperRtpLimit = In.rtp + matchedConfig.upperVariance;
    const lowerRtpLimit = In.rtp - matchedConfig.lowerVariance;

    if (In.liveStatus.liveRtp >= upperRtpLimit) {
      // 啟動下修
      rtpModify = -1;
    } else if (In.liveStatus.liveRtp < lowerRtpLimit) {
      // 啟動上修
      rtpModify = 1;
    }

    const fgBlockFreq = matchedConfig.fgBlockFreq; //擋自然開獎頻率
    const fgExtraTriggerProb = matchedConfig.fgExtraTriggerProb; //[99, 1]; //額外開獎機率
    if (
      rtpModify === -1 &&
      (result.winType & EWinType.winFG) !== 0 &&
      Utils.myRand(fgBlockFreq) === 0
    ) {
      // 下修: 機率性擋獎fg
      result = Demo(In);
      if ((result.winType & EWinType.winFG) === 0) {
        result.rtpModify = -1; //擋獎成功才算
      }
    }
    if (rtpModify === 1 && Utils.myArrayI(fgExtraTriggerProb) === 1) {
      // 上修: 機率性hit fg
      In.forceBingo = Config.setting.typeForceBingo.FG;
      let tempOut = DoForceWin(In);
      result = tempOut.Out;
      //result.probType = 0;
      if (tempOut.bSuccess) {
        result.rtpModify = 1; //上修成功才算
      }
    }
  }

  return {
    Out: result,
    bSuccess: false, // 是否送獎
  };
}

/**
 * Spin function
 * @param {*} In
 * @param {*} probMachineData
 * @param {*}
 */
function Spin(
  In: NGInput,
  probMachineData: ProbMachineData
): { Out: NGOutput; probMachineData: ProbMachineData } {
  let result: any;

  // [BuyFeature]
  if (In.isBuyFeature) {
    result = DoBuyFeature(In);
  }
  // 虛寶卡流程
  else if (In.isAwardItem) {
    result = DoAwardItemWin(In);
  } else {
    // 送獎流程
    result = DoForceWin(In);

    if (!result.bSuccess) {
      // Debug
      result = DoDebugMode(In);
      // 自然機率
      if (!result.bSuccess) {
        result = DoNatureRandPrize(In);

        if (In.controlRTP) {
          result = DoRtpModify(In, result.Out); // Rtp 機率性校正: 不生效時不改結果
        }

        // TODO [新手機率] 補獎under非RSP狀態下
        if (
          In.newBitTags.includes(RegulationTag.newbieBegin) === true &&
          In.newBitTags.includes(RegulationTag.newbieTrigger) === true &&
          !probMachineData.isBuyFeature
        ) {
          const oddsRange = Config.gameRegulation.newbie.healUp.multiplier; //[4, 6];
          result = DoNewbitPeriod(In, oddsRange);
        }

        // TODO [新手機率] 擋獎
        if (
          In.newBitTags.includes(RegulationTag.newbieBegin) === true &&
          !probMachineData.isBuyFeature
        ) {
          // console.log("新手期間: ng擋獎");
          let limitedNewBitTotalWin =
            Config.extraInfo.newBitLimitedPays * In.bet[0];

          if (
            limitedNewBitTotalWin !== undefined &&
            result.Out.roundWin > limitedNewBitTotalWin
          ) {
            result.Out = Demo(In);
            result.bSuccess = false;
          }
        }

        // End. [新手機率] 補獎/擋獎

        // NG 最大贏分限制////////////////////////////////////////
        let limitedTotalWin = In.maxBet * 1000;
        if (In.totalWinLimit > 0) limitedTotalWin = In.totalWinLimit;

        if (result.Out.roundWin > limitedTotalWin) {
          log.info(
            `NG Spin():: the limitedWin is enable. ${limitedTotalWin}. `
          );

          result.Out = Demo(In);
          result.bSuccess = false;
        }
      }
    }
  }

  // 是否送獎
  result.Out.isForceBingo = result.bSuccess;

  // 虛寶卡 不是送獎
  if (result.isForceBingoCard) {
    // 紀錄在機台
    probMachineData.isForceBingoCard = result.isForceBingoCard;
    // result.Out.isForceBingo = false;
  }

  // [BuyFeature] 買特色遊戲
  if (result.isBuyFeature) {
    // 紀錄在機台
    probMachineData.isBuyFeature = result.isBuyFeature;
    result.Out.isBuyFeature = result.isBuyFeature;

    result.Out.isForceBingo = false;
  }

  // 是否開啟黑暗期補獎
  // if (
  //   Config.setting.bBlackPeriod === true &&
  //   result.Out.winType === EWinType.noWin
  // ) {
  //   result = DoRedeemInDarkAges(In, result.Out, probMachineData);
  // }

  // 統計歷史資料
  result = CheckAndClearMonthExpect(In, result.Out, probMachineData);

  // 儲存前一局押分
  result.Out.bet = In.bet;
  result.Out.betUnit = In.reelBet;

  return {
    Out: result.Out,
    probMachineData,
  };
}

/**
 * 大牌表
 * @param {*} In
 * @param {*} Out
 * @param {*}
 * @param {*}
 * @param {*}
 */
function getPrizeList(In: NGInput, Out: NGOutput): NGOutput {
  const output: NGOutput = Out;

  // 初始
  const prizeSize: number = Object.keys(PrizeList).length;
  for (let i = 0; i < prizeSize; i += 1) {
    output.prizeList[i] = 0;
  }

  // 線獎
  for (let j = 0; j < Config.symbol.FG; j += 1) {
    for (let i = 0; i < In.row; i += 1) {
      if (output.lineSymbol[i] === j && output.lineWin[i] > 0) {
        if (output.lineLink[i] === 5) {
          output.prizeList[3 * j] += output.lineNumb[i];
        } else if (output.lineLink[i] === 4) {
          output.prizeList[3 * j + 1] += output.lineNumb[i];
        } else if (output.lineLink[i] === 3) {
          output.prizeList[3 * j + 2] += output.lineNumb[i];
        }
      }
    }
  }

  // Hit FG
  if ((output.winType & EWinType.winFG) === EWinType.winFG) {
    switch (output.symbolCount[Config.symbol.FG]) {
      case 3:
        output.prizeList[PrizeList.FGCount3] += 1;
        break;
      case 4:
        output.prizeList[PrizeList.FGCount4] += 1;
        break;
      case 5:
        output.prizeList[PrizeList.FGCount5] += 1;
        break;
      default:
    }
  }

  return output;
}

/** [新手機率]
 * DoNewbitPeriod 新手機率期間
 * @param {*} In
 * @param {*} Out
 * @param {*} newbitPeriod
 * @param {*}
 * @param {*}
 */
function DoNewbitPeriod(
  In: NGInput,
  oddsRange: number[]
): {
  Out: NGOutput;
  bSuccess: boolean;
} {
  // log.info("DoNewbitPeriod.");
  let bSuccess = false;

  let output: NGOutput = new NGOutput(
    Config.setting.row,
    Config.setting.column
  );

  let winPay = 0;
  let loop = 0;
  let searchTimes = 5000;

  do {
    // 產輪
    // return 0:high or 1:low
    // const ngStripType = Utils.getReelTableIndex(In);
    // const ngStripType = 0;
    // let result = new NGOutput(Config.setting.row, Config.setting.column);

    // 轉輪開獎
    output = DoWheelSymbol(In);
    output = Calc(In, output);

    // output.probType = ngStripType;

    // 贏分倍數
    winPay = output.roundWin / In.bet[0];

    // 排除fg bg
    if (
      winPay >= oddsRange[0] &&
      winPay < oddsRange[1] &&
      (output.winType & EWinType.winFG) !==
        EWinType.winFG /*&&
      (output.winType & EWinType.winBG) !== EWinType.winBG*/
    ) {
      bSuccess = true;
      break;
    }

    loop += 1;
  } while (loop < searchTimes);

  if (!bSuccess) {
    log.error("DoNewbitPeriod() not Found.");
  }

  return {
    Out: output,
    bSuccess: false, // 是否送獎
  };
}

/**
 * isBlackPeriod
 * @param {*} In
 * @param {*} Out
 * @param {*} probMachineData
 * @param {*}
 * @param {*}
 */
// function isBlackPeriod(
//   In: NGInput,
//   Out: NGOutput,
//   probMachineData: ProbMachineData
// ): { probMachineData: ProbMachineData; bSuccess: boolean } {
//   let bSuccess = false;
//   const outProbMachineData: ProbMachineData = probMachineData;

//   // 累計連續未中獎局數
//   if (Out.winType === EWinType.noWin) {
//     outProbMachineData.countNoWinRounds += 1;
//   } else {
//     if (
//       outProbMachineData.countNoWinRounds > outProbMachineData.maxNoWinRounds
//     ) {
//       outProbMachineData.maxNoWinRounds = outProbMachineData.countNoWinRounds;
//     }
//     outProbMachineData.countNoWinRounds = 0;

//     bSuccess = false;
//     // return false;
//   }

//   // 判斷是否有提高押分情形
//   if (In.betUnit * In.bet > outProbMachineData.preBet) {
//     outProbMachineData.countNoWinRounds = 0; // 提高押分黑暗期不補獎
//     bSuccess = false;
//     // return false;
//   }

//   if (outProbMachineData.maxBlackPeriodRounds === 0) {
//     outProbMachineData.maxBlackPeriodRounds =
//       LocalData.blackPeriodInitRounds +
//       Utils.myArrayI(LocalData.blackPeriodRoundWight);
//   }

//   if (
//     outProbMachineData.countNoWinRounds >=
//     outProbMachineData.maxBlackPeriodRounds
//   ) {
//     outProbMachineData.countNoWinRounds = 0;
//     outProbMachineData.maxBlackPeriodRounds = 0;
//     bSuccess = true;
//   }

//   return {
//     probMachineData: outProbMachineData,
//     bSuccess
//   };
// }

/**
 * DoRedeemInDarkAges()
 * @param {*} In
 * @param {*} Out
 * @param {*} probMachineData
 * @param {*}
 * @param {*}
 */
// function DoRedeemInDarkAges(
//   In: NGInput,
//   Out: NGOutput,
//   probMachineData: ProbMachineData
// ): {
//   Out: NGOutput;
//   probMachineData: ProbMachineData;
//   bSuccess: boolean;
// } {
//   let bSuccess = false;
//   if (!isBlackPeriod(In, Out, probMachineData)) {
//     return {
//       Out,
//       probMachineData,
//       bSuccess
//     };
//   }

//   // 黑暗期補獎產1倍以下的獎
//   let repeat = false;
//   let loop = 0;
//   let result = { Out, probMachineData };

//   do {
//     repeat = false;
//     loop += 1;

//     // 產輪
//     result = DoWheelSymbol(In, result.Out, result.probMachineData);

//     // 計算分數
//     result = Calc(In, result.Out, result.probMachineData);

//     // 判斷倍數是否大於1倍或不中獎
//     if (
//       result.Out.roundWin >= In.bet * In.betUnit ||
//       result.Out.winType === EWinType.noWin
//     ) {
//       repeat = true;
//     }

//     // 判斷是否有中FG
//     if ((result.Out.winType & EWinType.winFG) === EWinType.winFG) {
//       repeat = true;
//     }

//     if (loop > 1000) {
//       break;
//     }
//   } while (repeat === true);

//   bSuccess = true;

//   return {
//     Out: result.Out,
//     probMachineData: result.probMachineData,
//     bSuccess
//   };
// }

export const Ng = {
  Demo,
  Spin,
  Calc,
  DoWheelSymbol,
  getPrizeList,
  CheckAndClearMonthExpect,
  DoForceWin,
  DoDebugMode,
};
