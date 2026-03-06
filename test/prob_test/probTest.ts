import * as fs from "fs";
import {
  MachineData,
  IUserInput,
  IMachineData,
  IUserData,
  IGameData,
  ConnectionMember,
  RegulationTag,
  log,
} from "@championgameteam/ah-slot-game-server-plugin";

import { GameData } from "../../src/prob/extends/GameData";
import { SpinResult } from "../../src/prob/extends/SpinResult";

import { MainGame } from "../../src/prob/app/main_game";
import { status } from "../../src/prob/enums/status";

import { ProbMachineData } from "../../src/prob/comp/probMachineData";

// 統計相關
import {
  payEnum,
  PrizePayRange,
  fgBgPayEnum,
  FgBgPayRange,
  Statistics,
} from "./IStatistics";
import { GroupSampleInfo, GroupStatistics } from "./IGroupStatistics";
import { OpenWashCash } from "./IOpenWashCash";
import { BankruptSTAT } from "./IBankruptStatistics";
import { Config } from "../../src/prob/setup/config";
import { PrizeList } from "../../src/prob/setup/prize_list";
import * as path from "path";
import { ProbConfig } from "../../src/prob/extends/probConfig";
import { IGameStatistic } from "@championgameteam/cg-system-library";
import { IGameRegulation } from "@championgameteam/ah-slot-game-server-plugin/dist/prob/include/IGameRegulation";
import { NewbieStatistics } from "./INewbieStatistics";
// 與底層共用標準介面
const probConfig = new ProbConfig();

const testing = false;
let dbPath = "";
let recordPath = "";
let bankruptRecordPath = "";
let dirPath = "";
let newbieRecordPath = "";
let scriptName = "";
const MaxRecordNo = 100000;

let userData: IUserData; // = new UserData();
let machineData: IMachineData;

enum SectionType {
  OutputMonthResult = "OutputMonthResult",
  OutputOtherMonthResult = "OutputOtherMonthResult",
  KeyInKeyOutResult = "keyInKeyOutResult",
  Report = "Report",
  OtherReport = "OtherReport",
}
const sectionNames = Object.values(SectionType);
type SectionKey = typeof sectionNames[number];
const sections = new Map<SectionKey, string[]>(
  sectionNames.map((name) => [name, []])
);
function init() {
  // 確保該資料夾存在，若無則建立
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // fs.writeFile() 寫入檔案，如果檔案存在，會覆寫原本檔案資料；否則會自動新增檔案並寫入資料。
  fs.writeFile(recordPath, "Prob_Test: \t\n", (err) => {});
  // 樣本期望值寫檔
  for (let index = 0; index < GroupSampleInfo.length; index += 1) {
    if (GroupSampleInfo[index].clearFile) {
      fs.writeFileSync(
        path.join(dirPath, GroupSampleInfo[index].file),
        "GroupCount Expect GroupExpect GroupBet GroupWin rtpModifyCnt rtpModifyCnt_up rtpModifyCnt_low\t"
      );
    }
  }

  fs.writeFileSync(bankruptRecordPath, "Bankrupt_Test: \t\n");

  if (fs.existsSync(dbPath)) {
    const out: { userData: IUserData; machineData: IMachineData } = JSON.parse(
      fs.readFileSync(dbPath).toString()
    ); // 繼續使用紀錄
    fs.unlinkSync(dbPath); // 移除
    // fs.unlink(dbPath, err => {
    //  if (err) throw err;
    //  console.log("path/db.json was deleted");
    // });

    userData = out.userData;
    machineData = out.machineData;
  }
}

let output: { userData: IUserData; machineData: IMachineData };

// SD
let totalRoundWinSquare = 0;

// test Round
let monthCount = 0; // 累計月數
let roundIndex = 0; // 目前測試局數
const numHOURROUND = 400;
const numDAYROUND: number = numHOURROUND * 10;
const numMONTHROUND: number = numDAYROUND * 25;
let rounds: number; /* = numMONTHROUND * 10; */ // 測試局數
const convergeRate = 3; // 期望值收斂比率
let compareChance = 96; // 用來判斷期望值是否OVER
const sampleCount: number[] = new Array(GroupSampleInfo.length).fill(0);

const userInput: IUserInput = {
  bet: [{ name: "anyWay", bet: 40 }],
  // reelBet: 1,
  /* , select:? */
  // strip: [17, 15, 8, -1, -1]
};

const fgUserInput: IUserInput = {
  bet: [{ name: "anyWay", bet: 0 }],
  // reelBet: 1,
  /* , select:? */
  // strip: [17, 15, 8, -1, -1]
};

const sgUserInput: IUserInput = {
  bet: [{ name: "anyWay", bet: 0 }],
  // reelBet: 1,
  select: 0,
};

let start = 0;
let end = 0;
start = new Date().getTime();
const game = new MainGame();

let result: SpinResult = new SpinResult();
const SAS: Statistics = new Statistics();
const SAS_Group: GroupStatistics = new GroupStatistics();
const SAS_Newbie: NewbieStatistics = new NewbieStatistics(); //新手統計
let playerInOut: OpenWashCash;
let playerInBankrupt: BankruptSTAT;

// [GameData] 遊戲 Server 初始化要做的事 (介面)
const gameData: IGameData = new GameData(); // game.gameStart({ log });

