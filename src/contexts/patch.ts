import {isArray} from "../utils/array";
import {ARRAY_MOVE} from "../utils/constants";
import Context from "./context";
import {tDelta} from "./result";


export class ContextWithDelta extends Context {
    delta: tDelta;

    isArrayDelta(){
        if (typeof this.delta === "object" && this.delta && "_t" in this.delta)
            return (this.delta._t === "a");
        return false;
    }
    public get nested(){
        return !isArray(this.delta);
    }
    public get arrayMove(): boolean {
        return isArray(this.delta) && this.delta[2] == ARRAY_MOVE;
    }
    forDeltaItems(func: (key: string, val: any, index: number) => void){
        const d_ = this.delta as Record<string, any>;
        return Object.keys(d_).map((k: string, i: number) => func(k, d_[k], i));
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
