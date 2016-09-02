import { Tpl } from './tplMgr';
import { Gap } from './client/gapClassMgr';
/**
 * Renders template.
 * @param {Object[]} tpl - array of path's parts.
 * @param {Object} parent - parent for a template.
 * @param {Object} data - data object to render.
 * @param {Object} meta - meta modifier.
 * @returns {string} result code.
 */
export default function renderTpl(tpl: Tpl, parent: Gap, data: any, metaMod: any): string;
