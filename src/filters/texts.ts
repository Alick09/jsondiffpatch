/* global diff_match_patch */
import {Diff, diff_match_patch as dmp} from "diff-match-patch";
import DiffContext from "../contexts/diff";
import {TEXT_DIFF} from "../utils/constants";
import PatchContext from "../contexts/patch";
import ReverseContext from "../contexts/reverse";

const DEFAULT_MIN_LENGTH = 60;
const diffMatchPatch = new dmp();


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
    const diff = diffMatchPatch.diff_main;
    context.setResult([diff(context.left, context.right), 0, TEXT_DIFF]).exit();
};
diffFilter.filterName = "texts";

export const patchFilter = function textsPatchFilter(context: PatchContext) {
    if (context.nested || context.deltaItem(2) !== TEXT_DIFF) {
        return;
    }

    // text-diff, use a text-patch algorithm
    const patch = diffMatchPatch.patch_apply;
    context.setResult(patch(context.deltaItem(0), context.left)[0]).exit();
};
patchFilter.filterName = "texts";

const textDeltaReverse = function(delta: Diff[]): Diff[] {
    return delta.map(([op, text]: Diff) => [-op, text]);
};

export const reverseFilter = function textsReverseFilter(context: ReverseContext) {
    if (context.nested || context.deltaItem(2) !== TEXT_DIFF) {
        return;
    }
    context.setResult([textDeltaReverse(context.deltaItem(0)), 0, TEXT_DIFF]).exit();
};
reverseFilter.filterName = "texts";
