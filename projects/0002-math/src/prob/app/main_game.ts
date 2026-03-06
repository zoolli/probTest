/* eslint-disable no-param-reassign */
import {
  IProbIF,
  IUserInput,
  IUserData,
  IMachineData,
  IGameData,
  UserData,
  log,
  ConnectionMember,
  WinType,
  MachineData,
  ProbLib,
  ISpinResult,
  RegulationTag,
  // IBet,
} from "@championgameteam/ah-slot-game-server-plugin";
import { SeatInfo, BuyFeature } from "@championgameteam/cg-system-library";

import { status } from "../enums/status";
import { InitInfo } from "../extends/InitInfo";
import { GameSelectedInfo } from "../extends/IGameSelectedInfo";
import { NgWinInfo } from "../extends/NgWinInfo";
import { FgWinInfo } from "../extends/FgWinInfo";

// import { Utils } from "../utils/index";
import { Config } from "../setup/config";

import { probSpin } from "../prob/prob_spin";

import { ProbMachineData } from "../comp/probMachineData";
import { SpinResult } from "../extends/SpinResult";

import { GameState } from "../comp";
import { GameData } from "../extends/GameData";
import { Utils } from "../utils";

export class MainGame implements IProbIF {
  name: string;

  constructor() {
    this.name = "MainGame";
  }

  /**
   * 需要機台資料
   *
   */
  needMachineData(): boolean {
    return true;
  }

  // [機台統計資料] 更新machineData
  updateMachineData(machineData: IMachineData): IMachineData {
    let probMachineData = machineData;

    // prob_spin內的function
    const { updateMachineDataByDate, calMachineDataStatisticData } = probSpin;

    // 產生出30天的array
    // type info = {
    //   date: string;
    //   totalBet: number;
    //   totalWin: number;
    //   rtp: number;
    // };

    // let dailyRecords: info[] = [];

    // 更新MachineData中的Date
    probMachineData = updateMachineDataByDate(probMachineData);

    probMachineData = calMachineDataStatisticData(probMachineData);

    return probMachineData;
  }

  // 初始化 machineData
  initMachineData(seat: SeatInfo, machineData: IMachineData): IMachineData {
    let probMachineData = machineData;

    if (machineData === null || machineData === undefined) {
      // 若無，表示該座位第一次玩
      probMachineData = new MachineData(seat);
    }

    // log.info("probMachineData: " + JSON.stringify(probMachineData));

    // [轉速表]
    // 免費遊戲
    const gameFeature = [WinType.FreeGame];
    const gameInfo = { gameInfo: gameFeature };
    let { publicInfo } = probMachineData;

    if (!publicInfo) {
      probMachineData.publicInfo = {};
    }

    if (Object.keys(publicInfo).length === 0) {
      publicInfo = {
        ...publicInfo,
        ...ProbLib.publicInfoProb({
          publicInfo,
          spinResult: null,
          gameFeature,
        }),
        ...gameInfo,
      };
    }

    probMachineData.publicInfo = {
      ...publicInfo,
      ...gameInfo,
    };

    // TODO 更新機台資料
    probMachineData = this.updateMachineData(probMachineData);

    return probMachineData;
  }

  // 遊戲 Server 初始化要做的事 (介面)
  // log 介面
  gameStart(param: { gameData?: IGameData }): IGameData {
    log.info(`${this.name} gameStart()`);

    let gameData: IGameData = new GameData();
    if (param.gameData) {
      gameData = param.gameData;
    }

    return gameData;
  }

