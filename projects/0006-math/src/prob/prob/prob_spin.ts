// /* eslint-disable no-bitwise, no-param-reassign */
/* eslint-disable no-bitwise */
import {
  IGameData,
  IBet,
  IUserInput,
  IUserData,
  IMachineData,
  RegulationTag,
  log,
} from "@championgameteam/ah-slot-game-server-plugin";
import { Config } from "../setup/config";
import { FgStrip } from "../setup/fg_strip";
import { Utils } from "../utils";

import { status } from "../enums/status";
import { GameState } from "../comp/game_state";
import { ProbMachineData } from "../comp/probMachineData";

import { EWinType } from "./probLocalData";

import { NGInput } from "./ngInput";
import { NGOutput } from "./ngOutput";
import { FGInput } from "./fgInput";
import { FGOutput } from "./fgOutput";

import { Ng } from "./prob_ng";
import { Fg } from "./prob_fg";

import { FgWinInfo } from "../extends/FgWinInfo";
// import { BgWinInfo } from "../extends/BgWinInfo";

const msgLevel = -1; // MSG等級

/**
 * Demo Spin function
 * @param {*} In
 * @param {*}
 * @param {*}
 * @param {*}
 */
function Demo(In: NGInput): NGOutput {
  // //////
  const output: NGOutput = Ng.Demo(In);
  // ////////////////////////
  // Demo 轉輪帶橫轉直(開介面傳給前端)
  // 輪帶轉製
  output.reelSymbol = Utils.transformReels(output.reelSymbol);

  return output;
}

function initialize(): {
  Out: NGOutput;
  gameState: GameState;
  probMachineData: ProbMachineData;
} {
  const gameState = new GameState(Config.setting.row, Config.setting.column);
  const probMachineData = new ProbMachineData();

  // 輸入 輸出 變數///
  const ngInput: NGInput = new NGInput(
    Config.setting.row,
    Config.setting.column
  );
  // let ngOutput: NGOutput = new NGOutput(
  //   Config.setting.row,
  //   Config.setting.column
  // );

  Utils.debugMSG(msgLevel, "initialize::=======Demo()========= ");

  // 使用defualt value
  const Out = Demo(ngInput);

  // 目前狀態與下個狀態
  gameState.state = status.NormalGame;
  gameState.nextState = status.NormalGame;

  return {
    Out,
    gameState,
    probMachineData,
  };
}

/**
 * Ng Spin function
 * @param {*} In
 * @param {*} probMachineData
 * @param {*}
 * @param {*}
 * @param {*}
 */
function NgSpin(
  In: NGInput,
  probMachineData: ProbMachineData
): { Out: NGOutput; probMachineData: ProbMachineData } {
  //
  const result = Ng.Spin(In, probMachineData);

  // 統計大牌表
  result.Out = Ng.getPrizeList(In, result.Out);

  // 輪帶轉置
  result.Out.reelSymbol = Utils.transformReels(result.Out.reelSymbol);
  result.Out.fgPassReel = Utils.transformReels(result.Out.fgPassReel);

  return {
    Out: result.Out,
    probMachineData: result.probMachineData,
  };
}

/**
 * FG Spin Function
 * @param {*} In
 * @param {*} probMachineData
 * @param {*}
 * @param {*}
 * @param {*}
 */
function FgSpin(
  In: FGInput,
  probMachineData: ProbMachineData
): { Out: FGOutput; probMachineData: ProbMachineData } {
  //
  const result = Fg.Spin(In, probMachineData);

  // 傳出FG累積贏分
  result.Out.fgTotalWin = Utils.bigNumber(In.fgGetScore + result.Out.roundWin);

  // 統計大牌表
  result.Out = Fg.getPrizeList(In, result.Out);

  // FG目前剩餘總局數(不含加局)
  result.Out.fgRemainingRounds = In.fgRounds - 1;

  // Fg 剩餘局數 (含加局)
  result.Out.fgRounds = result.Out.fgRemainingRounds + result.Out.fgAddRound;

  // 輪帶轉製
  result.Out.reelSymbol = Utils.transformReels(result.Out.reelSymbol);
  result.Out.fgPassReel = Utils.transformReels(result.Out.fgPassReel);

  return {
    Out: result.Out,
    probMachineData: result.probMachineData,
  };
}

