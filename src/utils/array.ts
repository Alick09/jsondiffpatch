// export const isArray =
//     typeof Array.isArray === "function"
//         ? Array.isArray
//         : (a: unknown) => a instanceof Array;

export const isArray = Array.isArray;


export const compare = {
    numerically(a: number, b: number) {
        return a - b;
    },
    numericallyBy(name: string | number) {
        return (a: any, b: any) => a[name] - b[name];
    },
};