function recordSlotGame(
  roundBet: number,
  ngRoundWin: number,
  fgRoundWin: number,
  bFGMode: boolean,
  rtpModify: number
): void {
  // 最大贏分統計
  if (ngRoundWin > SAS.ngMaxWin) {
    SAS.ngMaxWin = ngRoundWin;
  }

  if (bFGMode === true && fgRoundWin > SAS.fgMaxTotalWin) {
    SAS.fgMaxTotalWin = fgRoundWin;
  }

  // 最小贏分
  if (bFGMode === true && fgRoundWin < SAS.fgMinTotalWin) {
    SAS.fgMinTotalWin = fgRoundWin;
  }

  const totalRoundWin: number = ngRoundWin + fgRoundWin;
  // 統計總押分、總贏分
  SAS.totalWin += totalRoundWin;
  SAS.totalBet += roundBet;
  SAS.totalMonthWin += totalRoundWin;
  SAS.totalMonthBet += roundBet;

  for (let i = 0; i < GroupSampleInfo.length; i += 1) {
    SAS_Group.totalGroupWin[i] += totalRoundWin;
    SAS_Group.totalGroupBet[i] += roundBet;
    switch (rtpModify) {
      case 1:
        SAS_Group.RtpModifyCnt_U[i] += 1;
        SAS_Group.RtpModifyCnt[i] += 1;
        break;
      case -1:
        SAS_Group.RtpModifyCnt_L[i] += 1;
        SAS_Group.RtpModifyCnt[i] += 1;
        break;

      default:
        break;
    }
  }

  /*
  SAS_Group.totalGroupWin.forEach(function (x) {
    x += totalRoundWin;
  });
  SAS_Group.totalGroupBet.forEach(function (x) {
    x += roundBet;
  });
*/
  // ngRoundWin  fgRoundWin  rspRoundWin;

  if (ngRoundWin > 0) {
    const prizePay = ngRoundWin / roundBet;
    for (let payI = 0; payI < payEnum.length; payI += 1) {
      if (
        prizePay >= PrizePayRange[payI][0] &&
        prizePay < PrizePayRange[payI][1]
      ) {
        SAS.prizeTypeCount[payI] += 1;
        SAS.prizeTypeTotalWin[payI] += ngRoundWin;
        break;
      }
    }
  }

  if (bFGMode) {
    SAS.prizeTypeCount[payEnum.indexOf("FG")] += 1;

    if (fgRoundWin > 0) {
      const prizePay = fgRoundWin / roundBet;
      SAS.prizeTypeTotalWin[payEnum.indexOf("FG")] += fgRoundWin;

      for (let payI = 0; payI < SAS.fgBgPayEnumSize; payI += 1) {
        if (
          prizePay >= FgBgPayRange[payI][0] &&
          prizePay < FgBgPayRange[payI][1]
        ) {
          SAS.fgPayPrizeTypeCount[payI] += 1;
          SAS.fgPrizeTypeTotalWin[payI] += fgRoundWin;
          break;
        }
      }
    } else if (fgRoundWin === 0) {
      SAS.fgPayPrizeTypeCount[SAS.fgBgPayEnumSize - 1] += 1;
      SAS.fgPrizeTypeTotalWin[SAS.fgBgPayEnumSize - 1] += fgRoundWin;
    }
  }

  // 統計中獎機率/贏分機率
  if (totalRoundWin > 0) {
    SAS.hitRate += 1;

    if (totalRoundWin >= roundBet) {
      SAS.winRate += 1;
    }
  }

  // 統計最大連續未中獎次數
  if (totalRoundWin === 0) {
    SAS.noWinRound += 1; // 累計連續未中獎局數
  } else {
    if (SAS.noWinRound > SAS.maxNoWinRound) {
      SAS.maxNoWinRound = SAS.noWinRound;
    }
    SAS.noWinRound = 0;
  }
}

/*
 * 月統計數據
 *
 */
function OutputMonthResult(InMachineData: IMachineData): void {
  const probMachineData: ProbMachineData = InMachineData.data as ProbMachineData;

  monthCount += 1;

  // 計算收斂度
  if (
    (SAS.totalMonthWin / SAS.totalMonthBet) * 100.0 >
    compareChance + convergeRate
  ) {
    // 不計算連線JP
    SAS.over3Count += 1;
  }

  if (
    (SAS.totalMonthWin / SAS.totalMonthBet) * 100.0 <
    compareChance - convergeRate
  ) {
    // 不計算連線JP
    SAS.less3Count += 1;
  }

  SAS.overRate = SAS.over3Count + SAS.less3Count;

  let str = `\nMonth: ${monthCount}  `;
  str += `Expect:[ ${((SAS.totalWin * 100) / SAS.totalBet).toFixed(2)} %]  `;
  str += `MonthExpect:[ ${(
    (SAS.totalMonthWin * 100) /
    SAS.totalMonthBet
  ).toFixed(2)} %] `;
  str += `HitRate :[ ${((SAS.hitRate * 100) / roundIndex).toFixed(2)} %]   `;
  str += `WinRate :[ ${((SAS.winRate * 100) / roundIndex).toFixed(2)} %]   `;
  str += `OverRate :[ ${((SAS.overRate * 100) / monthCount).toFixed(2)} %]   `;
  str += `Over3% :[ ${SAS.over3Count} ]   `;
  str += `Less3% :[ ${SAS.less3Count} ]   `;
  str += `MaxNoWin :[ ${SAS.maxNoWinRound}]   `;

  //console.log(str);

  // 取出歷史資訊
  str += "\nmachineData: ";
  str += `${probMachineData.totalRound}||`;
  str += `${probMachineData.expect}||`;
  str += `${probMachineData.monthExpect}||`;
  str += `${probMachineData.hitRate}||`;
  str += `${probMachineData.totalWin}||`;
  str += `${probMachineData.totalBet}||`;
  console.log(str);

  // 最後一個月寫檔
  if (SAS.endMonth) {
    //fs.appendFile(recordPath, str, (err) => {});
    sections.get(SectionType.OutputMonthResult).push(str);
    // fs.appendFile(recordPath, str2, (err) => {});
  }

  // 月總押分總贏分歸0
  SAS.totalMonthWin = 0;
  SAS.totalMonthBet = 0;
}

