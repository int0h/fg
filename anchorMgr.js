"use strict";

/**
 * Generates an id for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Id of the anchor tag.
 */
function genId(context, gap){
   	var id = ['fg', context.id, 'aid', gap.gid].join('-');
    return id;
};

/**
 * Generates code for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Html code of the anchor. 
 */
function genCode(context, gap){
    var code = '<script type="fg-js/anchor" id="' 
        + genId(context, gap) 
        + '"></script>';
    return code;
};
exports.genCode = genCode;

/**
 * Find the anchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {Object} Dom element of the anchor.
 */
function find(context, gap){
   	var id = genId(context, gap);    
    return document.getElementById(id);
};
exports.find = find;

/**
 * Places some Html code next to the acnchor.
 * @param {Object} anchor - The anchor DOM element.
 * @param {string} position - Defines where code be placed. "after" and "before" are used relative to anchor node.
 * @param {string} html - HTML code to be placed.
 */
function insertHTML(anchor, position, html){
   	var posTable = {
           "before": "beforebegin",
           "after": "afterend"
    };
    var pos = posTable[position];
    anchor.insertAdjacentHTML(pos, html);
};
exports.insertHTML = insertHTML;
