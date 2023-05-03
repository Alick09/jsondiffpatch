import {isArray} from "../utils/array";
import Context from "./context";
import {tContextResult, tDelta} from "./result";


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
}

class PatchContext extends ContextWithDelta {
    left: tContextResult;
    pipe = "patch";

    constructor(left: tContextResult, delta: tDelta) {
        super();
        this.left = left;
        this.delta = delta;
    }
}

export default PatchContext;