/*
 * 月統計Other數據
 *
 */
function OutputOtherMonthResult(): void {
  let str = `\n`;
  str += `ngWin : ${SAS.ngTotalWin}, Expect : ${(
    (SAS.ngTotalWin * 100) /
    SAS.totalBet
  ).toFixed(2)} %\n`;
  str += `fgWin : ${SAS.fgTotalWin}, Expect : ${(
    (SAS.fgTotalWin * 100) /
    SAS.totalBet
  ).toFixed(2)} %\n`;
  // str += `bgWin : ${SAS.bgTotalWin}, Expect : ${(
  //   (SAS.bgTotalWin * 100) /
  //   SAS.totalBet
  // ).toFixed(2)} %`;

  str += `totalWin : ${SAS.totalWin}, `;
  str += `Expect : ${((SAS.totalWin * 100) / SAS.totalBet).toFixed(2)} %, \n`;

  // str = `fullPrizeWin : ${SAS.fullPrizeTotalWin}, `;
  // str += `Expect : ${((SAS.fullPrizeTotalWin * 100) / SAS.totalBet).toFixed(
  //   2
  // )} %, `;
  // str += ` HitRound:  ${(roundIndex / SAS.fullPrizeCount).toFixed(2)},`;
  // str += ` AvgOdds:  ${(
  //   SAS.fullPrizeTotalWin /
  //   (SAS.fullPrizeCount * SAS.roundBet)
  // ).toFixed(2)}`;
  // str += `HitRate : ${((SAS.hitRate * 100) / rounds).toFixed(2)} %, `;
  // str += ` WitRate : ${((SAS.winRate * 100) / rounds).toFixed(2)} %`;
  // console.log(str);

  str += `ngMaxWin : ${SAS.ngMaxWin}, odds: ${SAS.ngMaxWin / SAS.roundBet}, \n`;
  str += `fgMaxTotalWin : ${SAS.fgMaxTotalWin}, odds: ${
    SAS.fgMaxTotalWin / SAS.roundBet
  } \n`;
  str += `fgMinTotalWin : ${SAS.fgMinTotalWin}, odds: ${
    SAS.fgMinTotalWin / SAS.roundBet
  } \n`;
  console.log(str);

  if (SAS.endMonth) {
    //fs.appendFile(recordPath, str, (err) => {});
    sections.get(SectionType.OutputOtherMonthResult).push(str);
  }
}

/*
 * 樣本群組統計數據
 *
 */
function OutputGroupResult(InMachineData: IMachineData, roundIndex): void {
  for (let i = 0; i < GroupSampleInfo.length; i += 1) {
    if (roundIndex % GroupSampleInfo[i].sampleNo === 0) {
      sampleCount[i] += 1;

      if (sampleCount[i] <= MaxRecordNo) {
        let str = `\n${sampleCount[i]} `; // GroupCount
        str += ` ${((SAS.totalWin * 100) / SAS.totalBet).toFixed(2)}% `; // Expect
        str += ` ${(
          (SAS_Group.totalGroupWin[i] * 100) /
          SAS_Group.totalGroupBet[i]
        ).toFixed(2)}% `; // GroupExpect
        str += `${SAS_Group.totalGroupBet[i]} `; // GroupBet
        str += ` ${SAS_Group.totalGroupWin[i]}`; // GroupWin
        str += ` ${SAS_Group.RtpModifyCnt[i]}`; //
        str += ` ${SAS_Group.RtpModifyCnt_U[i]}`; //
        str += ` ${SAS_Group.RtpModifyCnt_L[i]}`; //

        // console.log(str);
        fs.appendFileSync(path.join(dirPath, GroupSampleInfo[i].file), str);

        // 歸0
        SAS_Group.totalGroupBet[i] = 0;
        SAS_Group.totalGroupWin[i] = 0;
        SAS_Group.RtpModifyCnt[i] = 0;
        SAS_Group.RtpModifyCnt_U[i] = 0;
        SAS_Group.RtpModifyCnt_L[i] = 0;
      }
    }
  }
}

/*
 * 破產紀錄資訊
 *
 */
