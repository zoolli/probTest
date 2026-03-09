// /* eslint-disable no-bitwise, no-param-reassign */
/* eslint-disable no-bitwise */
import { Utils } from "../utils/index";
import { Config } from "../setup/config";
// import { FgStrip } from "../setup/fg_strip";
import { PrizeList } from "../setup/prize_list";

import { SwitchChance } from "../comp/switch_chance";
import { eForceType, EWinType, ProbLocalData } from "./probLocalData";
import { ProbMachineData } from "../comp/probMachineData";
import { FGInput } from "./fgInput";
import { FGOutput } from "./fgOutput";
// import { GameState } from "../comp";
import { ReelSymbol } from "../comp/reel_symbol";
import { RegulationTag } from "@championgameteam/ah-slot-game-server-plugin";
import { count } from "console";

const LocalData = new ProbLocalData();

/**
 * 取得S5回傳倍數
 * @param {*} In
 * @param {*} highRTP
 * @param {*} lowRTP
 * @param {*}
 * */
function getS5Multiple(
  In: FGInput,
  highRTP = Config.setting.wheelsRTP[0],
  lowRTP = Config.setting.wheelsRTP[1]
): number {
  let oddsIdx = 0;
  let idx = 1; // default: 1(lower)

  if (In.rtp < lowRTP || In.rtp > highRTP) {
    console.error(`Invalid In.rtp (${In.rtp})`);
  }

  // wight[0]: High Chance,  wight[1]: Low Chance
  const wight = [In.rtp - lowRTP, highRTP - In.rtp];
  idx = Utils.myArrayI(wight);

  switch (idx) {
    case 0:
      oddsIdx = Utils.myArrayI(Config.S5MultiHighWeight[In.select]);
      break;

    default:
      oddsIdx = Utils.myArrayI(Config.S5MultiLowWeight[In.select]);
      break;
  }

  // BuyFeature
  if (In.forceBingoType === eForceType.BuyFeatureFG) {
    if (idx === 0) {
      oddsIdx = Utils.myArrayI(Config.S5MultiHighWeightBF[In.select]);
    } else {
      oddsIdx = Utils.myArrayI(Config.S5MultiLowWeightBF[In.select]);
    }
  }

  return Config.S5Multi[oddsIdx];
}

/**
 * 取得WD回傳倍數
 * @param {*} In
 * @param {*} highRTP
 * @param {*} lowRTP
 * @param {*}
 * */
function getWDMultiple(
  In: FGInput,
  highRTP = Config.setting.wheelsRTP[0],
  lowRTP = Config.setting.wheelsRTP[1]
): number {
  let oddsIdx = 0;
  let idx = 1; // default: 1(lower)

  if (In.rtp < lowRTP || In.rtp > highRTP) {
    console.error(`Invalid In.rtp (${In.rtp})`);
  }

  // wight[0]: High Chance,  wight[1]: Low Chance
  const wight = [In.rtp - lowRTP, highRTP - In.rtp];
  idx = Utils.myArrayI(wight);

  switch (idx) {
    case 0:
      oddsIdx = Utils.myArrayI(Config.WDMultiHighWeight[In.select]);
      break;

    default:
      oddsIdx = Utils.myArrayI(Config.WDMultiLowWeight[In.select]);
      break;
  }

  // BuyFeature
  if (In.forceBingoType === eForceType.BuyFeatureFG) {
    if (idx === 0) {
      oddsIdx = Utils.myArrayI(Config.WDMultiHighWeightBF[In.select]);
    } else {
      oddsIdx = Utils.myArrayI(Config.WDMultiLowWeightBF[In.select]);
    }
  }

  return Config.WDMulti[In.select][oddsIdx];
}

