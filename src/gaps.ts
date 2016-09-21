"use strict";

import {Gap} from './client/gapClassMgr';

import {default as content} from './gaps/content';
import {default as data} from './gaps/data';
import {default as dynamicText} from './gaps/dynamic-text';
import {default as fg} from './gaps/fg';
import {default as raw} from './gaps/raw';
import {default as scope} from './gaps/scope';
import {default as scopeItem} from './gaps/scope-item';

export interface IGaps{
    [key: string]: typeof Gap;
};

const gaps: IGaps = {
    content,
    data,
    dynamicText,
    fg,
    raw,
    scope,
    scopeItem
};

export default gaps; 