function BankruptRecord(roundBet: number, roundWin: number): void {
  // 扣押分
  playerInBankrupt.TotalCredit -= roundBet;
  //
  playerInBankrupt.BankruptRoundCount += 1;

  // 破產重開分
  if (playerInBankrupt.TotalCredit < roundBet) {
    playerInBankrupt.BankruptCount += 1; // 破產次數
    playerInBankrupt.TotalCredit += playerInBankrupt.InCredit; // 重開分
    // 記錄
    let str2 = String(playerInBankrupt.BankruptRoundCount);
    str2 += "\t\n";
    fs.appendFileSync(bankruptRecordPath, str2);
    playerInBankrupt.BankruptRoundCount = 0; // 局數歸0
  }

  // 遊戲中獲得的分數
  playerInBankrupt.TotalCredit += roundWin;
}

/*
 * 新手群組統計數據
 *
 */
function OutputNewbieResult(numberOfNewbie: number): void {
  const para_string = `{para:${probConfig.gameRegulation.newbie.trigger.statisticRound}_${probConfig.gameRegulation.newbie.trigger.rtp.value}_${probConfig.gameRegulation.newbie.finish[0].rtp.value}_${probConfig.gameRegulation.newbie.finish[1].roundCunt.value}_${Config.extraInfo.newBitLimitedPays}} \n
playerIdx bloodCnt bloodEndRound rtp_endNewbie rtp_100 rtp_500 rtp_1000\t`;

  fs.writeFileSync(newbieRecordPath, para_string);

  for (let i = 0; i < numberOfNewbie; i += 1) {
    let str = `\n${i + 1} `; // 第幾位玩家
    str += `${SAS_Newbie.bloodCnt[i]} `;
    str += `${SAS_Newbie.bloodEndRound[i]} `;
    str += `${SAS_Newbie.rtp_endNewbie[i]} `;
    str += `${SAS_Newbie.rtp_100end[i]} `;
    str += `${SAS_Newbie.rtp_500end[i]} `;
    str += `${SAS_Newbie.rtp_1000end[i]} `;
    // str += `${SAS_Newbie.rtp_1000_roundCount[i]} `;
    // str += `${SAS_Newbie.rtp_1000_totalBet[i]} `;
    // str += `${SAS_Newbie.rtp_1000_totalWin[i]} `;

    // console.log(str);
    fs.appendFileSync(newbieRecordPath, str);
  }
}

/*
 * 開洗分紀錄資訊
 *
 */
function keyInKeyOutRecord(roundBet: number, roundWin: number): void {
  // 扣押分
  playerInOut.TotalCredit -= roundBet;

  // 開分
  if (playerInOut.TotalCredit < roundBet) {
    playerInOut.OpenCount += 1;

    playerInOut.TotalCredit += playerInOut.InCredit; // 開分分數
    playerInOut.BetweenOpen += playerInOut.InCredit; // 開分分數
  }

  // 遊戲中獲得的分數
  playerInOut.TotalCredit += roundWin;

  // 洗分
  if (playerInOut.TotalCredit >= playerInOut.OutCredit) {
    playerInOut.OutCount += 1;
    playerInOut.OutGrade += playerInOut.TotalCredit;

    const round = roundIndex - playerInOut.OutRound;
    playerInOut.OutRound = roundIndex;
    if (round > playerInOut.MaxBetweenOutRound) {
      playerInOut.MaxBetweenOutRound = round;
      playerInOut.MaxBetweenOpen = playerInOut.BetweenOpen;
      playerInOut.MaxBetweenOut = playerInOut.TotalCredit;
      playerInOut.BetweenOpen = 0;
    }

    // 分數歸0
    playerInOut.TotalCredit = 0;
  }
}

/*
 * 開洗分結果
 *
 */
function keyInKeyOutResult(): void {
  let str2 =
    "開分分數,  洗分分數, 平均洗分分數, 開分次數, 洗分次數, 最長洗分間隔, 最長洗分間隔的開分, 最長洗分間隔的洗分, 平均可洗分局數, 總押分/總開分(BI), 破產率(BR) \n\t";

  str2 += `${playerInOut.InCredit.toString()}    `;
  str2 += `${playerInOut.OutCredit.toString()}    `;
  str2 += `${(playerInOut.OutGrade / playerInOut.OutCount)
    .toFixed(2)
    .toString()}    `;
  str2 += `${playerInOut.OpenCount.toString()}    `;
  str2 += `${playerInOut.OutCount.toString()}    `;
  str2 += `${playerInOut.MaxBetweenOutRound.toString()}    `;
  str2 += `${playerInOut.MaxBetweenOpen.toString()}    `;
  str2 += `${playerInOut.MaxBetweenOut.toString()}    `;
  str2 += `${(roundIndex / playerInOut.OutCount).toFixed(2).toString()}    `;
  str2 += `${(SAS.totalBet / (playerInOut.OpenCount * playerInOut.InCredit))
    .toFixed(2)
    .toString()}    `;
  str2 += `${(
    ((playerInOut.OpenCount - playerInOut.OutCount) * 100) /
    playerInOut.OpenCount
  )
    .toFixed(2)
    .toString()} %`;

  console.log(str2);
  str2 += "\t\n\t\n";

  sections.get(SectionType.KeyInKeyOutResult).push(str2);
}

