import Context from "./contexts/context";
import Processor from "./processor";

type tFilter = ((context: Context) => void) & {filterName: string};

class PipeError extends Error {noResult = false;}

class Pipe {
    name: string;
    filters: tFilter[];
    processor: Processor | undefined;
    debug = false;
    resultCheck: null | ((context: Context) => void) = null;

    constructor(name: string) {
        this.name = name;
        this.filters = [];
    }

    process(input: any) {
        if (!this.processor) {
            throw new Error("add this pipe to a processor before using it");
        }
        const debug = this.debug;
        const length = this.filters.length;
        const context = input;
        for (let index = 0; index < length; index++) {
            const filter = this.filters[index];
            if (debug) {
                this.log(`filter: ${filter.filterName}`);
            }
            filter(context);
            if (typeof context === "object" && context.exiting) {
                context.exiting = false;
                break;
            }
        }
        if (!context.next && this.resultCheck) {
            this.resultCheck(context);
        }
    }

    log(msg: string) {
        console.log(`[jsondiffpatch] ${this.name} pipe, ${msg}`);
    }

    append(...args: any[]) {
        this.filters.push(...args as tFilter[]);
        return this;
    }

    prepend(...args: tFilter[]) {
        this.filters.unshift(...args);
        return this;
    }

    indexOf(filterName: string) {
        if (!filterName) {
            throw new Error("a filter name is required");
        }
        for (let index = 0; index < this.filters.length; index++) {
            const filter = this.filters[index];
            if (filter.filterName === filterName) {
                return index;
            }
        }
        throw new Error(`filter not found: ${filterName}`);
    }

    list() {
        return this.filters.map(f => f.filterName);
    }

    after(filterName: string, ...params: tFilter[]) {
        const index = this.indexOf(filterName);
        if (!params.length) {
            throw new Error("a filter is required");
        }
        this.filters.splice(index + 1, 0, ...params);
        return this;
    }

    before(filterName: string, ...params: tFilter[]) {
        const index = this.indexOf(filterName);
        if (!params.length) {
            throw new Error("a filter is required");
        }
        this.filters.splice(index, 0, ...params);
        return this;
    }

    replace(filterName: string, ...params: tFilter[]) {
        const index = this.indexOf(filterName);
        if (!params.length) {
            throw new Error("a filter is required");
        }
        this.filters.splice(index, 1, ...params);
        return this;
    }

    remove(filterName: string) {
        const index = this.indexOf(filterName);
        this.filters.splice(index, 1);
        return this;
    }

    clear() {
        this.filters.length = 0;
        return this;
    }

    shouldHaveResult(should = true) {
        if (should === false) {
            this.resultCheck = null;
        }
        else if (!this.resultCheck) {
            this.resultCheck = context => {
                if (!context.hasResult) {
                    const error = new PipeError(`${this.name} failed`);
                    error.noResult = true;
                    throw error;
                }
            };
        }
        return this;
    }
}

export default Pipe;