  /**
   * 取得初始欄位
   *
   * @param {Object} userData?
   */
  init(param: {
    member: ConnectionMember;
    userData: IUserData;
    machineData: IMachineData;
    gameData: IGameData;
  }): { userData: IUserData; machineData: IMachineData; gameData: IGameData } {
    const { member, userData, machineData, gameData } = param;
    let proUserData: UserData = new UserData(member);

    const { initialize } = probSpin;
    const result = initialize();
    const { Out, gameState } = result;

    if (userData) {
      proUserData = { ...userData };
      if (
        proUserData.spinResultOutput.spinResult.state === status.NormalGame &&
        proUserData.spinResultOutput.spinResult.nextState === status.NormalGame
      ) {
        // Demo
        proUserData.spinResultOutput.spinResult.reels = Out.reelSymbol;
      }
      // [防呆] 處理reels is empty
      if (
        proUserData.spinResultOutput.spinResult.reels === undefined ||
        (proUserData.spinResultOutput.spinResult.reels !== undefined &&
          proUserData.spinResultOutput.spinResult.reels.length !==
            Config.setting.row * Config.setting.column)
      ) {
        // Demo
        proUserData.spinResultOutput.spinResult.reels = Out.reelSymbol;
      }

      // [BuyFeature] 新增變數資料，原本資料也要update
      const initInfo = new InitInfo();
      const initInfoTemp = {
        ...initInfo,
        ...proUserData.spinResultOutput.spinResult.initInfo,
      };

      initInfoTemp.oddsBuyFeatureFG = initInfo.oddsBuyFeatureFG;
      initInfoTemp.probId = initInfo.probId;

      proUserData.spinResultOutput.spinResult.initInfo = initInfoTemp;
    } else {
      // 初始化資料 ex: payTable, betList, ngStrip
      proUserData.spinResultOutput.spinResult.initInfo = new InitInfo();

      // 押注區
      // 初始化
      proUserData.spinResultOutput.spinResult.bet = [];
      for (let i = 0; i < Config.payName.length; i += 1) {
        const name = Config.payName[i];
        const bet = 0;
        proUserData.spinResultOutput.spinResult.bet.push({ name, bet });
      }
      // [proUserData.spinResultOutput.spinResult.bet] = Config.setting.betList;

      proUserData.spinResultOutput.spinResult.reelBet = Config.setting.reelBet;

      proUserData.spinResultOutput.spinResult.state = gameState.state;
      proUserData.spinResultOutput.spinResult.nextState = gameState.nextState;

      proUserData.spinResultOutput.spinResult.reels = Out.reelSymbol;

      // winInfo
      proUserData.spinResultOutput.spinResult.ngWinInfo = new NgWinInfo();
      proUserData.spinResultOutput.spinResult.ngWinInfo.roundWin = Out.roundWin;
      if (Out.roundWin > 0) {
        proUserData.spinResultOutput.spinResult.ngWinInfo.winInfo = Out.winInfo;
      }

      // winPay
      if (gameState.bet[0] !== 0 && gameState.betUnit !== 0) {
        proUserData.spinResultOutput.spinResult.ngWinInfo.winPay = Number(
          (Out.roundWin / (gameState.bet[0] * gameState.betUnit)).toFixed(10)
        );
      }

      // gameState
      const obj = { ...gameState };
      proUserData.data = obj;
    }

    // 歷史紀錄
    // if (machineData !== undefined && machineData.data !== undefined) {
    //   proUserData.spinResultOutput.spinResult.initInfo.resultHistory =
    //     machineData.resultHistory;
    // }

    // 後臺設定資訊給初始化使用
    // totalWinLimit and RTP 不出現initInfo
    if (gameData) {
      // 押注上限
      if (gameData.betLimit) {
        proUserData.spinResultOutput.spinResult.initInfo.betLimit =
          gameData.betLimit;
      }

      if (gameData.betList) {
        const Temp: number[] = [];
        const { betLimit } = proUserData.spinResultOutput.spinResult.initInfo;

        gameData.betList.forEach(function (item) {
          if (item <= betLimit)
            Temp.push(Number((item / Config.setting.reelBet).toFixed(10)));
        });

        // TODO 轉換(除以reelBet後傳出去)
        proUserData.spinResultOutput.spinResult.initInfo.betList = Temp;
      }

      // 最大總押分(多押注遊戲)
      if (gameData.maxBet) {
        proUserData.spinResultOutput.spinResult.initInfo.maxBet =
          gameData.maxBet;
      }

      // 最大單注押分(多押注遊戲)
      if (gameData.maxSingleBet) {
        proUserData.spinResultOutput.spinResult.initInfo.maxSingleBet =
          gameData.maxSingleBet;
      }
      // [BuyFeature] 開關購買遊戲功能
      if (gameData.isOpenBuyFeature !== undefined) {
        // log.info("gameData:" + JSON.stringify(gameData));
        proUserData.spinResultOutput.spinResult.initInfo.isOpenBuyFeature =
          gameData.isOpenBuyFeature;
      }
      // [BuyFeature] Bet Max 設定要乘過
      if (gameData.buyFeatureBetMax !== undefined) {
        proUserData.spinResultOutput.spinResult.initInfo.buyFeatureBetMax =
          gameData.buyFeatureBetMax;
      }
    }

    // 預設的betIndex
    const { betList, betIndex } = proUserData.spinResultOutput.spinResult
      .initInfo as InitInfo;

    if (betList[betIndex] === undefined) {
      const initInfo = proUserData.spinResultOutput.spinResult
        .initInfo as InitInfo;
      // 設成Default值
      initInfo.betIndex = 0;
      proUserData.spinResultOutput.spinResult.initInfo = initInfo;
    }

    // machineData
    if (machineData) {
      // [記錄玩家]
      if (machineData.data === undefined) {
        let probMachineData: ProbMachineData = new ProbMachineData();
        machineData.data = probMachineData;
      }

      machineData.data.memberID = member.memberID;

      // 機台的 BetList, 由 LobbyConfig 設定
      if (machineData.betList !== undefined) {
        proUserData.spinResultOutput.spinResult.initInfo.betList = machineData.betList.slice();
      }
    }

    // [轉速表]
    // 免費遊戲
    const gameFeature = [WinType.FreeGame];
    const gameInfo = { gameInfo: gameFeature };
    machineData.publicInfo = machineData.publicInfo || {};
    const publicInfo = machineData.publicInfo || {};

    machineData.publicInfo = {
      ...publicInfo,
      ...gameInfo,
    };

    return { userData: proUserData, machineData, gameData };
  }