function statisticsInfo(): void {
  // Mean
  const totalMean = SAS.totalWin / roundIndex;
  // sigma is the square root of the average value of (X − μ)2
  // const sigma = Math.pow(
  //   totalRoundWinSquare / roundIndex - totalMean * totalMean,
  //   0.5
  // );
  const sigma =
    (totalRoundWinSquare / roundIndex - totalMean * totalMean) ** 0.5;

  console.log("標準差:", sigma.toFixed(2));
  console.log("標準差(/TotalBet):", (sigma / SAS.roundBet).toFixed(2));
}

// function ReportFormat() {
class ReportFormat {
  prizeType: string;

  expect: string;

  hit: string;

  roundHit: string;

  cumRoundHit: string;

  hrHit: string;

  dayHit: string;

  constructor() {
    this.prizeType = "";
    this.expect = "";
    this.hit = "";
    this.roundHit = "";
  }
}

function Report(): void {
  let str = "\nNGPayRange   prizeType  expect   hit   roundHit cumRoundHit\n";
  const resultLog = [];
  const roundHit = 0;
  let cumHit = 0;
  for (let i = 0; i < payEnum.length; i += 1) {
    const report: ReportFormat = new ReportFormat();
    report.prizeType = payEnum[i];

    report.expect = `${(
      (SAS.prizeTypeTotalWin[i] * 100) /
      SAS.totalBet
    ).toFixed(2)}%`;
    report.hit = `${SAS.prizeTypeCount[i]}`;
    report.roundHit = `${
      SAS.prizeTypeCount[i] > 0
        ? (roundIndex / SAS.prizeTypeCount[i]).toFixed(2)
        : 0
    }`;
    cumHit += SAS.prizeTypeCount[i];

    report.cumRoundHit = `${cumHit > 0 ? (roundIndex / cumHit).toFixed(2) : 0}`;
    // report.hrHit = `${(roundHit / numHOURROUND).toFixed(6)}`;
    // report.dayHit = `${(roundHit / numDAYROUND).toFixed(6)}`;
    //
    resultLog.push(report);
    str += `${report.prizeType}`;
    str += `   ${report.expect}`;
    str += `   ${report.hit}`;
    str += `   ${report.roundHit}`;
    str += `   ${report.cumRoundHit}`;
    str += "\t\n";
  }
  // console.table(resultLog);
  console.log(str);
  //fs.appendFile(recordPath, str, (err) => {});
  sections.get(SectionType.Report).push(str);

  // FG 分布
  let str2 = "\nFGPayRange    Expect    Hit \t\n";
  for (let i = 0; i < fgBgPayEnum.length; i += 1) {
    str2 += `${fgBgPayEnum[i]}    `;
    str2 += `${((SAS.fgPrizeTypeTotalWin[i] * 100) / SAS.totalBet).toFixed(
      2
    )}%    `;
    str2 += `${SAS.fgPayPrizeTypeCount[i]}    `;
    str2 += "\t\n";
  }
  console.log(str2);
  str += "\t\n";
  // fs.appendFile(recordPath, str2, (err) => {});
  sections.get(SectionType.Report).push(str2);
}

function OtherReport(): void {
  // 大牌表
  // let str = "\n========== NG 大牌表 ==========  \n";
  // str += "Index  Hit  Hit/Rounds  Rounds/Hit \n";
  // for (let i = 0; i < Object.keys(PrizeList).length; i += 1) {
  //   str += Object.keys(PrizeList)[i];
  //   str += `   ${SAS.prizeListCount[i]}`;
  //   str += `   ${((100 * SAS.prizeListCount[i]) / roundIndex).toFixed(4)}%`;
  //   str += `   ${(roundIndex / SAS.prizeListCount[i]).toFixed(0)}`;
  //   str += "\n";
  //   // str += 100*ExpectPrizeList[i]/(double)m_TotalBet "%";
  // }
  // console.log(str);
  // fs.appendFile(recordPath, str, (err) => {});
  // // interalJP統計
  // str = "";
  // str = "\n========== interalJP ==========  \n";
  // str += "Index  Hit  Hit/Rounds  Rounds/Hit   Expect\n";
  // for (let i = 0; i < 2; i += 1) {
  //   str += i;
  //   str += `   ${SAS.interalJPCount[i]}`;
  //   str += `   ${((100 * SAS.interalJPCount[i]) / roundIndex).toFixed(4)}%`;
  //   str += `   ${(roundIndex / SAS.interalJPCount[i]).toFixed(0)}`;
  //   str += `   ${((SAS.interalJPTotalWin[i] * 100) / SAS.totalBet).toFixed(
  //     2
  //   )} %`;
  //   str += "\n";
  // }
  // console.log(str);
  // fs.appendFile(recordPath, str, (err) => {});
}

/*
 * fgSpin()
 *
 */
function fgSpin(): number {
  let roundWin = 0;

  result = output.userData.spinResultOutput.spinResult as SpinResult;

  while (
    result.nextState === status.FreeGame ||
    // result.nextState === status.FreeGameInit ||
    result.nextState === status.GameSelecting
  ) {
    if (result.nextState === status.GameSelecting) {
      // 選擇局數
      output = game.spin({
        userInput: sgUserInput,
        userData: output.userData,
        machineData: output.machineData,
        gameData,
      });
    } else {
      output = game.spin({
        userInput: fgUserInput,
        userData: output.userData,
        machineData: output.machineData,
        gameData,
      });
    }

    // 新增新資料
    result = output.userData.spinResultOutput.spinResult as SpinResult;

    // FG贏分
    if (
      result.state === status.FreeGame
      // ||
      // result.state === status.FreeGameInit
    ) {
      if (result.fgWinInfo !== undefined) {
        SAS.fgTotalWin += result.fgWinInfo.roundWin;
        roundWin += result.fgWinInfo.roundWin;
      }
    }
  }

  // if (roundWin < 5000) {
  //   console.log(roundWin);
  // }

  return roundWin;
}

