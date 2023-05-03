import Pipe from "../pipe";

export default class Context {
    protected _cache: {[key: string]: any} = {};
    result: any;
    pipe: Pipe | string | undefined;
    hasResult = true;
    exiting = false;
    nextPipe: string | Pipe | undefined;
    root: Context | undefined;
    parent: Context | undefined;
    childName: string | number | undefined;
    newName: string | undefined;
    next: any;
    options: any;
    children: Context[] | undefined;
    nextAfterChildren: any;

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