/**
 * [State] NG function
 * @param param : gameState: GameState; probMachineData: ProbMachineData
 * @param input : NGInput
 *
 */
function stateNG(
  param: { gameState: GameState; probMachineData: ProbMachineData },
  input: NGInput
): { Out: NGOutput; gameState: GameState; probMachineData: ProbMachineData } {
  Utils.debugMSG(msgLevel, "probStateNG::=======NG()========= ");

  // NG Spin
  const { gameState, probMachineData } = param;

  const { liveRtp, liveCnt, liveTotalbet, liveTotalwin } = gameState;
  input.liveStatus = {
    liveRtp,
    liveCnt,
    liveTotalbet,
    liveTotalwin,
  };

  // [控制機制]
  input.controlRTP = gameState.controlRTP;
  input.controlNewbie = gameState.controlNewbie;

  const result = NgSpin(input, probMachineData);

  // 是否進行rtp校正
  gameState.rtpModify = result.Out.rtpModify;

  // 目前狀態與下個狀態
  gameState.state = status.NormalGame;
  gameState.nextState = status.NormalGame;

  // 紀錄盤面資訊
  gameState.ngReels = result.Out.reelSymbol;
  gameState.roundTotalwin = result.Out.roundWin;
  gameState.currentWin = result.Out.roundWin;

  // 送獎是否成功
  gameState.isForceBingo = result.Out.isForceBingo;

  // NG中FG 5選1
  if ((result.Out.winType & EWinType.winFG) === EWinType.winFG) {
    Utils.debugMSG(msgLevel, "probStateNg::=======Hit FG========= ");

    // 下個狀態
    gameState.nextState = status.GameSelecting;

    // FG次數
    gameState.fgTotalTimes = 1;

    // FG累積分數初始化
    gameState.fgTotalWin = 0;

    // FG選擇局數項目
    result.Out.selectFgRounds = Config.setting.fgRounds;

    // FG選擇WD項目
    result.Out.selectWinMultiple = Config.WDMulti;
  }

  // [State] NG中儲存當局押分紀錄
  gameState.betUnit = input.reelBet;
  gameState.bet = input.bet;

  return {
    Out: result.Out,
    gameState,
    probMachineData: result.probMachineData,
  };
}

/**
 * [State] GameSelecting function
 * @param param : gameState: GameState; probMachineData: ProbMachineData
 * @param input : FGInput
 *
 */
function stateGameSelecting(
  param: { gameState: GameState; probMachineData: ProbMachineData },
  input: FGInput
): FgWinInfo {
  Utils.debugMSG(
    msgLevel,
    `Prob_State_Dispatch::=======Selected =========${input.select} `
  );

  const { gameState } = param;

  // 目前
  gameState.state = status.GameSelecting;

  // 下個狀態
  // gameState.nextState = status.FreeGameInit;
  gameState.nextState = status.FreeGame;

  // FG次數減1
  gameState.fgTotalTimes -= 1;

  // FGInput總局數
  const fgTotalRound = Config.setting.fgRounds[input.select];

  // [State] FG總局數
  gameState.fgTotalRound = fgTotalRound;
  gameState.fgRemainingRounds = fgTotalRound;

  // [State]儲存選擇局數
  gameState.fgMode = input.select;

  const newFgWinInfo = new FgWinInfo();

  // FG局數
  newFgWinInfo.fgTotalRound = gameState.fgTotalRound;

  // 進Free Game的初始盤面也就是NG結束盤面
  newFgWinInfo.fgReels = gameState.ngReels;

  // 傳出被選擇的 fg strip
  newFgWinInfo.fgStrip = Utils.snStriptTableToId(FgStrip.type0);

  // 選擇的FG Mode
  newFgWinInfo.fgMode = gameState.fgMode;

  // GameSelecting中傳出目前押輪與押注
  newFgWinInfo.betUnit = input.reelBet;

  // GameSelecting中傳出目前押注
  newFgWinInfo.bet = [{ name: "anyWays", bet: 0 }];

  //  FG 總次數
  newFgWinInfo.fgRemainingTimes = gameState.fgTotalTimes;

  return newFgWinInfo;
}

