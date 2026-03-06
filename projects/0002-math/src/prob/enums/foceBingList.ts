export enum typeForceBingo {
  NO = -1,

  WinOver30 = 0, // TotalBet 30倍以上

  WinOver15 = 1, // TotalBet 15倍以上

  WinOver5 = 2, // TotalBet 5倍以上

  FG = 3, // FG

  CardFG = 4, // FG 虛寶卡

  DebugStrip = 5, // 指定轉輪帶位置 ex:[1,2, 0,-1,-1]

  HitJP = 6, // 指定中彩金

  singleThree = 30, // 單 3 右: [1, 0],[1,0],[0,1] singleThree(Right)

  evenThree = 31, // 雙 3 左: [0, 1],[1,0],[1,0] evenThree(Left)

  singleFour = 32, // 單 4 左: [1, 0],[0,1],[1,0] singleFour(Left)

  evenFour = 33, // 雙 4 右: [0, 1],[0,1],[0,1] evenFour(Right)

  treasureBox = 40, // Hit 寶箱
}
