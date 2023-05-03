type tSimpleType = number | boolean | string | Date | RegExp | null;
export interface iSimpleObject {
    [key: string]: tAnyType;
}
export type tAnyType = tSimpleType | iSimpleObject | tSimpleType[] | iSimpleObject[];

export type tResult3 = [tAnyType, number, number];
export type tResult = [tAnyType] | [tAnyType, tAnyType] | [tAnyType, tAnyType, number] | tResult3;
//type tResult = iResultItem | [iResultItem] | [iResultItem, 0, 0] | [iResultItem, iResultItem] | undefined;

export interface iResultDescription {
    [key: string | number]: tResult | tResultDescription;
}

export type tResultDescription = iResultDescription & {_t?: "a" | "b"};

export type tContextResult = tResultDescription | tResult | undefined;
export type tDelta = tResult | tAnyType | undefined;