/**
 * 計算分數
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function LineCalculate(In: FGInput, Out: FGOutput): FGOutput {
  const output: FGOutput = Out;
  output.roundWin = 0;
  output.winType = EWinType.noWin;

  const betIdx = 4; // Config.betUnitList.indexOf(In.betUnit);
  const tempSymbol = new Array(In.column);
  for (let i = 0; i < In.column; i += 1) {
    tempSymbol[i] = new Array(In.row);
  }

  // const test = [11, 6, 8, 5, 6, 7, 11, 9, 11, 2, 8, 8, 11, 7, 5];
  // output.reelSymbol = test;
  for (let i = 0; i < In.column; i += 1) {
    for (let j = 0; j < In.row; j += 1) {
      tempSymbol[i][j] = output.reelSymbol[j * In.column + i];
    }
  }

  output.lineLink = new Array(In.row).fill(1); // 連線到第幾輪
  output.lineCount = new Array(In.column); // 總共有幾連線 (1,1,1,2,1)=> 1 X 1 X 1 X 2 X 1 = 連線數
  output.lineCountNoWD = new Array(In.column); // 無WD總共有幾連線 (1,1,1,2,1)=> 1 X 1 X 1 X 2 X 1 = 連線數
  for (let i = 0; i < In.column; i += 1) {
    output.lineCount[i] = new Array(In.row).fill(0);
    output.lineCountNoWD[i] = new Array(In.row).fill(0);
  }
  output.lineNumb = new Array(In.row).fill(1); // 連線數
  output.lineSymbol = new Array(In.row).fill(-1); // 中獎圖示
  output.lineWin = new Array(In.row).fill(0); // 每線贏分

  // Initial Ng_Out parameter
  for (let i = 0; i < In.row; i += 1) {
    output.lineCount[0][i] = 1; // 第一個row相同數必為1
    output.lineCountNoWD[0][i] = 1; // 第一個row相同數必為1
    output.lineSymbol[i] = tempSymbol[0][i]; // 記錄第一個Symbol
  }

  output.isWDDouble = false;
  output.lineWDMulti = 1; // 記錄此局WD加倍倍數

  let temp = 0; // 比對第幾個數
  // 有WD和無WD的連線數
  let WDLineNumb = 1;
  let xWDLineNumb = 1;

  // 有WD和無WD連到第幾個
  let xWDRowLinkNumb = 0;
  // 固定此局的WD倍數
  output.lineWDMulti = getWDMultiple(In);

  // 是否是Debug
  if (In.debugWDMulti !== -1) {
    output.lineWDMulti = In.debugWDMulti;
  }

  // 計算ReelSymb Matrix和第一個Row相同Symbol的個數並統計得分
  do {
    // 記錄有WD和無WD的連線數 (初始化)
    WDLineNumb = 1;
    xWDLineNumb = 1;

    // 從第二輪開始檢查是否有和第一輪相同的Symbol (0-base)
    for (let i = 1; i < In.column; i += 1) {
      for (let j = 0; j < In.row; j += 1) {
        // SC Symbol不和WD連線
        if (output.lineSymbol[temp] === Config.symbol.FG) {
          if (tempSymbol[i][j] === output.lineSymbol[temp]) {
            output.lineCount[i][temp] += 1;
          }
        }
        // 不同押輪
        // 其他Symbol和WD連線
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

    // 從第二輪開始檢查是否有和第一輪相同的Symbol (不考慮WD 0-base)
    for (let i = 1; i < In.column; i += 1) {
      for (let j = 0; j < In.row; j += 1) {
        // 不同押輪
        if (
          (LocalData.payReelLine[betIdx][j * In.column + i] === 1 ||
            output.lineSymbol[temp] === Config.symbol.FG) &&
          tempSymbol[i][j] === output.lineSymbol[temp]
        ) {
          output.lineCountNoWD[i][temp] += 1;
        }
      }
      // 有一整個Row沒計算到個數就停止
      if (output.lineCountNoWD[i][temp] === 0) {
        break;
      }
    }

    // 計算線數 (從最後一輪開始檢查是否有個數 0-base)
    for (let k = 4; k > 0; k -= 1) {
      // 比到第二個還是沒個數的話令連線數為零、幾連線也為零
      if (k === 2 && output.lineCount[k][temp] === 0) {
        WDLineNumb = 0;
        output.lineLink[temp] = 0;
        output.lineNumb[temp] = 0;
        break;
      }
      // 有個數時要累乘以計算總線數並留下最大的不為零的位置
      else if (output.lineCount[k][temp] !== 0) {
        output.lineNumb[temp] *= output.lineCount[k][temp];

        WDLineNumb *= output.lineCount[k][temp];

        // 0-base -> 1-base
        if (k + 1 > output.lineLink[temp] && k + 1 > 2) {
          output.lineLink[temp] = k + 1;
        }
      }
    }

    // 計算沒有WD的連線個數 (初始化)
    xWDRowLinkNumb = 0;

    // 先取出最後一個不為1的位置 0-base
    for (let k = 4; k > 0; k -= 1) {
      if (output.lineCountNoWD[k][temp] !== 0) {
        if (k + 1 > 2) {
          xWDRowLinkNumb = k + 1;
        } else {
          xWDRowLinkNumb = 0;
        }
        break;
      }
    }

    // 當最後一個不為1的位置在第三個位置之後,去乘以各row的個數計算總線數
    if (xWDRowLinkNumb > 2) {
      for (let k = 0; k < xWDRowLinkNumb; k += 1) {
        xWDLineNumb *= output.lineCountNoWD[k][temp];
      }
    }
    // 不在第三個位置之後,則連線數為0
    else {
      xWDRowLinkNumb = 0;
    }

    if (WDLineNumb > 0 && output.lineLink[temp] > 0) {
      // 當RowLink相同,LineNum相同
      if (
        xWDRowLinkNumb === output.lineLink[temp] &&
        xWDLineNumb === WDLineNumb
      ) {
        output.lineWin[temp] +=
          xWDLineNumb *
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        // 線的賠倍
        output.lineOdds[temp] =
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
      }
      // 當RowLink相同,LineNum不同
      else if (
        xWDRowLinkNumb === output.lineLink[temp] &&
        xWDLineNumb !== WDLineNumb
      ) {
        const lineWinWD =
          output.lineWDMulti *
          (WDLineNumb - xWDLineNumb) *
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];

        output.lineWin[temp] += lineWinWD;
        // output.lineWDMulti *
        // (WDLineNumb - xWDLineNumb) *
        // Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];

        const lineWinNoWD =
          xWDLineNumb *
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];

        output.lineWin[temp] += lineWinNoWD;

        // 線的賠倍
        output.lineOdds[temp] =
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        // xWDLineNumb *
        // Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        output.isWDDouble = true;

        // [贏分區分]
        output.subLineWinWd[temp] += lineWinWD;
        output.subLineWinNoWd[temp] += lineWinNoWD;
        output.isSubLinWin[temp] = true;
      }
      // 當RowLink不同,LineNum相同
      else if (
        xWDRowLinkNumb !== output.lineLink[temp] &&
        xWDLineNumb === WDLineNumb
      ) {
        output.lineWin[temp] +=
          output.lineWDMulti *
          WDLineNumb *
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        // 線的賠倍
        output.lineOdds[temp] =
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        output.isWDDouble = true;
      }
      // 當RowLink不同,LineNum不同
      else if (
        xWDRowLinkNumb !== output.lineLink[temp] &&
        xWDLineNumb !== WDLineNumb
      ) {
        output.lineWin[temp] +=
          output.lineWDMulti *
          WDLineNumb *
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        // 線的賠倍
        output.lineOdds[temp] =
          Config.payTable[output.lineSymbol[temp]][output.lineLink[temp] - 1];
        output.isWDDouble = true;
      }
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

  // 無中WD獎
  if (!output.isWDDouble) {
    output.lineWDMulti = 1;
  }

  return output;
}

/**
 * 計算Symbol
 * @param {*} In
 * @param {*} Out
 */
