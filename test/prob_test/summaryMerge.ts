import * as fs from "fs";
import * as path from "path";
// Use require with any to avoid the "Cannot find module 'xlsx' or its corresponding type declarations" TypeScript error
const xlsx: any = require("xlsx");

export function merge(name: string) {
  const inputFolder = `./probTestResult${name}`;
  const mergeFile = path.join(inputFolder, "merge.xlsx");
  const summaryFile = path.join(inputFolder, "summary.csv");
  if (fs.existsSync(summaryFile)) fs.unlinkSync(summaryFile);
  const files = fs.readdirSync(inputFolder).filter((f) => f.endsWith(".csv"));

  const workbook = xlsx.utils.book_new();

  const summary: any[][] = [
    [
      "SheetNames",
      "ROUND",
      "MIN",
      "MAX",
      "COUNT",
      "AVERAGE",
      "P_0.05",
      "P_0.1",
      "P_0.5",
      "P_0.9",
      "P_0.95",
      "P_0.99",
    ],
  ];
  const summarya = JSON.parse(JSON.stringify(summary));

  for (const file of files) {
    const sheetName = path.parse(file).name;
    const filePath = path.join(inputFolder, file);
    const content = fs.readFileSync(filePath, "utf8");
    const records: any = content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return parts.map((v) => {
          if (v.endsWith("%")) {
            const num = parseFloat(v.replace("%", ""));
            return isNaN(num) ? v : { v: num / 100, t: "n", z: "0.00%" };
          }

          const num = Number(v);
          return isNaN(num) || v === "" ? v : num;
        });
      });

    records[0].push(
      "",
      "MIN",
      "MAX",
      "COUNT",
      "AVERAGE",
      "P_0.05",
      "P_0.1",
      "P_0.5",
      "P_0.9",
      "P_0.95",
      "P_0.99"
    );

    if (records.length > 1) {
      const col = records.slice(1).map((row) => {
        const val = row[2];
        let num = 0;

        if (
          typeof val === "object" &&
          val !== null &&
          typeof val.v === "number"
        ) {
          num = val.v;
        } else if (typeof val === "number") {
          num = val;
        } else {
          num = NaN;
        }

        if (!Number.isFinite(num)) {
          return 0;
        }

        return num;
      });

      const getPercentile = (arr, p) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const n = sorted.length;
        const rank = p * (n + 1);
        const k = Math.floor(rank);
        const d = rank - k;
        if (k <= 0) return sorted[0];
        if (k >= n) return sorted[n - 1];
        return sorted[k - 1] + d * (sorted[k] - sorted[k - 1]);
      };

      const min = Math.min(...col);
      const max = Math.max(...col);
      const count = col.length;
      const average = col.reduce((a, b) => a + b, 0) / count;
      const p05 = getPercentile(col, 0.05);
      const p1 = getPercentile(col, 0.1);
      const p5 = getPercentile(col, 0.5);
      const p9 = getPercentile(col, 0.9);
      const p95 = getPercentile(col, 0.95);
      const p99 = getPercentile(col, 0.99);

      records[1].push(
        "",
        {
          f: `MIN(C2:C${records.length})`,
          v: min,
        },
        { f: `MAX(C2:C${records.length})`, v: max },
        { f: `COUNT(C2:C${records.length})`, v: count },
        {
          f: `AVERAGE(C2:C${records.length})`,
          v: average,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.05)`,
          v: p05,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.1)`,
          v: p1,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.5)`,
          v: p5,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.9)`,
          v: p9,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.95)`,
          v: p95,
        },
        {
          f: `PERCENTILE(C2:C${records.length},0.99)`,
          v: p99,
        }
      );

      const round = (() => {
        const match = sheetName.match(/(\d+)([wk]?)/i); // 支援 w/k 結尾
        if (!match) return null;
        let [_, numStr, unit] = match;
        let num = parseInt(numStr, 10);
        if (unit.toLowerCase() === "w") num *= 10000;
        if (unit.toLowerCase() === "k") num *= 1000;
        return num;
      })();

      summary.push([
        sheetName,
        round,
        { f: `'${sheetName}'!G2`, v: min },
        { f: `'${sheetName}'!H2`, v: max },
        { f: `'${sheetName}'!I2`, v: count },
        { f: `'${sheetName}'!J2`, v: average },
        { f: `'${sheetName}'!K2`, v: p05 },
        { f: `'${sheetName}'!L2`, v: p1 },
        { f: `'${sheetName}'!M2`, v: p5 },
        { f: `'${sheetName}'!N2`, v: p9 },
        { f: `'${sheetName}'!O2`, v: p95 },
        { f: `'${sheetName}'!P2`, v: p99 },
      ]);

      summarya.push([
        sheetName,
        round,
        (min * 100).toFixed(2) + "%",
        (max * 100).toFixed(2) + "%",
        count,
        (average * 100).toFixed(2) + "%",
        (p05 * 100).toFixed(2) + "%",
        (p1 * 100).toFixed(2) + "%",
        (p5 * 100).toFixed(2) + "%",
        (p9 * 100).toFixed(2) + "%",
        (p95 * 100).toFixed(2) + "%",
        (p99 * 100).toFixed(2) + "%",
      ]);
    }

    const worksheet = xlsx.utils.aoa_to_sheet(records);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const summaryHeader = summary[0];
  const summarySorted = summary
    .slice(1)
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  summary.length = 0;
  summary.push(summaryHeader, ...summarySorted);

  const summaryaHeader = summarya[0];
  const summaryaSorted = summarya
    .slice(1)
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  summarya.length = 0;
  summarya.push(summaryaHeader, ...summaryaSorted);

  const summarySheet = xlsx.utils.aoa_to_sheet(summary);
  xlsx.utils.book_append_sheet(workbook, summarySheet, "summary");

  const getRoundFromSheetName = (sheetName) => {
    const match = sheetName.match(/(\d+)([wk]?)/i);
    if (!match) return Infinity; // 沒有數字的排最後
    let [_, numStr, unit] = match;
    let num = parseInt(numStr, 10);
    if (unit.toLowerCase() === "w") num *= 10000;
    if (unit.toLowerCase() === "k") num *= 1000;
    return num;
  };

  workbook.SheetNames = [
    "summary",
    ...workbook.SheetNames.filter((name) => name !== "summary").sort(
      (a, b) => getRoundFromSheetName(a) - getRoundFromSheetName(b)
    ),
  ];

  fs.writeFileSync(
    summaryFile,
    xlsx.utils.sheet_to_csv(xlsx.utils.aoa_to_sheet(summarya)),
    "utf8"
  );

  //xlsx.writeFile(workbook, mergeFile, { compression: true });
}
