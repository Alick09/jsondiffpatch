import Context from "./contexts/context";

type tFilter = ((context: Context) => void) & {filterName: string};

class PipeError extends Error {noResult: boolean = false};

class Pipe {
    name: string;
    filters: tFilter[];
    processor: any;
    debug: boolean = false;
    resultCheck: null | ((context: Context) => void) = null;

    constructor(name: string) {
        this.name = name;
        this.filters = [];
    }

    process(input: any) {
        if (!this.processor) {
            throw new Error('add this pipe to a processor before using it');
        }
        let debug = this.debug;
        let length = this.filters.length;
        let context = input;
        for (let index = 0; index < length; index++) {
            let filter = this.filters[index];
            if (debug) {
                this.log(`filter: ${filter.filterName}`);
            }
            filter(context);
            if (typeof context === 'object' && context.exiting) {
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

    append(...args: tFilter[]) {
        this.filters.push(...args);
        return this;
    }

    prepend(...args: tFilter[]) {
        this.filters.unshift(...args);
        return this;
    }

    indexOf(filterName: string) {
        if (!filterName) {
            throw new Error('a filter name is required');
        }
        for (let index = 0; index < this.filters.length; index++) {
            let filter = this.filters[index];
            if (filter.filterName === filterName) {
                return index;
            }
        }
        throw new Error(`filter not found: ${filterName}`);
    }

    list() {
        return this.filters.map(f => f.filterName);
    }

    after(filterName: string) {
        let index = this.indexOf(filterName);
        let params: tFilter[] = Array.prototype.slice.call(arguments, 1);
        if (!params.length) {
            throw new Error('a filter is required');
        }
        this.filters.splice(index + 1, 0, ...params);
        return this;
    }

    before(filterName: string) {
        let index = this.indexOf(filterName);
        let params: tFilter[] = Array.prototype.slice.call(arguments, 1);
        if (!params.length) {
            throw new Error('a filter is required');
        }
        this.filters.splice(index, 0, ...params);
        return this;
    }

    replace(filterName: string) {
        let index = this.indexOf(filterName);
        let params: tFilter[] = Array.prototype.slice.call(arguments, 1);
        if (!params.length) {
            throw new Error('a filter is required');
        }
        this.filters.splice(index, 1, ...params);
        return this;
    }

    remove(filterName: string) {
        let index = this.indexOf(filterName);
        this.filters.splice(index, 1);
        return this;
    }

    clear() {
        this.filters.length = 0;
        return this;
    }

    shouldHaveResult(should: boolean) {
        if (should === false) {
            this.resultCheck = null;
            return;
        }
        if (this.resultCheck) {
            return;
        }
        let pipe = this;
        this.resultCheck = context => {
            if (!context.hasResult) {
                console.log(context);
                let error = new PipeError(`${pipe.name} failed`);
                error.noResult = true;
                throw error;
            }
        };
        return this;
    }
}

export default Pipe;