  /**
   * 單局押注結果
   *
   * @param {Object} userInput 玩家輸入資訊 & 設定資訊
   * @param {Object} userData 玩家統計資訊
   * @param {Object} machineData 機台統計資訊
   * @param {Object} gameData 遊戲資訊
   *
   */
  // spin 介面
  spin(param: {
    userInput: IUserInput;
    userData: IUserData;
    machineData: IMachineData;
    gameData: IGameData;
  }): { userData: IUserData; machineData: IMachineData; gameData: IGameData } {
    const { userInput, userData, machineData, gameData } = param;

    // [新手機率]
    let userDataTags: RegulationTag[] = [];
    if (userData.gameRegulation !== undefined) {
      // log.info(
      //   `spin:: gameRegulation: ${JSON.stringify(userData.gameRegulation)}`
      // );
      userDataTags = userData.gameRegulation.tags;
    }

    // ForceBingo logs
    if (userData.forceBingoInput) {
      log.info(`${this.name}, the gameData: ${JSON.stringify(gameData)}`);
      log.info(
        `${this.name}, the forceBingInput: ${JSON.stringify(
          userData.forceBingoInput
        )}`
      );
    }

    // New SpinResult
    const newSpinResult = new SpinResult();

    // 初始機率設定資料
    if (newSpinResult.initInfo === undefined) {
      // 初始化資料 ex: payTable, betList, ngStrip
      newSpinResult.initInfo = new InitInfo();
    }

    // 使用玩家預設資料
    if (userData.spinResultOutput.spinResult.initInfo) {
      newSpinResult.initInfo = userData.spinResultOutput.spinResult
        .initInfo as InitInfo;
    }

    // 原來資料
    if (userData.data === undefined) {
      throw new Error("spin:():: userData.data === undefined!!!");
    }
    const gameState: GameState = userData.data as GameState;

    // [新手機率]
    if (gameData.controlNewbie) {
      // 傳入
      gameState.controlNewbie = gameData.controlNewbie;
    }

    // [機率調控]
    // 傳入
    gameState.controlRTP = gameData.controlRTP;
    if (gameData.controlRTP) {
      if (userData.rtpRegulation !== undefined) {
        log.info(
          `spin:: rtpRegulation: ${JSON.stringify(userData.rtpRegulation)}`
        );
        gameState.liveCnt = userData.rtpRegulation.rounds;
        gameState.liveRtp = userData.rtpRegulation.rtp;
      }
    }

    let probMachineData: ProbMachineData = new ProbMachineData();
    const { probStateDispatch, handleMachineData } = probSpin;

    // if (machineData.data !== undefined) {
    //   probMachineData = machineData.data as ProbMachineData;
    // }

    if (machineData.data !== undefined) {
      let obj = {
        ...probMachineData,
        ...(machineData.data as ProbMachineData),
      };
      probMachineData = obj;
      // probMachineData = machineData.data as ProbMachineData;
    }

    // 目前的機率輸入設定(使用者機率 > 機台機率 > 遊戲機率)
    // 設定機台機率或是遊戲機率
    let { rtp } = Config.setting;

    // 設定遊戲機率
    if (gameData && gameData.rtp !== undefined) {
      rtp = gameData.rtp;
    }

    // 設定機台機率
    if (machineData && machineData.rtp !== undefined) {
      rtp = machineData.rtp;
    }

    // 設定使用者機率
    if (userData && userData.rtp !== undefined) {
      rtp = userData.rtp !== undefined ? userData.rtp : rtp;
    }

    // const gameBet: IBet[] = userInput.bet;
    // const gameReelBet: number = userInput.reelBet;
    let forceBingoType = "";

    // DebugStrip[]
    let probStrip: number[] = new Array(Config.setting.column).fill(-1);

    // [送獎] foceBingoInput
    if (userData.forceBingoInput !== undefined) {
      // log.notice(
      //   `${this.name} spin() forceBingoInput=${JSON.stringify(
      //     userData.forceBingoInput
      //   )}`
      // );

      // [指定轉輪帶] DebugStrip[]
      if (userData.forceBingoInput.debugStrip !== undefined) {
        probStrip = userData.forceBingoInput.debugStrip;
      } else {
        const { forceType } = userData.forceBingoInput;
        forceBingoType = forceType;
      }
    }

    // 虛寶卡
    // awardItem:"CardFG-10"
    let forceBingoCardInfo: string[] = [];
    let forceBingoCardBet: number = 0;
    if (
      userInput.bet[0].award !== undefined &&
      userInput.bet[0].award.awardItem
    ) {
      forceBingoCardInfo = userInput.bet[0].award.awardItem.split("-");

      // 送獎流程
      forceBingoType = forceBingoCardInfo[0];
      forceBingoCardBet = Number(forceBingoCardInfo[1]);

      // log.info(
      //   ` spin:():: forceBingoCard info awardItem: ${JSON.stringify(
      //     userInput.bet[0].award.awardItem
      //   )}`
      // );
    }

    // 檢查bet是否合理=> 目前已全遊戲設定為主
    // const { betList } = newSpinResult.initInfo;
    let { betList } = gameData;
    if (!betList) {
      betList = newSpinResult.initInfo.betList.slice();
    }

    // [BuyFeature] 買免費遊戲
    let buyFeatureBet: number = 0;
    let strBuyFeature = "";
    if (userInput.bet[0].name === Config.buyFeatureName.FG) {
      strBuyFeature = userInput.bet[0].name;
      buyFeatureBet = Utils.bigNumber(
        userInput.bet[0].bet / newSpinResult.initInfo.oddsBuyFeatureFG
      );
    }

    if (gameState.nextState === status.NormalGame) {
      // [BuyFeature] 買免費遊戲
      if (buyFeatureBet > 0) {
        if (Object.values(betList).indexOf(buyFeatureBet) === -1) {
          log.emerg(
            `spin:():: BuyFeatureBet is not on Range!!! ${JSON.stringify(
              userInput.bet[0]
            )}`
          );
          throw new Error(
            `spin:():: BuyFeatureBet is not on Range!!! ${JSON.stringify(
              userInput.bet[0]
            )}`
          );
        }
      }
      // betList from spinResult.initInfo
      // 虛寶卡
      // 假如有虛寶卡要判斷是否符合
      else if (forceBingoCardBet !== 0) {
        // 是否gameData的betList設定
        if (Object.values(gameData.betList).indexOf(forceBingoCardBet) === -1) {
          log.emerg(
            `spin:():: forceBingoCardBet is not on Range!!! ${JSON.stringify(
              userInput.bet[0]
            )}`
          );
          throw new Error(
            `spin:():: forceBingoCardBet is not on Range!!! ${JSON.stringify(
              userInput.bet[0]
            )}`
          );
        }
      } else if (Object.values(betList).indexOf(userInput.bet[0].bet) === -1) {
        log.emerg(
          `spin:():: userInput.bet[0].bet is not on Range!!! ${JSON.stringify(
            userInput.bet[0].bet
          )}`
        );
        throw new Error(
          `spin:():: userInput.bet[0].bet is not on Range!!! ${JSON.stringify(
            userInput.bet[0].bet
          )}`
        );
      }
    }
    // 其他狀態 bet = 0
    else if (userInput.bet[0].bet !== 0) {
      log.emerg(
        `spin:():: userInput.bet[0].bet should be null!!! bet: ${JSON.stringify(
          userInput.bet[0].bet
        )}, nextState: ${gameState.nextState}.`
      );
      // throw new Error(
      //   `spin:():: userInput.bet[0].bet should be null!!! bet: (${JSON.stringify(
      //     userInput.bet[0].bet
      //   )}), nextState: ${gameState.nextState}.`
      // );
    }

    // 機率內部資訊
    const input: any = {
      rtp,
      bet: userInput.bet,
      betUnit: Config.setting.reelBet,
      select: userInput.select === undefined ? 0 : userInput.select,
      forceBingo: forceBingoType,
      strip: probStrip,
      forceBingoCardInfo, // 虛寶卡
      strBuyFeature, // [BuyFeature] 買免費遊戲
      userDataTags, // [新手機率]
    };

    const result = probStateDispatch(
      { gameState, probMachineData, gameData },
      input
    );

    // Ng & Fg
    // const ngWinInfo = new NgWinInfo();
    // const fgWinInfo = new FgWinInfo();
    if (userData.spinResultOutput.spinResult.ngWinInfo !== undefined) {
      newSpinResult.ngWinInfo = userData.spinResultOutput.spinResult.ngWinInfo;
    } else {
      newSpinResult.ngWinInfo = new NgWinInfo();
    }

    if (userData.spinResultOutput.spinResult.fgWinInfo !== undefined) {
      newSpinResult.fgWinInfo = userData.spinResultOutput.spinResult
        .fgWinInfo as FgWinInfo;
    } else {
      newSpinResult.fgWinInfo = new FgWinInfo();
    }
    const { Out } = result;

    const output = {
      userData,
      machineData,
      gameData,
    };

    // 清除foceBingoInput
    if (userData.forceBingoInput !== undefined) {
      userData.forceBingoInput = undefined;
    }

    // 送獎結果
    if (Out.isForceBingo !== undefined) {
      newSpinResult.isForceBingo = Out.isForceBingo;
    }

    // [BuyFeature]結果 for 大獎報獎使用
    if (Out.isBuyFeature !== undefined) {
      if (Out.isBuyFeature) {
        const buyFeature: BuyFeature = {
          type: "FG",
          odds: Config.extraInfo.oddsBuyFeatureFG,
          bet: buyFeatureBet,
        };

        if (strBuyFeature === Config.buyFeatureName.BG) {
          buyFeature.type = "BG";
          buyFeature.odds = Config.extraInfo.oddsBuyFeatureBG;
        }

        newSpinResult.buyFeature = buyFeature;
      }

      // newSpinResult.isBuyFeature = Out.isBuyFeature;
    }

    // controlRTP有設定才傳出rtp上下修結果rtp上下修結果
    if (gameData.controlRTP === true && Out.rtpModify !== undefined) {
      newSpinResult.rtpModifyMode = Out.rtpModify;
    }

    // Common
    newSpinResult.state = result.gameState.state;
    newSpinResult.nextState = result.gameState.nextState;
    newSpinResult.prizeListCount = Out.prizeList;

    // NG/FG結果的轉輪盤面
    if (
      newSpinResult.state === status.NormalGame ||
      newSpinResult.state === status.FreeGame
      // ||
      // newSpinResult.state === status.FreeGameInit
    ) {
      newSpinResult.reels = Out.reelSymbol;
    }

    if (Out.bet !== undefined) {
      newSpinResult.bet = Out.bet;
    }

    if (Out.betUnit !== undefined) {
      newSpinResult.reelBet = Out.betUnit;
    }

    // [押分相關] 記錄前一局NG押分
    if (
      newSpinResult.state === status.NormalGame &&
      newSpinResult.initInfo !== undefined
    ) {
      newSpinResult.initInfo.bet = input.bet;

      // 儲存default betIndex
      const idx = Object.values(betList).indexOf(userInput.bet[0].bet);
      newSpinResult.initInfo.betIndex = idx === -1 ? 0 : idx;
    }

    // [GameSelecting]
    if (result.gameState.nextState === status.GameSelecting) {
      newSpinResult.gameSelectingInfo = new GameSelectedInfo();

      // [FG選擇] 局數
      newSpinResult.gameSelectingInfo.selectFgRounds = Out.selectFgRounds;

      // [FG選擇] WD項目
      newSpinResult.gameSelectingInfo.selectWinMultiple = Out.selectWinMultiple;
    }

    // [FG初始資訊] 開始畫面
    // if (result.gameState.nextState === status.FreeGameInit) {
    if (
      result.gameState.nextState === status.FreeGame &&
      result.gameState.fgTotalRound === result.gameState.fgRemainingRounds
    ) {
      // FG Init
      newSpinResult.reels = Out.fgReels;

      // FgWinInfo 初始化
      newSpinResult.fgWinInfo = new FgWinInfo();

      // 目前總局數
      newSpinResult.fgWinInfo.fgRounds = Out.fgTotalRound;
      newSpinResult.fgWinInfo.fgTotalRound = Out.fgTotalRound;

      newSpinResult.fgWinInfo.fgReels = Out.fgReels;
      newSpinResult.fgWinInfo.fgStrip = Out.fgStrip;
      // 目前真實押注值
      newSpinResult.fgWinInfo.bet = Out.bet;
      newSpinResult.fgWinInfo.betUnit = Out.betUnit;
      newSpinResult.fgWinInfo.fgMode = Out.fgMode;
      newSpinResult.fgWinInfo.fgRemainingTimes = Out.fgRemainingTimes;
    }
    // fgWinInfo的資料要留存 但有些資料需要初始化
    else if (userData.spinResultOutput.spinResult.fgWinInfo !== undefined) {
      newSpinResult.fgWinInfo = userData.spinResultOutput.spinResult
        .fgWinInfo as FgWinInfo;

      // 初始化
      // newSpinResult.fgWinInfo.fgTotalWin = 0;
      newSpinResult.fgWinInfo.fgRemainingTimes = 0;
      newSpinResult.fgWinInfo.redPacketMultiple = 0;
      newSpinResult.fgWinInfo.winMultiple = 1;
      newSpinResult.fgWinInfo.hitFg = false;
      newSpinResult.fgWinInfo.winPay = 0;
    }

    // 贏分細節
    if (Out.roundWin >= 0) {
      let winPay = 0;
      if (result.gameState.bet[0] !== 0 && result.gameState.betUnit !== 0) {
        winPay = Number(
          (
            Out.roundWin /
            (result.gameState.bet[0] * result.gameState.betUnit)
          ).toFixed(10)
        );
      }

      // 中獎 symbol 資訊，ex. [{symbol: 2, win: 320, position: [1, 3, 6, 7]}, ...]
      if (newSpinResult.state === status.NormalGame) {
        newSpinResult.ngWinInfo.roundWin = Out.roundWin;
        if (Out.winInfo !== undefined) {
          newSpinResult.ngWinInfo.winInfo = Out.winInfo;
        }
        // NG winPay
        newSpinResult.ngWinInfo.winPay = winPay;
      } else if (
        newSpinResult.state === status.FreeGame
        // ||
        // newSpinResult.state === status.FreeGameInit
      ) {
        // 一般贏分
        newSpinResult.fgWinInfo.generalWin = Out.generalWin;
        // 全部贏分
        newSpinResult.fgWinInfo.roundWin = Out.roundWin;
        if (Out.winInfo !== undefined) {
          newSpinResult.fgWinInfo.winInfo = Out.winInfo;
        }
        // FG winPay
        newSpinResult.fgWinInfo.winPay = winPay;
      }
    }

    // Fg 剩餘局數
    if (
      newSpinResult.state === status.FreeGame &&
      // ||
      // newSpinResult.state === status.FreeGameInit
      Out.fgRounds >= 0
    ) {
      newSpinResult.fgWinInfo.fgRounds = Out.fgRounds;
      gameState.fgRoundIndex += 1;
      newSpinResult.fgWinInfo.fgRoundIndex = gameState.fgRoundIndex;
    }

    // FreeInit / FreeGame
    if (
      newSpinResult.state === status.FreeGame
      // || newSpinResult.state === status.FreeGameInit
    ) {
      // Fg 總贏分
      newSpinResult.fgWinInfo.fgTotalWin = Out.fgTotalWin;

      // fg 總贏分的倍數
      if (result.gameState.bet[0] !== 0 && result.gameState.betUnit !== 0) {
        newSpinResult.fgWinInfo.fgTotalWinPay =
          Out.fgTotalWin / (result.gameState.bet[0] * result.gameState.betUnit);
      }

      // Fg 剩餘遊玩次數
      newSpinResult.fgWinInfo.fgRemainingTimes = Out.fgTotalTimes;

      // Fg 中 fg
      newSpinResult.fgWinInfo.hitFg = Out.hitFg;

      // Fg 紅包倍數
      newSpinResult.fgWinInfo.redPacketMultiple = Out.RPDoublePrize;

      // Fg 紅包贏分
      newSpinResult.fgWinInfo.redPacketWin = Out.RPWin;

      // Fg WD倍數
      if (Out.isWDDouble) {
        newSpinResult.fgWinInfo.winMultiple = Out.lineWDMulti;
      }

      // FG 初次選擇的Mode
      newSpinResult.fgWinInfo.fgMode = Out.fgMode;
    }

    // 塞入gameState / probMachineData
    const obj = { ...gameState };
    output.userData.data = obj;

    const obj2 = { ...result.probMachineData };
    machineData.data = obj2;

    // [GameServer使用]
    if (result.gameState.state === status.NormalGame) {
      // [局數相關] Spin NG 局數要加1
      machineData.roundCount += 1;
    }

    if (
      result.gameState.state === status.NormalGame ||
      result.gameState.state === status.FreeGame
    ) {
      newSpinResult.playback.result = {
        reels: Out.reelSymbol, // newSpinResult.reels,
        winInfo: Out.winInfo,
      };

      // 中倍數獎
      // if (Out.isWDDouble) {
      //   newSpinResult.playback.result.mutiplier = Out.lineWDMulti;
      // }
    }

    // [playback調閱室] 額外資訊
    if (result.gameState.state === status.NormalGame) {
      // 虛寶卡 額外紀錄
      if (forceBingoCardInfo.length > 0) {
        newSpinResult.playback.playbackGameInfo = {
          awardItem: [forceBingoCardInfo[0], forceBingoCardInfo[1]],
        };
      }

      // [BuyFeature] 買特色遊戲 額外紀錄
      if (result.Out.isBuyFeature) {
        let payOdds = Config.extraInfo.oddsBuyFeatureFG;

        // if (strBuyFeature === Config.buyFeatureName.BG) {
        //   payOdds = Config.extraInfo.oddsBuyFeatureBG;
        // }

        newSpinResult.playback.playbackGameInfo.buyFeature = JSON.stringify({
          bet: userInput.bet[0].bet,
          odds: payOdds,
        });
      }
    } else if (result.gameState.state === status.FreeGame) {
      let gameSelecting = {
        select: gameState.fgMode,
        round: gameState.fgTotalRound,
        mutiplier: JSON.stringify(Config.WDMulti[gameState.fgMode]), // 選擇的倍數模式 回傳字串
        // wild: gameState.fgWdFrame,
      };

      let gameInfoObj = {
        gameSelecting,
        currentWin: gameState.currentWin, // 目前盤面贏分
        accTotalWin: gameState.fgTotalWin, // 累積贏分
        remainingRounds: gameState.fgRemainingRounds,
        // mutiplier: Out.lineWDMulti, // 盤面乘倍
      };

      // WD倍數
      if (Out.isWDDouble) {
        gameInfoObj = Object.assign(gameInfoObj, { WDMulti: Out.lineWDMulti });
      }

      // 紅包倍數
      if (Out.RPDoublePrize > 0) {
        gameInfoObj = Object.assign(gameInfoObj, {
          RPMulti: Out.RPDoublePrize,
        });
      }

      // 中FG加局次數
      if (gameState.fgTotalTimes > 0) {
        gameInfoObj = Object.assign(gameInfoObj, {
          addFgRounds: gameState.fgTotalTimes,
          // nextRounds
        });
      }

      newSpinResult.playback.playbackGameInfo = gameInfoObj;
    }

    // [GameServer][點數相關] NG/FG/BG 此局贏分
    newSpinResult.totalWin = Out.roundWin;

    // [任務系統] NG/FG任務
    // if (
    //   newSpinResult.state === status.NormalGame ||
    //   newSpinResult.state === status.FreeGame
    // ) {
    //   newSpinResult.missionList = Out.missionList;
    // }

    // [Final] copy 一份
    output.userData.spinResultOutput.spinResult = { ...newSpinResult };

    // 回 ng
    if (newSpinResult.nextState === status.NormalGame) {
      newSpinResult.ngReels = Out.ngReels;
      gameState.fgRoundIndex = 0;

      // 虛寶卡
      result.probMachineData.isForceBingoCard = false;

      // [BuyFeature]
      result.probMachineData.isBuyFeature = false;

      // 初始化
      gameState.fgTotalWin = 0;
    }

    // [轉速表]
    // 免費遊戲
    const gameFeature = [WinType.FreeGame];
    const gameInfo = { gameInfo: gameFeature };
    const publicInfo = output.machineData.publicInfo;
    output.machineData.publicInfo = {
      ...publicInfo,
      ...ProbLib.publicInfoProb({
        publicInfo,
        spinResult: newSpinResult,
        gameFeature,
      }),
      ...gameInfo,
    };

    // [機台統計資料] 更新totalWin and totalBet
    output.machineData = handleMachineData(
      userInput,
      output.userData,
      output.machineData
    );

    return output;
  }

