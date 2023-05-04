/* global diff_match_patch */
import {DiffMatchPatch, Diff, PatchOperation} from "diff-match-patch-ts";
import DiffContext from "../contexts/diff";
import {TEXT_DIFF} from "../utils/constants";
import PatchContext from "../contexts/patch";
import ReverseContext from "../contexts/reverse";

const DEFAULT_MIN_LENGTH = 60;
const diffMatchPatch = new DiffMatchPatch();


export const diffFilter = function textsDiffFilter(context: DiffContext) {
    if (context.leftType !== "string") {
        return;
    }
    const minLength =
    (context.options &&
      context.options.textDiff &&
      context.options.textDiff.minLength) ||
    DEFAULT_MIN_LENGTH;
    if (context.left.length < minLength || context.right.length < minLength) {
        context.setResult([context.left, context.right]).exit();
        return;
    }
    // large text, try to use a text-diff algorithm
    if (!diffMatchPatch) {
    // diff-match-patch library not available,
    // fallback to regular string replace
        context.setResult([context.left, context.right]).exit();
        return;
    }
    const diffs = diffMatchPatch.diff_main(context.left, context.right);
    diffMatchPatch.diff_cleanupSemantic(diffs);
    const patches = diffMatchPatch.patch_make(context.left, context.right, diffs);
    const diffText = diffMatchPatch.patch_toText(patches);
    context.setResult([diffText, 0, TEXT_DIFF]).exit();
};
diffFilter.filterName = "texts";

export const patchFilter = function textsPatchFilter(context: PatchContext) {
    if (context.nested || context.deltaItem(2) !== TEXT_DIFF) {
        return;
    }

    // text-diff, use a text-patch algorithm
    const patches = diffMatchPatch.patch_fromText(context.deltaItem(0));
    context.setResult(diffMatchPatch.patch_apply(patches, context.left)[0]).exit();
};
patchFilter.filterName = "texts";

const textDeltaReverse = function(delta: string): string {
    const patches = diffMatchPatch.patch_fromText(delta);
    const reversedPatches = patches.map((patch: PatchOperation): PatchOperation => {
        const invertedDiffs = patch.diffs.map(([op, s]: Diff): Diff => [-op, s]);
        invertedDiffs.forEach(([op]: Diff, i: number, arr) => {
            if (i > 0 && op == -1 && arr[i-1][0] == 1){
                const swap = arr[i]; 
                arr[i] = arr[i-1]; arr[i-1] = swap;
            }
        });
        const result = new PatchOperation();
        result.diffs = invertedDiffs;
        result.start1 = patch.start2;
        result.start2 = patch.start1;
        result.length1 = patch.length2;
        result.length2 = patch.length1;
        return result;
    });
    // console.log(Object.keys(patches[0]).reduce((acc, k: string)=>{
    //     if (k == "diffs")
    //         acc[k] = [patches[0], reversedPatches[0]].map((c) => c[k].map((v)=>`${v[0]}*${v[1]}`).join("; "));
    //     else
    //         acc[k] = [patches[0], reversedPatches[0]].map((c) => (c as any)[k]);
    //     return acc;
    // }, {} as any));
    const res = diffMatchPatch.patch_toText(reversedPatches);
    // console.log("=======", delta, "---------", res, "^^^^^^^^");
    return res;
};

export const reverseFilter = function textsReverseFilter(context: ReverseContext) {
    if (context.nested || context.deltaItem(2) !== TEXT_DIFF) {
        return;
    }
    context.setResult([textDeltaReverse(context.deltaItem(0)), 0, TEXT_DIFF]).exit();
};
reverseFilter.filterName = "texts";