function SymbolCalculate(In: FGInput, Out: FGOutput): FGOutput {
  const output: FGOutput = Out;

  // 初始化
  output.symbolCount = new Array(Object.keys(Config.symbol).length).fill(0);
  output.fgPassReel = new Array(In.column * In.row).fill(-1); // FG Scatter經過的位置

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
  } else {
    output.winType |= EWinType.winFG;
  }

  // 初始化紅包倍獎倍數
  output.RPDoublePrize = 0;

  // 第一輪和第五輪出現紅包時得到Total Bet倍數獎
  for (let i = 0; i < In.row; i += 1) {
    // 第一列有無S5
    if (output.reelSymbol[i * In.column] === Config.symbol.S5) {
      for (let j = 0; j < In.row; j += 1) {
        // 第五列有無S5
        if (output.reelSymbol[j * In.column + 4] === Config.symbol.S5) {
          output.RPDoublePrize = getS5Multiple(In);
          output.winType |= EWinType.winRPDouble;
        }
      }
    }
  }

  return output;
}

// DFS
function findAllPaths(columns: number[][]): number[][] {
  const result: number[][] = [];

  function dfs(level: number, path: number[]) {
    // 到葉節點或遇到後續欄位沒有任何可選值時，視為一條完整路線
    if (level === columns.length || columns[level].length === 0) {
      result.push([...path]);
      return;
    }

    // 展開當前欄位的所有可能
    for (const value of columns[level]) {
      path.push(value);
      dfs(level + 1, path);
      path.pop(); // 回溯
    }
  }

  dfs(0, []);
  return result;
}

