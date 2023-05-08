import Context from "./contexts/context";
import Pipe from "./pipe";


export interface iProcessorOptions {
    objectHash?: (obj: object, index?: number) => string | number;
    arrays?: {
        // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
        detectMove?: boolean;
        // default false, the value of items moved is not included in deltas
        includeValueOnMove?: boolean;
    },
    textDiff?: {
        // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
        minLength?: number;
    },
    propertyFilter?: (name: string, context: Context) => boolean;
    cloneDiffValues?: boolean;
}


class Processor {
    selfOptions: iProcessorOptions;
    pipes: Record<string, Pipe>;

    constructor(options: iProcessorOptions) {
        this.selfOptions = options || {};
        this.pipes = {};
    }

    options(options?: iProcessorOptions) {
        if (options) {
            this.selfOptions = options;
        }
        return this.selfOptions;
    }

    addPipe(name: string, pipe: Pipe){
        this.pipes[name] = pipe;
        pipe.processor = this;
        return pipe;
    }

    pipe(name: string | Pipe, pipeArg?: Pipe): Pipe {
        if (typeof name === "string") {
            if (!pipeArg) {
                return this.pipes[name];
            } else {
                return this.addPipe(name, pipeArg);
            }
        }
        if (name && name.name) {
            const pipe = name;
            if (pipe.processor === this) {
                return pipe;
            }
            return this.addPipe(pipe.name, pipe);
        }
        throw new Error(`Bad arguments in Processor.pipe (${name})`);
    }

    process(input: Context, pipe?: Pipe) {
        let context = input;
        context.options = this.options();
        let nextPipe: Pipe | string | null = pipe || input.pipe || "default";
        let lastPipe;
        let lastContext;
        while (nextPipe) {
            if (context.nextAfterChildren !== undefined) {
                // children processed and coming back to parent
                context.next = context.nextAfterChildren;
                context.nextAfterChildren = null;
            }

            if (typeof nextPipe === "string") {
                nextPipe = this.pipe(nextPipe);
            }
            nextPipe.process(context);
            lastContext = context;
            lastPipe = nextPipe;
            nextPipe = null;
            if (context) {
                if (context.next) {
                    context = context.next;
                    nextPipe = lastContext.nextPipe || context.pipe || lastPipe;
                }
            }
        }
        return context.hasResult ? context.result : undefined;
    }
}

export default Processor;