/**
 * [State] FGInit function
 * @param param : gameState: GameState; probMachineData: ProbMachineData
 * @param input : FGInput
 *
 */
function stateFGInit(
  param: { gameState: GameState; probMachineData: ProbMachineData },
  input: FGInput
): { Out: FGOutput; gameState: GameState; probMachineData: ProbMachineData } {
  Utils.debugMSG(msgLevel, "probStateFGInit::=======FG()Init========= ");

  const { gameState, probMachineData } = param;
  const fgInput = input;

  // 目前
  gameState.state = gameState.nextState;
  // 下個狀態
  gameState.nextState = status.FreeGame;

  // [gameState] fg累加分數
  fgInput.fgGetScore = gameState.fgTotalWin;

  // FG剩餘局數
  fgInput.fgRounds = gameState.fgRemainingRounds;

  fgInput.fgRounds = gameState.fgRemainingRounds;

  // FG Spin
  const result = FgSpin(fgInput, probMachineData);

  // 紀錄盤面資訊
  gameState.fgReels = result.Out.reelSymbol;

  // [State] FG每局產出之轉輪結果
  gameState.fgReels = result.Out.reelSymbol.slice();

  // [State] FG累加分數
  // fgOutput.fgTotalWin = fgInput.fgGetScore + fgOutput.roundWin;
  gameState.fgTotalWin = result.Out.fgTotalWin; // fgOutput.fgTotalWin;

  // [State] FG剩餘局數(加局)
  gameState.fgRemainingRounds = result.Out.fgRemainingRounds; // fgOutput.fgRemainingRounds;

  // FG次數
  if ((result.Out.winType & EWinType.winFG) === EWinType.winFG) {
    gameState.fgTotalTimes += 1;
  }

  if (gameState.fgTotalTimes > 0) {
    result.Out.fgTotalTimes = gameState.fgTotalTimes;
  }

  // 回傳初次選擇的FG Mode
  result.Out.fgMode = gameState.fgMode;

  return {
    Out: result.Out,
    gameState,
    probMachineData: result.probMachineData,
  };
}

/**
 * [State] FG function
 * @param param : gameState: GameState; probMachineData: ProbMachineData
 * @param input : FGInput
 *
 */
function stateFG(
  param: { gameState: GameState; probMachineData: ProbMachineData },
  input: FGInput
): { Out: FGOutput; gameState: GameState; probMachineData: ProbMachineData } {
  Utils.debugMSG(msgLevel, "probStateFG::=======FG()========= ");

  const { gameState, probMachineData } = param;
  const fgInput = input;

  // 目前
  gameState.state = gameState.nextState;

  // [gameState] fg累加分數
  fgInput.fgGetScore = gameState.fgTotalWin;

  // FG剩餘局數
  fgInput.fgRounds = gameState.fgRemainingRounds;

  // FG總次數
  fgInput.fgTotalTimes = gameState.fgTotalTimes;

  let result = {
    Out: new FGOutput(Config.setting.row, Config.setting.column),
    probMachineData,
  };

  // 假如剩餘局數大於0
  if (fgInput.fgRounds > 0) {
    result = FgSpin(fgInput, probMachineData);
    // [State] FG次數
    if ((result.Out.winType & EWinType.winFG) === EWinType.winFG) {
      gameState.fgTotalTimes += 1;
    }

    // 紀錄盤面資訊
    gameState.fgReels = result.Out.reelSymbol;
    gameState.roundTotalwin = result.Out.roundWin;
    gameState.currentWin = result.Out.roundWin;

    // [State] FG每局產出之轉輪結果
    gameState.fgReels = result.Out.reelSymbol.slice();

    // [State] FG累加分數
    gameState.fgTotalWin = result.Out.fgTotalWin;

    // [State] 紀錄FG總剩餘局數(加局)
    gameState.fgRemainingRounds = result.Out.fgRounds;
  }

  if (gameState.fgRemainingRounds === 0) {
    if (gameState.fgTotalTimes > 0) {
      // 下個狀態 重新進入FG
      gameState.nextState = status.GameSelecting;

      // FG選擇局數項目
      result.Out.selectFgRounds = Config.setting.fgRounds;

      // FG選擇倍數項目
      result.Out.selectWinMultiple = Config.WDMulti;
    } else {
      // 下個狀態
      gameState.nextState = status.NormalGame;

      // 回到初始進入畫面
      result.Out.ngReels = gameState.ngReels.slice();

      // 初始化
      // gameState.fgTotalWin = 0;
    }
  } else {
    // 下個狀態
    gameState.nextState = status.FreeGame;
  }

  // 可玩FG次數
  if (gameState.fgTotalTimes > 0) {
    result.Out.fgTotalTimes = gameState.fgTotalTimes;
  }

  // 回傳初次選擇的FG Mode
  result.Out.fgMode = gameState.fgMode;

  return {
    Out: result.Out,
    gameState,
    probMachineData: result.probMachineData,
  };
}

