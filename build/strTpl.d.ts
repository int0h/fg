export interface ValueParseFn {
    (str: string): any;
}
export interface ValueRenderFn {
    (parsed: any): string;
}
export declare class StrTpl {
    src: string;
    gaps: any;
    parts: any;
    isString: boolean;
    constructor(tpl: any, valueParseFn?: ValueParseFn);
    parse(tpl: any, valueParseFn: ValueParseFn): this;
    render(valueRenderFn: ValueRenderFn): string;
}
export declare function read(tpl: any, valueParseFn: ValueParseFn): StrTpl;
