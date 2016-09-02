import { Gap } from './client/gapClassMgr';
export interface IGaps {
    [key: string]: typeof Gap;
}
declare const gaps: IGaps;
export default gaps;
