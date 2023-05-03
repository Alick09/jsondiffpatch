export const isArray =
    typeof Array.isArray === "function"
        ? Array.isArray
        : (a: any) => a instanceof Array;