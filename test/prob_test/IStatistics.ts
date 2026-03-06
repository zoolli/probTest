import { PrizeList } from "../../src/prob/setup/prize_list";
import { Config } from "../../src/prob/setup/config";

export const payEnum: string[] = [
  "Over1000", // 0
  "500To1000",
  "300To500",
  "200To300",
  "100To200",
  "50To100", // 5
  "30To50",
  "20To30",
  "10To20",
  "5To10",
  "3To5", // 10
  "1To3",
  "Less1",
  "FG",
];

export const PrizePayRange: number[][] = [
  [1000, 100000],
  [500, 1000],
  [300, 500],
  [200, 300],
  [100, 200],
  [50, 100], // 5
  [30, 50],
  [20, 30],
  [10, 20],
  [5, 10],
  [3, 5], // 10
  [1, 3],
  [0, 1],
  [0, 0],
];

export const fgBgPayEnum: string[] = [
  "Over1000", // 0
  "500To1000",
  "300To500",
  "200To300",
  "100To200",
  "50To100", // 5
  "30To50",
  "20To30",
  "10To20",
  "5To10",
  "3To5", // 10
  "1To3",
  "Less1",
  "0",
];

export const FgBgPayRange: number[][] = [
  [1000, 100000], // 0
  [500, 10000],
  [300, 500],
  [200, 300],
  [100, 200],
  [50, 100], // 5
  [30, 50],
  [20, 30],
  [10, 20],
  [5, 10],
  [3, 5], // 10
  [1, 3],
  [0, 1], // Less1
  [0, 0],
];

interface IStatistic {
  roundBet: number;

  // 統計相關
  totalWin: number;
  totalRoundWin: number;
  totalBet: number;
  totalMonthWin: number;
  totalMonthBet: number;

  ngTotalWin: number;
  fgTotalWin: number;
  noWinRound: number;
  maxNoWinRound: number;
  overRate: number;
  over3Count: number;
  less3Count: number;

  prizeListCount: number[];

  // 贏分相關
  payEnumSize: number;
  fgBgPayEnumSize: number;
  prizeTypeCount: number[];
  prizeTypeTotalWin: number[];
  fgPayPrizeTypeCount: number[];
  fgPrizeTypeTotalWin: number[];

  hitRate: number; // 中獎機率
  winRate: number; // 贏分機率

  ngMaxWin: number; // ng 最大贏分
  fgMaxTotalWin: number; // fg 最大總贏分
  fgMinTotalWin: number; // fg 最小總贏分

  // 內部JP相關
  interalJPCount: number[];
  interalJPTotalWin: number[];

  // 特殊獎項
  fullPrizeCount: number;
  fullPrizeTotalWin: number;
  endMonth: boolean;
}

export class Statistics implements IStatistic {
  roundBet = 0;

  totalWin = 0;

  totalRoundWin = 0;

  totalBet = 0;

  totalMonthWin = 0;

  totalMonthBet = 0;

  ngTotalWin = 0;

  fgTotalWin = 0;

  noWinRound = 0;

  maxNoWinRound = 0;

  overRate = 0;

  over3Count = 0;

  less3Count = 0;

  prizeListCount = new Array(Object.keys(PrizeList).length).fill(0);

  // 贏分相關
  payEnumSize = payEnum.length;

  fgBgPayEnumSize = fgBgPayEnum.length;

  prizeTypeCount = new Array(this.payEnumSize).fill(0);

  prizeTypeTotalWin = new Array(this.payEnumSize).fill(0);

  fgPayPrizeTypeCount = new Array(this.fgBgPayEnumSize).fill(0);

  fgPrizeTypeTotalWin = new Array(this.fgBgPayEnumSize).fill(0);

  hitRate = 0; // 中獎機率

  winRate = 0; // 贏分機率

  // ng 最大贏分
  ngMaxWin = 0;

  // fg 最大總贏分
  fgMaxTotalWin = 0;

  // fg 最小總贏分
  fgMinTotalWin = 1000000;

  interalJPCount = new Array(2).fill(0); // 0: symbol.A, 1: symbol.T

  interalJPTotalWin = new Array(2).fill(0); // 0: symbol.A, 1: symbol.T

  // 特殊獎項
  fullPrizeCount = 0;

  fullPrizeTotalWin = 0;
  endMonth = false;
}