/**
 * Machine State
 * @param param
 * @param input :any => 外部塞入機率需要資料( bet, reelBet, select?)
 *
 */
// Machine State
function probStateDispatch(
  param: {
    gameState: GameState;
    probMachineData: ProbMachineData;
    gameData: IGameData;
  },
  input: any
): { Out: any; gameState: GameState; probMachineData: ProbMachineData } {
  const { gameData } = param;
  let { gameState, probMachineData } = param;
  let Out: any;

  // const LocalData: ProbLocalData = new ProbLocalData();

  // 輸入 輸出 變數
  const ngInput: NGInput = new NGInput(
    Config.setting.row,
    Config.setting.column
  );

  const fgInput: FGInput = new FGInput(
    Config.setting.row,
    Config.setting.column
  );

  // 押輪 1
  const { reelBet } = Config.setting;

  // 目前押注
  const currentBet = [0];
  // currentBet[0] = input.bet[0].bet === undefined ? 0 : input.bet[0].bet;
  currentBet[0] =
    input.bet[0].bet === undefined || input.bet[0].bet === 0
      ? gameState.bet[0]
      : input.bet[0].bet;

  // 送獎
  const bingo: string = input.forceBingo;

  // [新手機率]
  const { forceBingoCardInfo, strBuyFeature, userDataTags } = input;

  // NG 輸入資料
  if (gameState.nextState === status.NormalGame) {
    // [BuyFeature] 買免費遊戲
    if (strBuyFeature === Config.buyFeatureName.FG) {
      const buyFeatureBet = Utils.bigNumber(
        input.bet[0].bet / Config.extraInfo.oddsBuyFeatureFG
      );
      currentBet[0] = buyFeatureBet;
      ngInput.isBuyFeature = true;
      ngInput.strBuyFeature = strBuyFeature;
    } else if (strBuyFeature === Config.buyFeatureName.BG) {
      //"BuyFeatureBG"
      const buyFeatureBet = Utils.bigNumber(
        input.bet[0].bet / Config.extraInfo.oddsBuyFeatureBG
      );
      currentBet[0] = buyFeatureBet;
      ngInput.isBuyFeature = true;
      ngInput.strBuyFeature = strBuyFeature;
    }

    // 虛寶卡
    // 目前押注，是否使用虛寶卡
    // const { forceBingoCardInfo } = input;
    if (forceBingoCardInfo.length > 0) {
      currentBet[0] = Number(forceBingoCardInfo[1]);
      ngInput.isAwardItem = true;
    }

    ngInput.rtp =
      Object.values(Config.rtp).indexOf(input.rtp) === -1
        ? Config.setting.rtp
        : input.rtp;

    ngInput.reelBet = reelBet;
    ngInput.bet = currentBet;

    // 最小押分
    ngInput.minBet =
      input.minBet > 0 || input.minBet !== undefined
        ? input.minBet
        : Config.setting.minBet;

    // 最大押分(gameData/Config)
    ngInput.maxBet =
      gameData && gameData.maxBet !== undefined && gameData.maxBet > 0
        ? gameData.maxBet
        : Config.setting.maxBet;

    // FG最大總贏分限制(gameData/Config)
    ngInput.totalWinLimit =
      gameData && gameData.totalWinLimit !== undefined
        ? gameData.totalWinLimit
        : -1;

    ngInput.forceBingo = bingo;

    // Debug轉輪
    if (input.strip !== undefined) {
      for (let i = 0; i < input.strip.length; i += 1) {
        ngInput.strip[i] = input.strip[i];
      }
    }
    // [新手機率]
    ngInput.newBitTags = userDataTags;
  }
  // FG 輸入資料
  else if (gameState.nextState === status.FreeGame) {
    // const isSelectRespin = true; // 選擇玩Respin: false , FG: true
    fgInput.rtp =
      Object.values(Config.rtp).indexOf(input.rtp) === -1
        ? Config.setting.rtp
        : input.rtp;

    // 選擇局數
    fgInput.select =
      gameState.fgMode < 0 || gameState.fgMode > 4 ? 0 : gameState.fgMode;

    // 取NG的紀錄
    fgInput.reelBet = gameState.betUnit;

    // 輸入為0 取NG的紀錄
    fgInput.bet = gameState.bet;

    // 最小押分
    fgInput.minBet =
      input.minBet > 0 || input.minBet !== undefined
        ? input.minBet
        : Config.setting.minBet;

    // 最大押分
    fgInput.maxBet =
      gameData && gameData.maxBet !== undefined && gameData.maxBet > 0
        ? gameData.maxBet
        : Config.setting.maxBet;

    // FG最大總贏分限制
    fgInput.totalWinLimit =
      gameData.totalWinLimit >= -1 || gameData.totalWinLimit !== undefined
        ? gameData.totalWinLimit
        : Config.setting.totalWinLimit;

    // 送獎 Config.forceBingo.no or Config.forceBingo.fgInFG
    fgInput.forceBingo = -1;

    fgInput.fgTotalRound = gameState.fgTotalRound;
    fgInput.fgGetScore = 0;
    fgInput.fgRounds = gameState.fgRemainingRounds; // ngOutput時存入初始資料, fgSpin()每局會更新

    // Debug轉輪
    if (input.strip !== undefined) {
      for (let i = 0; i < input.strip.length; i += 1) {
        fgInput.strip[i] = input.strip[i];
      }
    }

    // FG最大局數限制
    if (Config.setting.maxFGRounds > 0) {
      fgInput.maxFGRounds = Config.setting.maxFGRounds;
    }

    // FG最大次數限制
    if (Config.setting.maxFGTimes > 0) {
      fgInput.maxFGTimes = Config.setting.maxFGTimes;
    }
    // [新手機率]
    fgInput.newBitTags = userDataTags;
  }

  // NG Spin
  if (gameState.nextState === status.NormalGame) {
    // 處理NG State
    const result = stateNG(param, ngInput);

    // 輸出值
    Out = result.Out;
    gameState = result.gameState;
    probMachineData = result.probMachineData;
  }
  // 五選一 FG
  else if (gameState.nextState === status.GameSelecting) {
    // 輸出值
    Out = stateGameSelecting(param, input);
  }
  // FG初始Spin
  // else if (gameState.nextState === status.FreeGameInit) {
  //   // 處理FG Init State
  //   const result = stateFGInit(param, fgInput);

  //   // 輸出值
  //   Out = result.Out;
  //   gameState = result.gameState;
  //   probMachineData = result.probMachineData;
  // }
  // FG Spin
  else if (gameState.nextState === status.FreeGame) {
    // 處理FG State
    const result = stateFG(param, fgInput);

    // 輸出值
    Out = result.Out;
    gameState = result.gameState;
    probMachineData = result.probMachineData;
  }

  // NG // FG // GameSelecting  中傳出目前押輪與押注
  Out.betUnit = reelBet;
  Out.bet = [{ name: input.bet[0].name, bet: currentBet[0] }] as IBet[];

  return {
    Out,
    gameState,
    probMachineData,
  };
}

