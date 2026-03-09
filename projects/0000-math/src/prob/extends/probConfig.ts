import {
  IProbConfig,
  IProbConfigSetting,
  MissionType,
  SpecType,
  WinType,
} from "@championgameteam/ah-slot-game-server-plugin";
import { gameDefault } from "../setup/gameDefaultSettings";
import { GameInfo } from "@championgameteam/cg-product-info";

const gameID = "0010";
const gameName = GameInfo.gameName[gameID];

export class ProbConfig implements IProbConfig {
  // 遊戲語系
  language: { en: string; tw: string; cn: string; "th-th": string };
  // Config Setting
  setting: IProbConfigSetting;

  // MA可設定機率期望值
  rtpMasterAgent: { [key: string]: any };

  // 後台資料設定
  gameSettingList: { [key: string]: any };

  // 送獎List
  forceBingoList: { [key: string]: any };

  // 其他相關設定 For GM
  extraInfo: { [key: string]: any };

  // [新手機率] newBit設定
  gameRegulation?: {
    newbie?: {
      healUp: {
        multiplier: [number, number];
      };
      trigger: {
        statisticRound: number;
        rtp: {
          cond: "LessOrEqual";
          value: number;
        };
      };
      finish: [
        {
          statisticRound: number;
          rtp: {
            cond: "GreaterOrEqual";
            value: number;
          };
        },
        {
          roundCunt: {
            cond: "GreaterOrEqual";
            value: number;
          };
        },
        {
          platform: {
            statisticRound: number;
            rtp: {
              cond: "GreaterOrEqual";
              value: number;
            };
          };
        }
      ];
    };
  };

