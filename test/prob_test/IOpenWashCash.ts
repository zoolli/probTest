export interface IOpenWashCash {
  // 開洗分相關
  InCredit: number; // 開分分數
  OutCredit: number; // 洗分分數

  OpenCount: number; // 開分次數
  OutCount: number; // 洗分次數

  OutGrade: number; // 累積洗分分數

  MaxBetweenOutRound: number; // 最長洗分間隔

  MaxBetweenOpen: number; // 最長洗分間隔的開分
  MaxBetweenOut: number; // 最長洗分間隔的洗分

  TotalCredit: number; // 目前可玩的分數
  OutRound: number; // 紀錄洗分間隔局數

  BetweenOpen: number; // 紀錄間隔累積開分
}

// 開洗分相關
export class OpenWashCash implements IOpenWashCash {
  // 開分分數
  InCredit = 100 * 1000;

  // 洗分分數
  OutCredit = this.InCredit * 2;

  // 開分次數
  OpenCount = 0;

  // 洗分次數
  OutCount = 0;

  // 累積洗分分數
  OutGrade = 0;

  // 最長洗分間隔
  MaxBetweenOutRound = 0;

  // 最長洗分間隔的開分
  MaxBetweenOpen = 0;

  // 最長洗分間隔的洗分
  MaxBetweenOut = 0;

  // 目前可玩的分數
  TotalCredit = this.InCredit;

  // 紀錄洗分間隔局數
  OutRound = 0;

  // 紀錄間隔累積開分
  BetweenOpen = 0;

  constructor(InCredit: number) {
    this.InCredit = InCredit * 100;
    this.OutCredit = this.InCredit * 2;
  }
}