// [機台統計資料]
// 處理Spin後機台統計資料，各遊戲的贏分包含彩金，購買遊戲的押注
function handleMachineData(
  userInput: IUserInput,
  userData: IUserData,
  machineData: IMachineData
  // gameData: IGameData;
): IMachineData {
  // test logs
  // log.info(`handleMachineData: machineData: ${JSON.stringify(machineData)}`);

  // 1. 固定寫第一個且判斷是否是今天
  // 2. 沒有就印出錯誤

  // 目前日期
  type info = { date: string; totalBet: number; totalWin: number; rtp: number };
  const today = new Date();
  const nowDate =
    today.getFullYear() + `-` + (today.getMonth() + 1) + `-` + today.getDate();

  // 機台沒資料要產生一份
  if (
    machineData.data === undefined ||
    (machineData.data !== undefined &&
      machineData.data.dailyRecords === undefined)
  ) {
    log.info(`handleMachineData: dailyRecords is wrong!! `);
    machineData = updateMachineDataByDate(machineData);
  }

  // 零點更新時需要
  if (
    machineData.data.dailyRecords.length > 0 &&
    machineData.data.dailyRecords[0].date !== nowDate
  ) {
    log.info(
      `handleMachineData: date is wrong!! nowDate: ${nowDate}, dailyRecords: ${JSON.stringify(
        machineData.data.dailyRecords
      )} `
    );

    // 更新最新的Date
    machineData = updateMachineDataByDate(machineData);
  }

  // TODO 各遊戲累積的贏分資訊
  const { state, nextState } = userData.spinResultOutput.spinResult;

  // totalWin
  let totalWin = userData.spinResultOutput.spinResult.totalWin;
  let jpTotalWin = 0;

  // 彩金記錄
  // log.info(`handleMachineData:: ${JSON.stringify(userData.spinResultOutput.spinResult)}`);
  // if (userData.spinResultOutput.spinResult.gameJpWinInfo !== undefined) {
  //   userData.spinResultOutput.spinResult.gameJpWinInfo.forEach((val) => {
  //     jpTotalWin = Utils.bigNumber(val.baseWin + jpTotalWin);
  //   });
  // }

  // FG totalWin
  if (
    (state === status.FreeGame || state === status.FGRespin) &&
    nextState === status.NormalGame
  ) {
    // 最後一局的累積分數
    totalWin = userData.spinResultOutput.spinResult.fgWinInfo.fgTotalWin;

    machineData.data.dailyRecords[0].totalWin = Utils.bigNumber(
      machineData.data.dailyRecords[0].totalWin + totalWin
    );
  } else if (
    state === status.BonusGame1 &&
    (nextState === status.NormalGame || nextState === status.FreeGame)
  ) {
    // const bgWinInfo = userData.spinResultOutput.spinResult
    //   .bgWinInfo as BgWinInfo;

    // 有jp值
    // if (bgWinInfo.jpTotalWin.length > 0)
    //   jpTotalWin = bgWinInfo.jpTotalWin.reduce((a, b) => a + b);

    // 贏分加上彩金
    totalWin = Utils.bigNumber(
      userData.spinResultOutput.spinResult.bgWinInfo.bgTotalWin + jpTotalWin
    );

    machineData.data.dailyRecords[0].totalWin = Utils.bigNumber(
      machineData.data.dailyRecords[0].totalWin + totalWin
    );
  }

  if (state === status.NormalGame || state === status.NGRespin) {
    // 當天的totalBet/totalWin/rtp
    machineData.data.dailyRecords[0].totalBet = Utils.bigNumber(
      machineData.data.dailyRecords[0].totalBet + userInput.bet[0].bet
    );
    machineData.data.dailyRecords[0].totalWin = Utils.bigNumber(
      machineData.data.dailyRecords[0].totalWin + totalWin
    );
  }

  if (machineData.data.dailyRecords[0].totalBet !== 0) {
    machineData.data.dailyRecords[0].rtp = Utils.bigNumber(
      machineData.data.dailyRecords[0].totalWin /
        machineData.data.dailyRecords[0].totalBet
    );
  }

  // 統計資料
  machineData = calMachineDataStatisticData(machineData);

  return machineData;
}

