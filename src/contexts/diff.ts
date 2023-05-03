import Context from "./context";
import {clone} from "../clone";
import {isArray} from "../utils/array";

class DiffContext extends Context {
    left: any;
    right: any;
    objectHash: any;
    matchByPosition: any;
    hashCache1?: any;
    hashCache2?: any;

    constructor(left: any, right: any) {
        super();
        this.left = left;
        this.right = right;
        this.pipe = "diff";
    }

    setResult(result: any): Context {
        if (this.options.cloneDiffValues && typeof result === "object") {
            const clone = this.getClone();
            if (typeof result[0] === "object") {
                result[0] = clone(result[0]);
            }
            if (typeof result[1] === "object") {
                result[1] = clone(result[1]);
            }
        }
        return super.setResult(result);
    }

    getClone(){
        return typeof this.options.cloneDiffValues === "function"
            ? this.options.cloneDiffValues
            : clone;
    }

    public get leftType() {
        return this.getCached("leftType", () => this.left === null ? "null" : typeof this.left);
    }

    public get rightType() {
        return this.getCached("rightType", () => this.right === null ? "null" : typeof this.right);
    }

    public get leftIsArray() {
        return this.getCached("leftIsArray", () => this.leftType === "object" && isArray(this.left));
    }

    public get rightIsArray() {
        return this.getCached("rightIsArray", () => this.rightType === "object" && isArray(this.right));
    }
}

export default DiffContext;
