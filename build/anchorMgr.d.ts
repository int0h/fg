import { FgInstance } from './client/fgInstance';
import { Gap } from './client/gapClassMgr';
export declare type Anchor = HTMLElement;
/**
 * Generates code for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Html code of the anchor.
 */
export declare function genCode(context: FgInstance, gap: Gap): string;
/**
 * Find the anchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {Object} Dom element of the anchor.
 */
export declare function find(context: FgInstance, gap: Gap): Anchor;
/**
 * Places some Html code next to the acnchor.
 * @param {Object} anchor - The anchor DOM element.
 * @param {string} position - Defines where code be placed. "after" and "before" are used relative to anchor node.
 * @param {string} html - HTML code to be placed.
 */
export declare function insertHTML(anchor: Anchor, position: string, html: string): void;
