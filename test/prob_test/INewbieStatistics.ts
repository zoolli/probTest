// 新手測試

interface INewbieStatistic {
  // 統計相關
  bloodEndRound: number[];
  bloodCnt: number[];
  rtp_endNewbie: number[];
  rtp_20end: number[];
  rtp_50end: number[];
  rtp_100end: number[];
  rtp_500end: number[];
  rtp_1000end: number[];
  // rtp_1000_roundCount: number[];
  // rtp_1000_totalBet: number[];
  // rtp_1000_totalWin: number[];
}

export class NewbieStatistics implements INewbieStatistic {
  bloodEndRound = new Array().fill(0);

  bloodCnt = new Array().fill(0);

  rtp_endNewbie = new Array().fill(0);

  rtp_20end = new Array().fill(0);

  rtp_50end = new Array().fill(0);

  rtp_100end = new Array().fill(0);

  rtp_500end = new Array().fill(0);

  rtp_1000end = new Array().fill(0);

  // rtp_1000_roundCount = new Array().fill(0);
  // rtp_1000_totalBet = new Array().fill(0);
  // rtp_1000_totalWin = new Array().fill(0);
}