function calMachineDataStatisticData(machineData) {
  if (machineData.publicInfo !== undefined && machineData.data !== undefined) {
    // 更新最新資料
    // dailyRecords內的資料計算出傳出去的值
    let totalBetThirtyDays = 0;
    let totalWinThirtyDays = 0;
    let rtpThirtyDays = 0;

    machineData.data.dailyRecords.forEach((val) => {
      totalBetThirtyDays = Utils.bigNumber(totalBetThirtyDays + val.totalBet);
      totalWinThirtyDays = Utils.bigNumber(totalWinThirtyDays + val.totalWin);
    });

    // 1天的rtp
    // if (dailyRecords[0].totalBet !== 0) {
    //   dailyRecords[0].rtp = Utils.bigNumber(dailyRecords[0].totalWin / dailyRecords[0].totalBet);
    // }

    // 30天的rtp
    if (totalBetThirtyDays !== 0) {
      rtpThirtyDays = Utils.bigNumber(totalWinThirtyDays / totalBetThirtyDays);
    }

    // 機台資料如下OneDayStatistic/thirtyDayStatistic
    machineData.publicInfo.statisticData = {
      OneDayStatistic: {
        totalBet: Utils.bigNumber(machineData.data.dailyRecords[0].totalBet),
        rtp: Utils.bigNumber(machineData.data.dailyRecords[0].rtp * 100), // %
      },

      thirtyDayStatistic: {
        totalBet: Utils.bigNumber(totalBetThirtyDays),
        rtp: Utils.bigNumber(rtpThirtyDays * 100), // %
      },
    };
  }

  return machineData;
}

