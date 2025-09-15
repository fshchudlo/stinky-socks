import { GitlabFileDiffModel } from "../../GitlabAPI.contracts";

export default function calculatePRDiffSize(changes: GitlabFileDiffModel[]) {
    let diffRowsAdded = 0;
    let diffRowsDeleted = 0;
    for (const change of changes) {
        const lines = change.diff.split("\n");

        for (const line of lines) {
            if (line.startsWith("+") && !line.startsWith("+++")) {
                diffRowsAdded++;
            } else if (line.startsWith("-") && !line.startsWith("---")) {
                diffRowsDeleted++;
            }
        }
    }
    return { diffRowsAdded, diffRowsDeleted };
}