import {isArray} from "../utils/array";
import {ARRAY_MOVE} from "../utils/constants";
import Context from "./context";
import {tDelta} from "./result";


export class ContextWithDelta extends Context {
    delta: tDelta;

    isArrayDelta(){
        return (this.delta as any)._t === "a";
    }
    public get nested(){
        return !isArray(this.delta);
    }
    public get arrayMove(): boolean {
        return isArray(this.delta) && this.delta[2] == ARRAY_MOVE;
    }
    forDeltaItems(func: (key: string, val: any, index: number, stop: (v: any)=>void) => void, keep_t = false){
        const d_ = this.delta as Record<string, any>;
        const keys = keep_t ? Object.keys(d_) : Object.keys(d_).filter(k => k !== "_t");
        const status = {stopRequested: false, retVal: undefined};
        const stop = (v: any) => {status.stopRequested = true; status.retVal = v;};
        keys.some((k: string, i: number) => {func(k, d_[k], i, stop); return status.stopRequested;});
        return status.retVal;
    }
    deltaItem(index: number){
        return (this.delta as any[])[index];
    }
}

class PatchContext extends ContextWithDelta {
    left: any;
    pipe = "patch";

    constructor(left: any, delta: tDelta) {
        super();
        this.left = left;
        this.delta = delta;
    }
}

export default PatchContext;
