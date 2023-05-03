import {ContextWithDelta} from "./patch";
import {tDelta} from "./result";

class ReverseContext extends ContextWithDelta {
    pipe = "reverse";

    constructor(delta: tDelta) {
        super();
        this.delta = delta;
    }
}

export default ReverseContext;
