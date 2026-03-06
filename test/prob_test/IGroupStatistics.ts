export const GroupSampleInfo = [
  { sampleNo: 1, file: "Sample1_RTP.csv", clearFile: true },
  { sampleNo: 10, file: "Sample10_RTP.csv", clearFile: true },
  { sampleNo: 20, file: "Sample20_RTP.csv", clearFile: true },
  { sampleNo: 30, file: "Sample30_RTP.csv", clearFile: true },
  { sampleNo: 50, file: "Sample50_RTP.csv", clearFile: true },
  { sampleNo: 100, file: "Sample100_RTP.csv", clearFile: true },
  { sampleNo: 200, file: "Sample200_RTP.csv", clearFile: true },
  { sampleNo: 300, file: "Sample300_RTP.csv", clearFile: true },
  { sampleNo: 500, file: "Sample500_RTP.csv", clearFile: true },
  { sampleNo: 800, file: "Sample800_RTP.csv", clearFile: true },
  { sampleNo: 1000, file: "Sample1000_RTP.csv", clearFile: true },
  { sampleNo: 3000, file: "Sample3000_RTP.csv", clearFile: true },
  { sampleNo: 5000, file: "Sample5000_RTP.csv", clearFile: true },
  { sampleNo: 8000, file: "Sample8000_RTP.csv", clearFile: true },
  { sampleNo: 10000, file: "_Sample1w_RTP.csv", clearFile: true },
  { sampleNo: 50000, file: "_Sample5w_RTP.csv", clearFile: true },
  { sampleNo: 100000, file: "_Sample10w_RTP.csv", clearFile: true },
  { sampleNo: 500000, file: "_Sample50w_RTP.csv", clearFile: true },
  { sampleNo: 1000000, file: "_Sample100w_RTP.csv", clearFile: true },
  { sampleNo: 3000000, file: "_Sample300w_RTP.csv", clearFile: true },
  { sampleNo: 5000000, file: "_Sample500w_RTP.csv", clearFile: true },
  { sampleNo: 8000000, file: "_Sample800w_RTP.csv", clearFile: true },
  { sampleNo: 10000000, file: "_Sample1000w_RTP.csv", clearFile: true },
];

interface IGroupStatistic {
  // 統計相關
  totalGroupBet: number[];
  totalGroupWin: number[];
  totalGroupRound: number[];
  RtpModifyCnt: number[]; //Rtp校正次數
  RtpModifyCnt_U: number[]; // 往上校正
  RtpModifyCnt_L: number[]; // 往下校正
}

export class GroupStatistics implements IGroupStatistic {
  totalGroupBet = new Array(Object.keys(GroupSampleInfo).length).fill(0);

  totalGroupWin = new Array(Object.keys(GroupSampleInfo).length).fill(0);

  totalGroupRound = new Array(Object.keys(GroupSampleInfo).length).fill(0);
  RtpModifyCnt = new Array(Object.keys(GroupSampleInfo).length).fill(0);
  RtpModifyCnt_U = new Array(Object.keys(GroupSampleInfo).length).fill(0);
  RtpModifyCnt_L = new Array(Object.keys(GroupSampleInfo).length).fill(0);
}