function updateMachineDataByDate(machineData: IMachineData): IMachineData {
  // log.info(`updateMachineDataByDate`);
  let probMachineData = machineData;
  const recordDay = 30;

  // 如果不存在 產生出來
  probMachineData.data = probMachineData.data || {};
  probMachineData.data.dailyRecords = probMachineData.data.dailyRecords || [];

  const currentDailyRecords = probMachineData.data.dailyRecords;

  // 提供1天/30天資料
  probMachineData.publicInfo.statisticData =
    probMachineData.publicInfo.statisticData || [];

  // 產生出30天的array
  type info = {
    date: string;
    totalBet: number;
    totalWin: number;
    rtp: number;
  };
  const today = new Date();
  const nowDate =
    today.getFullYear() + `-` + (today.getMonth() + 1) + `-` + today.getDate();

  let dailyData: info = { date: nowDate, totalBet: 0, totalWin: 0, rtp: 0 };
  let dailyRecords: info[] = [];

  // 總共30天，每天產生一個新的資料 新到舊
  for (let i = 0; i < recordDay; i++) {
    const today = new Date();
    today.setDate(today.getDate() - i); // 過去 30 天的日期

    const nowDateTemp =
      today.getFullYear() +
      `-` +
      (today.getMonth() + 1) +
      `-` +
      today.getDate();
    dailyData = { date: nowDateTemp, totalBet: 0, totalWin: 0, rtp: 0 };

    dailyRecords.push(dailyData);
  }

  // 資料內沒有今天的日期
  let firstRecordDate = "";
  if (probMachineData.data.dailyRecords.length > 0) {
    firstRecordDate = probMachineData.data.dailyRecords[0].date;
  }

  // 表示資料要更新
  if (firstRecordDate !== nowDate) {
    console.log(nowDate);
    // 從目前儲存的資料塞入dailyData
    currentDailyRecords.forEach((val) => {
      for (let i = 0; i < dailyRecords.length; i += 1) {
        if (val.date === dailyRecords[i].date) {
          dailyRecords[i].totalBet = val.totalBet;
          dailyRecords[i].totalWin = val.totalWin;
          if (val.totalBet !== 0) {
            dailyRecords[i].rtp = Utils.bigNumber(val.totalWin / val.totalBet);
          }

          break;
        }
      }
    });

    // 更新MachineData
    probMachineData.data.dailyRecords = dailyRecords;
  }

  // log.info(`updateMachineData:: ${JSON.stringify(probMachineData)}`);
  return probMachineData;
}

// Export Function
export const probSpin = {
  initialize,
  probStateDispatch,
  handleMachineData,
  updateMachineDataByDate,
  calMachineDataStatisticData,
};
