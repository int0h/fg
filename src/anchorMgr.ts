"use strict";

import {FgInstance} from './client/fgInstance';
import {Gap} from './client/gapClassMgr';

export type Anchor = HTMLElement;
/**
 * Generates an id for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Id of the anchor tag.
 */
function genId(context: FgInstance, gap: Gap): string{
   	const id = ['fg', context.id, 'aid', gap.gid].join('-');
    return id;
};

/**
 * Generates code for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Html code of the anchor. 
 */
export function genCode(context: FgInstance, gap: Gap): string{
    const code = '<script type="fg-js/anchor" id="' 
        + genId(context, gap) 
        + '"></script>';
    return code;
};

/**
 * Find the anchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {Object} Dom element of the anchor.
 */
export function find(context: FgInstance, gap: Gap): Anchor{
   	const id = genId(context, gap);    
    return document.getElementById(id);
};

/**
 * Places some Html code next to the acnchor.
 * @param {Object} anchor - The anchor DOM element.
 * @param {string} position - Defines where code be placed. "after" and "before" are used relative to anchor node.
 * @param {string} html - HTML code to be placed.
 */

export function insertHTML(anchor: Anchor, position: string, html: string){   	
    let pos: string;
    switch (position){
        case "before": pos = "beforebegin"; break;
        case "after": pos = "afterend"; break;
    };
    anchor.insertAdjacentHTML(pos, html);
};