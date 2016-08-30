import { FgInstance } from './fgInstance';
import { Gap } from './gapClassMgr';
export default class GapStorage {
    context: FgInstance;
    gaps: Gap[];
    scopeTree: any;
    eidDict: Object;
    constructor(context: FgInstance);
    setScopeTrigger(gap: Gap, scopePath: any): void;
    setTriggers(gap: Gap, scopeTriggers: any): void;
    reg(gap: Gap): void;
    assign(): void;
    byScope(scopePath: any, targetOnly?: boolean): {
        target: any;
        subs: any[];
        parents: any;
    };
    removeScope(scopePath: any): void;
    byEid(eid: any): any;
    getGid(): number;
}
