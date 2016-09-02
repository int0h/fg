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
    constructor(tpl: StrTpl | string, valueParseFn?: ValueParseFn);
    parse(tpl: string, valueParseFn: ValueParseFn): this;
    render(valueRenderFn: ValueRenderFn): string;
}
export declare function read(tpl: any, valueParseFn: ValueParseFn): StrTpl;
