import { FgMgr } from './fgMgr';
export declare function load(fgMgr: FgMgr, name: string, dirPath: string): void;
export declare function loadDir(fgMgr: FgMgr, path: string): void;
export declare function buildTest(cb: Function): void;
export declare function buildRuntime(destPath: string, cb: Function): void;
export declare function build(srcPath: string, destPath: string, cb: Function): void;
