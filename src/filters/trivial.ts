import DiffContext from "../contexts/diff";
import PatchContext from "../contexts/patch";
import {tResult} from "../contexts/result";
import ReverseContext from "../contexts/reverse";

export const diffFilter = function trivialMatchesDiffFilter(context: DiffContext) {
    if (context.left === context.right) {
        return context.setResult(undefined).exit();
    }
    if (typeof context.left === "function" || typeof context.right === "function") {
        throw new Error("functions are not supported");
    }
    if (context.left === undefined) {
        return context.setResult([context.right]).exit();
    }
    if (context.right === undefined) {
        return context.setResult([context.left, 0, 0]).exit();
    }
    
    if (context.leftType !== context.rightType) {
        return context.setResult([context.left, context.right]).exit();
    }
    if (context.leftType === "boolean" || context.leftType === "number") {
        return context.setResult([context.left, context.right]).exit();
    }
    if (context.leftIsArray !== context.rightIsArray) {
        return context.setResult([context.left, context.right]).exit();
    }

    if (context.left instanceof RegExp) {
        if (context.right instanceof RegExp) {
            return context
                .setResult([context.left.toString(), context.right.toString()])
                .exit();
        } else {
            return context.setResult([context.left, context.right]).exit();
        }
    }
};
diffFilter.filterName = "trivial";

export const patchFilter = function trivialMatchesPatchFilter(context: PatchContext) {
    if (typeof context.delta === "undefined") {
        return context.setResult(context.left).exit();
    }
    if (context.nested){
        return;
    }
    const arrDelta = context.delta as tResult;
    if (arrDelta.length === 1) {
        return context.setResult(arrDelta[0]).exit();
    }
    if (arrDelta.length === 2) {
        if (context.left instanceof RegExp) {
            const regexArgs = /^\/(.*)\/([gimyu]+)$/.exec(arrDelta[1] as string);
            if (regexArgs) {
                context.setResult(new RegExp(regexArgs[1], regexArgs[2])).exit();
                return;
            }
        }
        context.setResult(arrDelta[1]).exit();
        return;
    }
    if (arrDelta.length === 3 && arrDelta[2] === 0) {
        context.setResult(undefined).exit();
    }
};
patchFilter.filterName = "trivial";


export const reverseFilter = function trivialReferseFilter(context: ReverseContext) {
    if (context.delta === undefined) {
        return context.setResult(context.delta).exit();
    }
    if (context.nested) {
        return;
    }
    const arrDelta = context.delta as tResult;
    if (arrDelta.length === 1) {
        return context.setResult([arrDelta[0], 0, 0]).exit();
    }
    if (arrDelta.length === 2) {
        return context.setResult([arrDelta[1], arrDelta[0]]).exit();
    }
    if (arrDelta.length === 3 && arrDelta[2] === 0) {
        return context.setResult([arrDelta[0]]).exit();
    }
};
reverseFilter.filterName = "trivial";