/**
 * 算分function
 * @param {*} In
 * @param {*} Out
 * @param {*}
 */
function Calc(In: FGInput, Out: FGOutput): FGOutput {
  let output: FGOutput = Out;

  // 初始化
  output.hitFg = false;
  // 計算線獎
  output = LineCalculate(In, Out);

  // 計算個數
  output = SymbolCalculate(In, Out);

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

    output.hitFg = true;
  }

  // 計算線獎
  const { betUnit } = Config.setting;
  for (let i = 0; i < In.row; i += 1) {
    if (output.lineWin[i] > 0 && output.lineSymbol[i] !== Config.symbol.FG) {
      output.lineWin[i] = Utils.bigNumber(
        (output.lineWin[i] * In.bet[0]) / betUnit
      );
      output.roundWin = Utils.bigNumber(output.roundWin + output.lineWin[i]);
      output.winType |= EWinType.win;
    }
  }

  // 一般贏分的贏分
  output.generalWin = output.roundWin;

  // 加入紅包倍獎得分
  if (output.RPDoublePrize > 0) {
    // const unit = In.reelBet > 25 ? 25 : In.reelBet;
    output.roundWin = Utils.bigNumber(
      output.roundWin + output.RPDoublePrize * (In.bet[0] * In.reelBet)
    ) /* In.betUnit */;
    output.winType |= EWinType.winRPDouble;
  }

  // 是否有WD倍獎
  if (output.isWDDouble) {
    output.winType |= EWinType.winWDDouble;
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
        output.lineWin[i] = win; // 更新lineWin為FG贏分
      }
      const position = [];
      const transReels = Utils.transformReels(output.hitLineSymbolReel[symbol]);

      // 是否有WD倍獎
      if (output.isWDDouble && output.isSubLinWin[i] === true) {
        const transReelsReelsSymbol = Utils.transformReels(output.reelSymbol);
        const hitWdCol = [];
        const rowHitSymbolNoWd = [[], [], [], [], []];
        const rowHitSymbolWd = [[], [], [], [], []];
        const rowHitSymbol = [[], [], [], [], []];

        //找出有WD位置與沒有WD位置
        for (let k = 0; k < In.column * In.row; k++) {
          const col = k % In.row;
          const row = Math.floor(k / In.row);
          if (transReels[k] === 1) {
            rowHitSymbol[row].push(k);
            if (transReelsReelsSymbol[k] === Config.symbol.WD) {
              rowHitSymbolWd[row].push(k);
              hitWdCol.push(row);
            } else {
              rowHitSymbolNoWd[row].push(k);
            }
          }
        }

        const paths = findAllPaths(rowHitSymbol);

        let isWDSymbol = false;
        for (let k = 0; k < paths.length; k++) {
          isWDSymbol = false;
          paths[k].forEach((val) => {
            if (transReelsReelsSymbol[val] === Config.symbol.WD) {
              isWDSymbol = true;
            }
          });

          const link = paths[k].length - 1;
          if (isWDSymbol) {
            output.winInfo.push({
              symbol,
              win: Utils.bigNumber(
                (Config.payTable[symbol][link] *
                  output.lineWDMulti *
                  In.bet[0]) /
                betUnit
              ),
              position: paths[k],
              odds: Utils.bigNumber(Config.payTable[symbol][link] / betUnit), // output.lineWDMulti,

              // credit: Config.payTable[symbol][link],// output.lineOdds[i],
              win_type: 0,
              line_no: 0,
              multi: output.lineWDMulti,
              count: link,
              lineCnt: 1,
            });
          } else {
            output.winInfo.push({
              symbol,
              win: Utils.bigNumber(
                (Config.payTable[symbol][link] * In.bet[0]) / betUnit
              ),
              position: paths[k],
              odds: Utils.bigNumber(Config.payTable[symbol][link] / betUnit),

              // credit: output.lineOdds[i],
              win_type: 0,
              line_no: 0,
              multi: 1,
              count: link,
              lineCnt: 1,
            });
          }
        }
      } else {
        //
        for (let j = 0; j < In.column * In.row; j += 1) {
          if (transReels[j] === 1) {
            position.push(j);
          }
        }
        // output.winInfo.push({ symbol, win: output.lineWin[i], position });
        let odds = Utils.bigNumber(
          Config.payTable[symbol][output.lineLink[i] - 1] / betUnit
        );

        if (symbol === Config.symbol.FG) {
          odds = Utils.bigNumber(
            Config.payTable[symbol][output.symbolCount[symbol] - 1]
          );
        }
        output.winInfo.push({
          symbol,
          win: output.lineWin[i],
          position,
          odds,
          win_type: 0,
          line_no: 0,
          multi: 1,
          count: output.lineLink[i],
          lineCnt: output.lineNumb[i],
        });
      }
    }
  }

  // 紅包獎
  output.RPWin = 0;

  if (output.RPDoublePrize > 0) {
    const tmp = [0, 4]; // 第一列和第五列產生S5
    const symbol = Config.symbol.S5;
    const win = Utils.bigNumber(
      output.RPDoublePrize * (In.reelBet * In.bet[0])
    );

    const position = [];
    const transReels = Utils.transformReels(output.reelSymbol);
    for (let i = 0; i < 2; i += 1) {
      for (let j = 0; j < In.row; j += 1) {
        if (transReels[tmp[i] * In.row + j] === Config.symbol.S5) {
          position.push(tmp[i] * In.row + j);
        }
      }
    }
    // output.winInfo.push({ symbol, win, position);
    output.winInfo.push({
      symbol,
      win,
      position,
      credit: output.RPDoublePrize,
      win_type: 1,
      line_no: -1,
      count: 2,
      multiply: 1,
    });

    output.RPWin = win;
  }

  return output;
}

