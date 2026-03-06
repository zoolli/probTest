import { mainTest } from "./probTest";
import { workerData } from "worker_threads";
import { merge } from "./summaryMerge";
import * as fs from "fs";
import * as path from "path";

// Shared Test Configuration
const roundMonth = 1;
const inputBet = [
    { name: "anyWay", bet: 5 },
];
const rtp = 98.5;
const select = 4;
const totalWinLimit = 100 * 100000;
const controlRTPEnable = false;

const isNewbieEnable = true;
const numberOfNewbie = 100;
const roundsPerNewbie = 1000;

function getProjectName(): string {
    try {
        const srcPath = path.resolve(__dirname, "../../src");
        if (fs.existsSync(srcPath)) {
            const target = fs.readlinkSync(srcPath);
            // target is relative to root, e.g., projects/0002-math/src
            const parts = target.split(path.sep);
            // If we used relative symlink in select_project: projects/xxx/src
            const projectIndex = parts.indexOf("projects");
            if (projectIndex !== -1 && parts.length > projectIndex + 1) {
                return parts[projectIndex + 1];
            }
        }
    } catch (err) {
        // console.error("Error reading project name:", err.message);
    }
    return "Unknown Project";
}

export function main() {
    const name = workerData ? workerData.name : "LocalTest";
    const projectName = getProjectName();
    console.log(`Worker ${name}: running shared test flow for Project: [${projectName}]`);

    // This import will resolve to the currently selected project's main_game.ts
    // via the ./src symlink in the root.
    // Note: Adjust the import path if necessary based on the project structure.
    // Assuming the project structure is projects/<name>/src/prob/app/main_game.ts
    // and we link root/src to projects/<name>/src.

    mainTest(
        name,
        roundMonth,
        inputBet,
        rtp,
        select,
        totalWinLimit,
        isNewbieEnable,
        numberOfNewbie,
        roundsPerNewbie,
        controlRTPEnable
    );

    merge(name);

    console.log(`Worker ${name}: end`);
}

if (!workerData) main();
