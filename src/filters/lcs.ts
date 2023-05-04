/*
LCS implementation that supports arrays or strings
reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
*/

import {tAnyType} from "../contexts/result";

const defaultMatch = (array1: tAnyType[], array2: tAnyType[], index1: number, index2: number) => {
    return array1[ index1 ] === array2[ index2 ];
};

type tMatrix = {l: number; dir: number}[][];

const lengthMatrix = (array1: tAnyType[], array2: tAnyType[], match: any, context: any): tMatrix => {
    const len1 = array1.length;
    const len2 = array2.length;
    let x, y;

    // initialize empty matrix of len1+1 x len2+1
    const matrix = Array(len1 + 1).fill(0).map(() => Array(len2 + 1).fill({l: 0, dir: 0}));
    // save sequence lengths for each coordinate
    for (x = 1; x < len1 + 1; x++) {
        for (y = 1; y < len2 + 1; y++) {
            if (match(array1, array2, x - 1, y - 1, context)) {
                matrix[x][y] = {l: matrix[x - 1][y - 1].l + 1, dir: 1};
            } else {
                if (matrix[x-1][y].l > matrix[x][y-1].l)
                    matrix[x][y] = {l: matrix[x-1][y].l, dir: 2};
                else
                    matrix[x][y] = {l: matrix[x][y-1].l, dir: 3};
            }
        }
    }
    return matrix;
};

const backtrack = function(matrix: tMatrix, array1: tAnyType[], array2: tAnyType[]) {
    let index1 = array1.length;
    let index2 = array2.length;
    const subsequence = {
        sequence: [] as tAnyType[] | string,
        indices1: [] as number[],
        indices2: [] as number[],
    };

    // console.log(array1, array2);
    // console.log(matrix);

    while (index1 !== 0 && index2 !== 0) {
        switch(matrix[index1][index2].dir){
            case 1:
                (subsequence.sequence as tAnyType[]).unshift(array1[index1 - 1]);
                subsequence.indices1.unshift(index1 - 1);
                subsequence.indices2.unshift(index2 - 1);
                --index1;
                --index2;
                break;
            case 2:
                --index1;
                break;
            case 3:
                --index2;
                break;
        }
        
    }
    return subsequence;
};

export const get = function(array1: tAnyType[], array2: tAnyType[], match: any, context: any) {
    const innerContext = context || {};
    const matrix = lengthMatrix(array1, array2, match || defaultMatch, innerContext);
    const result = backtrack(matrix, array1, array2);
    if (typeof array1 === "string" && typeof array2 === "string") {
        result.sequence = (result.sequence as string[]).join("");
    }
    return result;
};
