import {tAnyType} from "./contexts/result";
import {isArray} from "./utils/array";

function cloneRegExp(re: RegExp) {
    const regexMatch = /^\/(.*)\/([gimyu]*)$/.exec(re.toString());
    if (regexMatch)
        return new RegExp(regexMatch[1], regexMatch[2]);
}

export const clone = (arg: any): any => {
    if (typeof arg !== "object") {
        return arg;
    }
    if (arg === null) {
        return null;
    }
    if (isArray(arg)) {
        return arg.map(clone);
    }
    if (arg instanceof Date) {
        return new Date(arg.getTime());
    }
    if (arg instanceof RegExp) {
        return cloneRegExp(arg);
    }
    const cloned: tAnyType = {};
    Object.keys(arg).forEach((name: string) => {
        cloned[name] = clone(arg[name]);
    });
    return cloned;
};
