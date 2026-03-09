import { NgStrip } from "../setup/ng_strip";
import { FgStrip } from "../setup/fg_strip";

const getStrip = (stripSet: any, prob = 0): string[][] => {
  if (prob < 0 || prob >= Object.keys(stripSet).length) {
    throw new Error("Invalid prob type");
  }

  return stripSet[`type${prob}`];
};

export const SwitchChance = {
  ng(prob = 0): string[][] {
    return getStrip(NgStrip, prob);
  },

  fg(prob = 0): string[][] {
    return getStrip(FgStrip, prob);
  },
};