  // 強制結算
  settle(param: {
    userData: IUserData;
    machineData: IMachineData;
    gameData: IGameData;
  }): { userData: IUserData; machineData: IMachineData; gameData: IGameData } {
    const { gameData } = param;
    let { userData, machineData } = param;
    const { spinResult } = userData.spinResultOutput;
    let offTotalWin = 0;
    // [playback]回傳全部資訊
    let settleResult: ISpinResult[] = [];

    // 強制結算
    if (
      spinResult.state !== status.NormalGame ||
      spinResult.nextState !== status.NormalGame
    ) {
      let userInput: IUserInput = {
        bet: spinResult.bet,
        // reelBet: 1,
      };

      if (
        spinResult.nextState === status.GameSelecting ||
        spinResult.nextState === status.FreeGame
      ) {
        userInput = {
          bet: [{ name: "anyWays", bet: 0 }],
          // reelBet: 1,
          select: 0,
        };
      }

      let loop = 0;
      while (
        userData.spinResultOutput.spinResult.nextState !== status.NormalGame
      ) {
        const result = this.spin({
          userInput,
          userData,
          machineData,
          gameData,
        });
        // 更新
        userData = result.userData;
        machineData = result.machineData;

        // [playback]回傳全部資訊
        settleResult.push(userData.spinResultOutput.spinResult);

        // if (
        //   result.userData.spinResultOutput.spinResult.fgWinInfo !== undefined
        // ) {
        //   offTotalWin +=
        //     result.userData.spinResultOutput.spinResult.fgWinInfo.roundWin;
        // }

        loop += 1;
        if (loop > 5000) {
          offTotalWin = 0;
          log.error(
            `settle() over 5000 times. userData: ${JSON.stringify(userData)}`
          );
          break;
        }
      }

      // 全部紀錄
      if (userData.settleResult === undefined) {
        userData.settleResult = {
          spinResults: [],
        };
      }

      // [playback]回傳全部資訊
      userData.settleResult.spinResults = settleResult;
    }

    // 剩下局數的總贏分
    // userData.spinResultOutput.spinResult.totalWin = offTotalWin;

    return {
      userData,
      machineData,
      gameData,
    };
  }
}
