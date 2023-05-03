import Pipe from "../pipe";
import {tAnyType, tContextResult} from "./result";

export default class Context {
    protected _cache: {[key: string]: any} = {};
    result: any;
    hasResult = true;
    exiting = false;
    nextPipe: string | Pipe | undefined;
    next: any;
    root: Context | undefined;
    options: any;
    parent: Context | undefined;
    children: any;
    childName: string | number | undefined;
    nextAfterChildren: any;
    newName: string | undefined;

    setResult(result: any): Context {
        this.result = result;
        this.hasResult = true;
        return this;
    }

    exit() {
        this.exiting = true;
    }

    switchTo(next: any, pipe: Pipe) {
        if (typeof next === "string" || next instanceof Pipe) {
            this.nextPipe = next;
        } else {
            this.next = next;
            if (pipe) {
                this.nextPipe = pipe;
            }
        }
        return this;
    }

    push(child: Context, name?: string | number) {
        child.parent = this;
        if (name !== undefined) {
            child.childName = name;
        }
        child.root = this.root || this;
        child.options = child.options || this.options;
        if (!this.children) {
            this.children = [child];
            this.nextAfterChildren = this.next || null;
            this.next = child;
        } else {
            this.children[this.children.length - 1].next = child;
            this.children.push(child);
        }
        child.next = this;
        return this;
    }

    getCached(name: string, func: ()=>any){
        if (this._cache[name] === undefined)
            this._cache[name] = func();
        return this._cache[name];
    }
}
