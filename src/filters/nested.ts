import DiffContext from "../contexts/diff";
import PatchContext from "../contexts/patch";
import {tResultDescription} from "../contexts/result";
import ReverseContext from "../contexts/reverse";

export function collectChildrenDiffFilter(context: DiffContext) {
    if (!context || !context.children) {
        return;
    }
    const length = context.children.length;
    let result = context.result;
    for (let index = 0; index < length; index++) {
        const child = context.children[index];
        if (typeof child.result === "undefined") {
            continue;
        }
        result = result || {};
        result[child.childName] = child.result;
    }
    if (result && context.leftIsArray) {
        (result as tResultDescription)._t = "a";
    }
    context.setResult(result).exit();
}
collectChildrenDiffFilter.filterName = "collectChildren";

export function objectsDiffFilter(context: DiffContext) {
    if (context.leftIsArray || context.leftType !== "object") {
        return;
    }

    let name;
    const propertyFilter = context.options.propertyFilter;
    for (name in context.left) {
        if (!Object.prototype.hasOwnProperty.call(context.left, name)) {
            continue;
        }
        if (propertyFilter && !propertyFilter(name, context)) {
            continue;
        }
        const child = new DiffContext(context.left[name], context.right[name]);
        context.push(child, name);
    }
    for (name in context.right) {
        if (!Object.prototype.hasOwnProperty.call(context.right, name)) {
            continue;
        }
        if (propertyFilter && !propertyFilter(name, context)) {
            continue;
        }
        if (typeof context.left[name] === "undefined") {
            const child = new DiffContext(undefined, context.right[name]);
            context.push(child, name);
        }
    }

    if (!context.children || context.children.length === 0) {
        context.setResult(undefined).exit();
        return;
    }
    context.exit();
}
objectsDiffFilter.filterName = "objects";

export const patchFilter = function nestedPatchFilter(context: PatchContext) {
    if (!context.nested) {
        return;
    }
    if (context.isArrayDelta()) {
        return;
    }
    let name;
    for (name in context.delta) {
        const child = new PatchContext(context.left[name], context.delta[name]);
        context.push(child, name);
    }
    context.exit();
};
patchFilter.filterName = "objects";

export const collectChildrenPatchFilter = function collectChildrenPatchFilter(context: PatchContext) {
    if (!context || !context.children) {
        return;
    }
    if (context.isArrayDelta()) {
        return;
    }
    const length = context.children.length;
    let child;
    for (let index = 0; index < length; index++) {
        child = context.children[index];
        if (
            Object.prototype.hasOwnProperty.call(context.left, child.childName) &&
      child.result === undefined
        ) {
            delete context.left[child.childName];
        } else if (context.left[child.childName] !== child.result) {
            context.left[child.childName] = child.result;
        }
    }
    context.setResult(context.left).exit();
};
collectChildrenPatchFilter.filterName = "collectChildren";

export const reverseFilter = function nestedReverseFilter(context) {
    if (!context.nested) {
        return;
    }
    if (context.delta._t) {
        return;
    }
    let name;
    let child;
    for (name in context.delta) {
        child = new ReverseContext(context.delta[name]);
        context.push(child, name);
    }
    context.exit();
};
reverseFilter.filterName = "objects";

export function collectChildrenReverseFilter(context: ReverseContext) {
    if (!context || !context.children) {
        return;
    }
    if (context.isArrayDelta()) {
        return;
    }
    const length = context.children.length;
    let child;
    const delta = {};
    for (let index = 0; index < length; index++) {
        child = context.children[index];
        if (delta[child.childName] !== child.result) {
            delta[child.childName] = child.result;
        }
    }
    context.setResult(delta).exit();
}
collectChildrenReverseFilter.filterName = "collectChildren";