// 新手機率設定
function gameRegulationConfig(member: ConnectionMember): any {
  const gameRegulation = {
    memberID: member.memberID,
    tags: [RegulationTag.newbieBegin],
    statistic: {
      roundTotal: {
        statisticRound: 10000,
        roundCount: 0,
        averageBet: 0,
        averageWin: 0,
        rtp: 96,
        addRound: function ({
          totalBet,
          totalWin,
        }: {
          totalBet: number;
          totalWin: number;
        }): void {
          // throw new Error("Function not implemented.");
        },
        setGameStatistic: function (obj: IGameStatistic): void {
          // throw new Error("Function not implemented.");
        },
      },
      round20: {
        statisticRound: 20,
        roundCount: 0,
        averageBet: 0,
        averageWin: 0,
        rtp: 96,
        addRound: function ({
          totalBet,
          totalWin,
        }: {
          totalBet: number;
          totalWin: number;
        }): void {
          // throw new Error("Function not implemented.");
        },
        setGameStatistic: function (obj: IGameStatistic): void {
          // throw new Error("Function not implemented.");
        },
      },
    },
    platform: {
      tags: [],
      statistic: {
        round500: {
          statisticRound: 500,
          roundCount: 0,
          averageBet: 0,
          averageWin: 0,
          rtp: 0,
          addRound: function ({
            totalBet,
            totalWin,
          }: {
            totalBet: number;
            totalWin: number;
          }): void {
            // throw new Error("Function not implemented.");
          },
          setGameStatistic: function (obj: IGameStatistic): void {
            // throw new Error("Function not implemented.");
          },
        },
      },
    },
  };

  return gameRegulation;
}

function gameReulationProcess(
  userData: IUserData,
  ngRoundWin: number,
  fgRoundWin: number,
  bgRoundWin: number,
  bet: number
): IGameRegulation {
  const { gameRegulation, spinResultOutput } = userData;
  let totalWin = ngRoundWin + fgRoundWin + bgRoundWin;

  // 初始化
  if (
    gameRegulation.tags.includes(RegulationTag.newbieFinish) &&
    gameRegulation.tags.length === 0
  ) {
    return gameRegulation;
  }

  // 移除: RegulationTag.newbieTrigger
  const indexToRemove = gameRegulation.tags.indexOf(
    RegulationTag.newbieTrigger
  );
  if (indexToRemove !== -1) {
    // 如果找到了要移除的元素
    gameRegulation.tags = gameRegulation.tags.filter(
      (tag) => tag !== RegulationTag.newbieTrigger
    );
  }

  // round20
  const round20 = probConfig.gameRegulation.newbie.trigger.statisticRound;
  const triggerRtp = probConfig.gameRegulation.newbie.trigger.rtp.value;
  const finishRtp = probConfig.gameRegulation.newbie.finish[0].rtp.value;
  const finishRoundCnt =
    probConfig.gameRegulation.newbie.finish[1].roundCunt.value;

  gameRegulation.statistic.round20.roundCount += 1;

  let averageBet = gameRegulation.statistic.round20.averageBet;
  let averageWin = gameRegulation.statistic.round20.averageWin;
  const roundCount = gameRegulation.statistic.round20.roundCount;

  averageBet =
    Math.ceil(((averageBet * (round20 - 1) + bet) / round20) * 1000) / 1000;
  averageWin =
    Math.ceil(((averageWin * (round20 - 1) + totalWin) / round20) * 1000) /
    1000;

  const expect = Math.ceil((averageWin / averageBet) * 1000) / 1000;

  // 改變新手tags狀態
  if (gameRegulation.tags.includes(RegulationTag.newbieBegin)) {
    if (expect < triggerRtp && roundCount >= round20) {
      gameRegulation.tags.push(RegulationTag.newbieTrigger);
    } else if (
      (expect > finishRtp && roundCount >= round20 + 1) ||
      roundCount > finishRoundCnt
    ) {
      gameRegulation.tags = [RegulationTag.newbieFinish];
    }
  }

  gameRegulation.statistic.round20.averageBet = averageBet;
  gameRegulation.statistic.round20.averageWin = averageWin;

  // roundTotal
  gameRegulation.statistic.roundTotal.roundCount += 1;
  gameRegulation.statistic.roundTotal.averageBet += bet; // 借用: 存總押注
  gameRegulation.statistic.roundTotal.averageWin += totalWin; // 借用: 存總贏分

  return gameRegulation;
}