/**
 * 產生盤面
 * @param {*} In
 * @param {*}
 */
function DoWheelSymbol(In: FGInput): FGOutput {
  const output: FGOutput = new FGOutput(
    Config.setting.row,
    Config.setting.column
  );

  const fgStripType = Utils.getReelTableIndex(In);
  output.reelSymbol = ReelSymbol.fg(fgStripType);

  return output;
}

// 判斷是否強迫中獎
// function isForceBingo(In: FGInput): boolean {
//   // console.log("No any forceBingo value!!");
//   return false;
// }

// 判斷是否Debug
function isDebug(In: FGInput): boolean {
  for (let i = 0; i < In.column; i += 1) {
    if (In.strip[i] !== -1) {
      return true;
    }
  }
  return false;
}

// ////////////////////////////////////////////
// 不中獎轉輪
/** Demo() */
function Demo(In: FGInput): FGOutput {
  let result: FGOutput = null;

  // 產不中獎
  do {
    // 產輪
    result = DoWheelSymbol(In);

    // 計算分數
    result = Calc(In, result);
  } while (result.winType !== EWinType.noWin);

  return result;
}

function DoDebugMode(
  In: FGInput
  // Out: FGOutput
): {
  Out: FGOutput;
  bSuccess: boolean;
} {
  const bSuccess = false;
  let output: FGOutput = new FGOutput(
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

  // 取得轉輪帶
  const snWheels = SwitchChance.fg(0); // Spin()時決定用哪個轉輪帶
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

// ////////////////////////////////////////////
// 內部統計資訊
// CheckAndClearMonthExpect
function CheckAndClearMonthExpect(
  In: FGInput,
  Out: FGOutput,
  probMachineData: ProbMachineData
): {
  Out: FGOutput;
  probMachineData: ProbMachineData;
  bSuccess: boolean;
} {
  const { roundWin } = Out;
  const outProbMachineData: ProbMachineData = probMachineData;

  // 累加贏分
  outProbMachineData.totalWin += roundWin;
  outProbMachineData.monthWin += roundWin;

  return {
    Out,
    probMachineData: outProbMachineData,
    bSuccess: false,
  };
}

// ////////////////////////////////////////////
// DoNatureRandPrize
function DoNatureRandPrize(
  In: FGInput
): {
  Out: FGOutput;
  bSuccess: boolean;
} {
  // 自然產獎
  let result = DoWheelSymbol(In);

  result = Calc(In, result);

  return {
    Out: result,
    bSuccess: false,
  };
}

// ////////////////////////////////////////////
// Spin
function Spin(
  In: FGInput,
  probMachineData: ProbMachineData
): { Out: FGOutput; probMachineData: ProbMachineData } {
  // Debug
  let result = DoDebugMode(In);

  // 自然機率
  if (!result.bSuccess) {
    result = DoNatureRandPrize(In);
  }

  // 是否送獎
  result.Out.isForceBingo = result.bSuccess;

  // if (In.fgRounds === 1) {
  //   console.log(`In.fgGetScore:: ${In.fgGetScore}`);
  // }

  // 送獎&Debug不做控制
  if (!result.bSuccess) {
    // FG 限制條件////////////////////////////////////////
    // Start.
    // [新手機率] 擋獎
    if (
      In.newBitTags.includes(RegulationTag.newbieBegin) &&
      probMachineData.isBuyFeature === false
    ) {
      let limitedNewBitTotalWin =
        Config.extraInfo.newBitLimitedPays * In.bet[0];

      if (
        limitedNewBitTotalWin !== undefined &&
        // FG累積贏分
        In.fgGetScore + result.Out.roundWin > limitedNewBitTotalWin
      ) {
        result.Out = Demo(In);
        result.bSuccess = false;
      }
    }

    // End. [新手機率] 擋獎

    let isLimitCondition = false;
    let [lower, upper]: number[] = [0, 1];

    // FG最大贏分限制 or Fg最大局數 or Fg最大次數
    let totalWinLimit = In.maxBet * 1000;
    if (In.totalWinLimit > 0) {
      totalWinLimit = In.totalWinLimit;
    }

    // 最大贏分限制
    if (
      In.fgGetScore + result.Out.roundWin >= totalWinLimit ||
      (In.fgRounds > 0 && In.fgRounds >= In.maxFGRounds) ||
      (In.fgTotalTimes > 0 && In.fgTotalTimes >= In.maxFGTimes)
    ) {
      // const [lower, upper] = [0, 1];
      result.Out = Demo(In);
    }

    // 虛寶卡 不超過設定倍數100
    if (probMachineData.isForceBingoCard === true) {
      // 目前累積分數 + roundWin
      let winPay =
        (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);

      if (winPay > LocalData.forceBingoCardMaxOdds) {
        result.Out = Demo(In);
      }
    }

    // Fg保障倍數5~8倍
    if (In.fgRounds === 1 && In.fgGetScore / (In.bet[0] * In.reelBet) < 5.0) {
      const [lower, upper] = [5, 10];

      // 目前累積分數 + roundWin
      let winPay =
        (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);
      let loop = 0;

      // 不可中FG且在範圍內且不能有WD
      while (
        winPay < lower ||
        winPay > upper ||
        (result.Out.winType & EWinType.winFG) === EWinType.winFG
      ) {
        result = DoNatureRandPrize(In);
        // const preWinPay = In.fgGetScore / (In.bet[0] * In.reelBet);
        // 目前累積分數 + roundWin
        winPay =
          (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);

        loop += 1;
        // 累積已達到最大贏分限制或是找尋1000次
        if (loop > 1000) {
          result.Out = Demo(In);
          break;
        }
      }
    }
    // End.

    // 購買免遊
    if (In.forceBingoType === eForceType.BuyFeatureFG) {
      // FG累積贏分+FG中BG累積贏分
      let winPay =
        (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);

      // 擋獎
      if ((winPay > 300 && Utils.myRand(100) < 50) || (winPay > 500 && Utils.myRand(100) < 75)) {
        result.Out = Demo(In);
        result.bSuccess = false;
      }

      winPay =
        (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);

      if (
        In.fgRounds < 2 &&
        winPay < 20 &&
        (result.Out.winType & EWinType.winFG) !== EWinType.winFG
      ) {
        let loop = 0;
        do {
          result = DoNatureRandPrize(In);

          winPay =
            (In.fgGetScore + result.Out.roundWin) / (In.bet[0] * In.reelBet);

          if (
            winPay >= 15 &&
            winPay < 30 &&
            (result.Out.winType & EWinType.winFG) !== EWinType.winFG
          ) {
            break;
          }

          if (loop > 1000) {
            break;
          }

          loop += 1;
        } while (loop < 1000 /*result.Out.winType === EWinType.noWin*/);

        // currentBGWin = CalcCurrentBG(In, result.Out);
      }
    }
    // //////////////////////////////////////
  }

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
 */
function getPrizeList(In: FGInput, Out: FGOutput): FGOutput {
  const output: FGOutput = Out;

  // 初始
  const prizeSize = Object.keys(PrizeList).length;
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

export const Fg = {
  Demo,
  Spin,
  Calc,
  DoWheelSymbol,
  getPrizeList,
  CheckAndClearMonthExpect,
  // DoForceWin,
  DoDebugMode,
};
