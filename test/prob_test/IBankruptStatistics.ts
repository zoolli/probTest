export interface IBankruptSTAT {
  // 開洗分相關
  InCredit: number; // 開分分數

  BankruptCount: number; // 破產次數

  TotalCredit: number; // 目前可玩的分數
}

// 開洗分相關
export class BankruptSTAT implements IBankruptSTAT {
  // 開分分數
  InCredit = 0;

  // 破產次數
  BankruptCount = 0;

  // 目前可玩的分數
  TotalCredit = this.InCredit;

  // 新開分累積局數
  BankruptRoundCount = 0;

  constructor(InCredit: number) {
    this.InCredit = InCredit * 100;
    this.TotalCredit = InCredit * 100;
  }
}