function gameReulationReport(
  r: number,
  gameRegulationOutput: IGameRegulation,
  roundsPerNewbie: number
) {
  let player_k = Math.floor(r / roundsPerNewbie); //第幾個玩家
  let player_round = r - player_k * roundsPerNewbie + 1; // 玩家的第幾局(1-base)
  let player_k_currRtp =
    gameRegulationOutput.statistic.roundTotal.averageWin /
    gameRegulationOutput.statistic.roundTotal.averageBet;

  // 初始化
  if (player_round === 1) {
    SAS_Newbie.bloodCnt[player_k] = 0;
  }

  //新手統計量: 下局補血
  if (gameRegulationOutput.tags.includes(RegulationTag.newbieTrigger)) {
    SAS_Newbie.bloodCnt[player_k] += 1;
  }

  // 這局結束新手
  if (gameRegulationOutput.tags.includes(RegulationTag.newbieFinish)) {
    SAS_Newbie.bloodEndRound[player_k] = player_round;
    SAS_Newbie.rtp_endNewbie[player_k] = player_k_currRtp;
  }

  // RTP歷程記錄
  switch (player_round) {
    case 100:
      SAS_Newbie.rtp_100end[player_k] = player_k_currRtp;
      break;
    case 500:
      SAS_Newbie.rtp_500end[player_k] = player_k_currRtp;

      break;
    case 1000:
      SAS_Newbie.rtp_1000end[player_k] = player_k_currRtp;
      // SAS_Newbie.rtp_1000_roundCount[player_k] =
      //   gameRegulationOutput.statistic.roundTotal.roundCount;
      // SAS_Newbie.rtp_1000_totalBet[player_k] =
      //   gameRegulationOutput.statistic.roundTotal.averageBet;
      // SAS_Newbie.rtp_1000_totalWin[player_k] =
      //   gameRegulationOutput.statistic.roundTotal.averageWin;
      break;

    default:
      break;
  }
}

