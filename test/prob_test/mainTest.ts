import { Config } from "../../src/prob/setup/config";
import { mainTest } from "./probTest";
import { workerData } from "worker_threads";
import { merge } from "./summaryMerge";

const roundMonth = 1;
const inputBet = [
  { name: "anyWay", bet: 5 },
  // { name: "anyWay", bet: 0, award: { awardItem: "CardFG-10" } }, // 虛寶卡
  // { name: "anyWay", bet: 0, award: { awardItem: "CardFG-100" } }, // 虛寶卡: "CardBG1-100", "CardFG-100"
  //{ name: "BuyFeatureFG", bet: Config.extraInfo.oddsBuyFeatureFG * 100 }, // buyFeature: 買免費卡
];
const rtp = 98.5;
const select = 4;
const totalWinLimit = 100 * 100000;
const controlRTPEnable = false; // 是否開啟機率調控功能

// 新手測試
const isNewbieEnable = true;
const numberOfNewbie = 100; // 玩家數
const roundsPerNewbie = 1000; // 每個玩家遊玩的局數

// mainTest(roundMonth, inputBet, rtp, select);
export function main() {
  const name = workerData ? workerData.name : "";
  console.log(`Worker ${name}: running`);

  mainTest(
    name,
    roundMonth,
    inputBet,
    rtp,
    select,
    totalWinLimit,
    isNewbieEnable, // 是否開啟新手機制
    numberOfNewbie, // 新手玩家個數
    roundsPerNewbie, // 每位新手局數
    controlRTPEnable
  );

  merge(name);

  console.log(`Worker ${name}: end`);
}
if (!workerData) main();