  constructor() {
    this.language = GameInfo.language[gameName];
    this.setting = {
      // 預設機率
      rtp: 96,

      //  預設MA機率
      rtpMasterAgent: [80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 98.5, 99, 100],

      // 橫
      row: 3,
      // 直
      column: 5,
      // Fg 選擇
      fgRounds: [21, 16, 12, 9, 6],

      // fg加局數
      addFGRounds: 0,

      // 最高押注分數 (500)
      maxBet: 600,

      // 最低押注分數 (0.5)
      minBet: 0.5,

      // 押注限制
      betLimit: 600,

      // 最高單一押注分數
      maxSingleBet: -1,

      // NG/FG/BG最大總贏分限制 500,000
      totalWinLimit: 500000,

      // FG最大次數
      maxFGTimes: 10,
      // FG最大局數
      maxFGRounds: 100,
      // 開啟黑暗期
      bBlackPeriod: false,
      // 輪帶大小機率
      wheelsRTP: [100, 80],
      // 押注群組
      betList: [
        0.5,
        1,
        1.5,
        2.5,
        5,
        7.5,
        10,
        12.5,
        15,
        20,
        25,
        50,
        75,
        100,
        125,
        150,
        200,
        250,
        300,
        350,
        400,
        450,
        500,
        550,
        600,
      ],

      typeForceBingo: {
        UltraWin: "UltraWin", // UltraWin 20倍以上
        MegaWin: "MegaWin", // MegaWin 10倍以上
        BigWin: "BigWin", // TotalBet 5倍以上
        FG: "FG", // FG
        CardFG: "CardFG", // FG 虛寶卡
        DebugStrip: "debugStrip", // 指定轉輪帶位置 ex:[1,2, 0,-1,-1] (物件小寫)
      },

      // 幣別
      currencyType: "CNY", //  "MABU", "TWD",

      // 押注單位，可選輪押注時才會有非 1 的值
      reelBet: 1, // [1, 3, 7, 15, 25, 30],

      // 賠率單位
      betUnit: 25,

      //[新手機率] 啟動基金設定
      gameRegulation: {
        newbie: {
          startupCapital: {
            base: 15000,
            commission: 0.4, // 新手期間
            limit: 30000,
          },
        },
      },

      // [BuyFeature] 開關購買遊戲功能 flase/true
      isOpenBuyFeature: false,

      // [BuyFeature] 開關購買遊戲最大押注
      buyFeatureBetMax: 200000,
      // [controlRTP] 開關機率調控 0: flase, 1: true
      controlRTP: false,

      // [controlNewbie] 開關新手機率功能 0: flase, 1: true
      controlNewbie: false,
    };

    // MA可設定機率期望值
    this.rtpMasterAgent = {
      rtp80: 80,
      rtp90: 90,
      rtp91: 91,
      rtp92: 92,
      rtp93: 93,
      rtp94: 94,
      rtp95: 95,
      rtp96: 96,
      rtp97: 97,
      rtp98: 98,
      rtp98_5: 98.5,
      rtp99: 99,
      rtp100: 100,
    };

    // 後台資料設定
    this.gameSettingList = {
      DEFAULT: [
        // 機率期望值
        {
          name: "rtp",
          type: "checkBox",
          value: gameDefault.DEFAULT.rtp,
        },

        // MA可設定機率期望值
        {
          name: "rtpMasterAgent",
          type: "list",
          value: gameDefault.DEFAULT.rtp,
        },

        // NG/FG/BG最大總贏分限制
        {
          name: "totalWinLimit",
          type: "range",
          value: gameDefault.DEFAULT.totalWinLimit,
        },
        // 押注群組
        {
          name: "betList",
          type: "list",
          value: gameDefault.DEFAULT.betList,
        },
        // 押注上限
        {
          name: "betLimit",
          type: "range",
          value: gameDefault.DEFAULT.betLimit,
        },
        // 押注單位
        {
          name: "reelBet",
          type: "text",
          value: gameDefault.DEFAULT.reelBet,
        },
        // 最大總押分(多押注遊戲)
        {
          name: "maxBet",
          type: "range",
          value: gameDefault.DEFAULT.maxBet,
        },

        //[新手機率] 啟動基金設定
        {
          name: "gameRegulation",
          type: "text",
          value: gameDefault.DEFAULT.gameRegulation,
        },

        // [BuyFeature] 開關購買遊戲功能
        {
          name: "isOpenBuyFeature",
          type: "checkBox",
          value: gameDefault.DEFAULT.isOpenBuyFeature,
        },
        // [BuyFeature] 開關購買押注上限功能
        {
          name: "buyFeatureBetMax",
          type: "range",
          value: gameDefault.DEFAULT.buyFeatureBetMax,
        },
        // [controlRTP] 開關調控機率功能
        {
          name: "controlRTP",
          type: "checkBox",
          value: gameDefault.DEFAULT.controlRTP,
        },

        // [controlNewbie] 開關新手機率功能
        {
          name: "controlNewbie",
          type: "checkBox",
          value: gameDefault.DEFAULT.controlNewbie,
        },
      ],
    };

    // 送獎List
    this.forceBingoList = {
      // checkBox
      DEFAULT: [
        // 送獎
        {
          name: "forceBingo",
          type: "checkBox",
          value: gameDefault.DEFAULT.forceBingo,
        },
        // 中JP獎
        { name: "JP1", type: "checkBox", value: gameDefault.DEFAULT.JP1 },
        // 指定轉輪帶位置
        {
          name: "DebugStrip",
          type: "list",
          value: gameDefault.DEFAULT.DebugStrip,
        },
      ],
    };

    this.extraInfo = {
      // JP 種類
      jpGame: "JP001",

      // jpBase
      // jpBase: [],

      // 虛寶卡種類
      treasureCard: [WinType.CardFG],

      // 遊戲種類(任務用)
      gameStatus: [WinType.FreeGame],

      // 任務列表
      missionList: [MissionType.HitS1FiveLink],

      // 遊戲規格
      specType: SpecType.SlotGame,

      // [BuyFeature] 買的價值倍數
      oddsBuyFeatureFG: 50, // 45
      // oddsBuyFeatureBG: 999, // 999表示沒這張卡

      // [新手機率] 擋獎倍數
      newBitLimitedPays: 45,

      // [BuyFeature] 新手期間擋獎倍數
      newBitBuyFeatureLimitedPays: 1000,
    };
    // [新手機率] 設定
    this.gameRegulation = {
      // 新手機率
      newbie: {
        // 回血倍數
        healUp: {
          multiplier: [4, 6],
        },
        // 最近20局RTP未達65%
        trigger: {
          statisticRound: 20,
          rtp: {
            cond: "LessOrEqual",
            value: 0.65,
          },
        },
        finish: [
          // 最近20局RTP>150%
          {
            statisticRound: 20,
            rtp: {
              cond: "GreaterOrEqual",
              value: 1.5,
            },
          },
          // 局數滿 500
          {
            roundCunt: {
              cond: "GreaterOrEqual",
              value: 500,
            },
          },
          // 跨遊戲 500 局RTP> 110%)
          {
            platform: {
              statisticRound: 500,
              rtp: {
                cond: "GreaterOrEqual",
                value: 1.1,
              },
            },
          },
        ],
      },
    };
  }
}