// Test Loop /////////////////////////////////////////////////////////////
export function mainTest(
  name: string,
  testMonth = 100,
  bet = [{ name: "anyWay", bet: 80 }],
  rtp?: number,
  select?: number,
  totalWinLimit?: number,
  isNewbieEnable?: boolean,
  numberOfNewbie?: number,
  roundsPerNewbie?: number,
  controlRTPEnable?: boolean
): void {
  scriptName = name;
  dirPath = `./probTestResult${scriptName}`;
  dbPath = `${dirPath}/db.json`;
  recordPath = `${dirPath}/probrecord.txt`;
  bankruptRecordPath = `${dirPath}/bankruptRecord.txt`;
  newbieRecordPath = `${dirPath}/newbieRecord.csv`;

  init();

  if (isNewbieEnable) {
    // 列出參數
    log.info(
      `para:${probConfig.gameRegulation.newbie.trigger.statisticRound}_${probConfig.gameRegulation.newbie.trigger.rtp.value}_${probConfig.gameRegulation.newbie.finish[0].rtp.value}_${probConfig.gameRegulation.newbie.finish[1].roundCunt.value}_${Config.extraInfo.newBitLimitedPays}`
    );
  }

  // 測試局數(幾個月)
  rounds = numMONTHROUND * testMonth;

  // 押分設定
  userInput.bet = bet;

  // 開洗分設定
  playerInOut = new OpenWashCash(userInput.bet[0].bet);

  // 破產開分設定 :
  playerInBankrupt = new BankruptSTAT(userInput.bet[0].bet);

  // test by ivy
  // 測試版圖
  const testPuzzle = false;
  const kkk = 1; // 每k局forceBingo
  let doForceBingo = false; // false, true;
  const forceBingoInput = {
    bet: userInput.bet,
    // reelBet: userInput.reelBet,
    forceType: "", // Config.setting.typeForceBingo.MegaWin, // Config.setting.typeForceBingo.GameJP1,
    // debugStrip: [0, 0, 0, 0, 0], // 機率測試流程: 若要forcebingo 此處不要傳  (外部流程: 只會傳一種值進來)
    //            S1  S2  S3  S4   A   K   Q   J   T  FG JP SC Oddx Oddx Oddx....] // Oddx:指定倍數不超過500，但 501～504 代表顏色隨機產由小道大
    // debugStrip: [-1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, 14],
  };

  // TODO 轉速表  初始化
  const member: ConnectionMember = {
    connectionID: "",
    memberID: "002",
    authToken: "",
    seatID: {
      lobbyID: "0",
      machineID: "0",
      seatID: "0",
    },
    joinType: "random",
  };

  machineData = new MachineData(member.seatID);

  // 轉速表
  game.initMachineData(member.seatID, machineData);

  for (let r = 0; r < rounds; r += 1) {
    roundIndex += 1;

    let ngRoundWin = 0;
    let fgRoundWin = 0;
    let bgRoundWin = 0;
    let isFgMode = false;
    let rtpModify = 0; //0:沒校正, 1:往上校正, -1:往下校正

    // Demo
    if (output === undefined) {
      const probUserData: IUserData = game.init({
        // memberID: "010",
        member,
        userData,
        machineData,
        gameData,
      }).userData;

      output = { userData: probUserData, machineData };
    }

    if (isNewbieEnable) {
      if (r % roundsPerNewbie === 0) {
        // 新手統計初始化
        output.userData.gameRegulation = gameRegulationConfig(member);
      }
      // 若已newbieFinish，則tag不再帶值
      if (
        output.userData.gameRegulation.tags.includes(RegulationTag.newbieFinish)
      ) {
        output.userData.gameRegulation.tags = [];
      }
    }

    //
    gameData.totalWinLimit = totalWinLimit;

    // 輸入遊戲或機台機率期望值
    if (rtp !== undefined) {
      gameData.rtp = rtp;
      // output.machineData.rtp = rtp;

      // 用來判斷期望值是否OVER
      compareChance = rtp;
      // controlRTP
      gameData.controlRTP = controlRTPEnable;
    }

    // 校正RTP功能: userData.data傳入目前累積局數、rtp
    const targetRound = 10_000_000; // 目標局數
    const adjustedRoundIndex = roundIndex % targetRound; // 計算修正後的 roundIndex
    const index = GroupSampleInfo.findIndex(
      (item) => item.sampleNo === targetRound
    ); // 找到對應的 sampleNo
    const cumTotalBet = SAS_Group.totalGroupBet[index]; //SAS.totalBet;
    const cumTotalWin = SAS_Group.totalGroupWin[index]; //SAS.totalWin;
    if (adjustedRoundIndex > 1) {
      output.userData.data.liveTotalbet = cumTotalBet;
      output.userData.data.liveTotalwin = cumTotalWin;
      output.userData.data.liveRtp = Number(
        ((cumTotalWin * 100) / cumTotalBet).toFixed(6)
      );
      output.userData.data.liveCnt = adjustedRoundIndex - 1;
    }

    result = output.userData.spinResultOutput.spinResult as SpinResult;

    if (result.nextState === status.NormalGame) {
      output = game.spin({
        userInput,
        userData: output.userData,
        machineData: output.machineData,
        gameData,
      });

      rtpModify = output.userData.data.rtpModify;

      // 回傳新資料
      result = output.userData.spinResultOutput.spinResult as SpinResult;

      if (result.ngWinInfo !== undefined) {
        SAS.ngTotalWin += result.ngWinInfo.roundWin;
        ngRoundWin = result.ngWinInfo.roundWin;
      }
    }

    // 五選一
    if (result.nextState === status.GameSelecting) {
      if (select !== undefined && select >= 0 && select <= 4) {
        sgUserInput.select = select;
      } else {
        sgUserInput.select = Math.floor(Math.random() * 1000) % 5;
      }

      output = game.spin({
        userInput: sgUserInput,
        userData: output.userData,
        machineData: output.machineData,
        gameData,
      });

      // 回傳新資料
      result = output.userData.spinResultOutput.spinResult as SpinResult;
    }

    // FG Spin
    if (
      result.nextState === status.FreeGame
      // ||
      // result.nextState === status.FreeGameInit
    ) {
      // FG
      fgRoundWin = fgSpin(); // 包含FG
      isFgMode = true;
    }

    if (testing) {
      console.log(result);
    }

    // 統計資料
    SAS.roundBet = userInput.bet[0].bet;

    // 虛寶卡
    if (userInput.bet[0].award) {
      SAS.roundBet = Number(userInput.bet[0].award.awardItem.split("-")[1]);
    }

    // [BuyFeature] 分布使用正確押注不是購買的押注
    if (userInput.bet[0].name === Config.buyFeatureName.FG) {
      SAS.roundBet = userInput.bet[0].bet / Config.extraInfo.oddsBuyFeatureFG;
    } else if (userInput.bet[0].name === Config.buyFeatureName.BG) {
      SAS.roundBet = userInput.bet[0].bet / Config.extraInfo.oddsBuyFeatureBG;
    }

    recordSlotGame(SAS.roundBet, ngRoundWin, fgRoundWin, isFgMode, rtpModify);

    // 新手機制
    if (isNewbieEnable) {
      // 新手處理
      output.userData.gameRegulation = gameReulationProcess(
        output.userData,
        ngRoundWin,
        fgRoundWin,
        bgRoundWin,
        userInput.bet[0].bet
      );
      // 新手統計
      gameReulationReport(r, output.userData.gameRegulation, roundsPerNewbie);
    }

    // 開洗分紀錄
    keyInKeyOutRecord(userInput.bet[0].bet, ngRoundWin + fgRoundWin);

    // 破產紀錄
    BankruptRecord(userInput.bet[0].bet, ngRoundWin + fgRoundWin);

    // 標準差: (平方的平均 - 平均的平方)^0.5 => sigma is the square root of the variance of X
    const roundWin = ngRoundWin + fgRoundWin;
    totalRoundWinSquare += roundWin ** 2; // Math.pow(roundWin, 2);

    // 統計每組樣本結果
    OutputGroupResult(output.machineData, roundIndex);

    // 統計每月結果
    if (roundIndex % numMONTHROUND === 0) {
      // 最後一個月寫檔
      SAS.endMonth = testMonth === monthCount + 1;
      OutputMonthResult(output.machineData);
      OutputOtherMonthResult();
    }

    // 最後統計開洗分
    if (r === rounds - 1) {
      // 開洗分結果
      keyInKeyOutResult();

      // 統計資料輸出
      statisticsInfo();

      // 獎項分布
      Report();
      OtherReport();
    }
  }

  // 新手機制數值統計
  OutputNewbieResult(numberOfNewbie);
  end = new Date().getTime();
  // 計算花多久時間
  console.log(`程式時間: ${(end - start) / 1000}sec`);

  const content = sectionNames
    .map((key) => sections.get(key)?.join("\n") ?? "")
    .join("\n");
  fs.appendFile(recordPath, content, (err) => {});

  if (!testing) {
    fs.writeFile(dbPath, JSON.stringify(output), (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
}
