import { Gap } from '../client/gapClassMgr';
import { FgInstance } from '../client/fgInstance';
import { IAstNode } from '../tplMgr';
export default class GData extends Gap {
    static parse(node: IAstNode): GData;
    render(context: FgInstance, data: any): string;
    update(context: FgInstance, meta: Gap, scopePath: any, value: any): void;
}
