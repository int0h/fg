"use strict";
/**
 * Generates an id for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Id of the anchor tag.
 */
function genId(context, gap) {
    var id = ['fg', context.id, 'aid', gap.gid].join('-');
    return id;
}
;
/**
 * Generates code for an acnchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {string} Html code of the anchor.
 */
function genCode(context, gap) {
    var code = '<script type="fg-js/anchor" id="'
        + genId(context, gap)
        + '"></script>';
    return code;
}
exports.genCode = genCode;
;
/**
 * Find the anchor.
 * @param {Object} context - Fg containing the acnchor.
 * @param {Object} gap - Gap to which the acnchor is bind to.
 * @returns {Object} Dom element of the anchor.
 */
function find(context, gap) {
    var id = genId(context, gap);
    return document.getElementById(id);
}
exports.find = find;
;
/**
 * Places some Html code next to the acnchor.
 * @param {Object} anchor - The anchor DOM element.
 * @param {string} position - Defines where code be placed. "after" and "before" are used relative to anchor node.
 * @param {string} html - HTML code to be placed.
 */
function insertHTML(anchor, position, html) {
    var posTable = {
        "before": "beforebegin",
        "after": "afterend"
    };
    var pos = posTable[position];
    anchor.insertAdjacentHTML(pos, html);
}
exports.insertHTML = insertHTML;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5jaG9yTWdyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FuY2hvck1nci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFNYjs7Ozs7R0FLRztBQUNILGVBQWUsT0FBbUIsRUFBRSxHQUFRO0lBQ3hDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEQsTUFBTSxDQUFDLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFBQSxDQUFDO0FBRUY7Ozs7O0dBS0c7QUFDSCxpQkFBd0IsT0FBbUIsRUFBRSxHQUFRO0lBQ2pELElBQUksSUFBSSxHQUFHLGtDQUFrQztVQUN2QyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQztVQUNuQixhQUFhLENBQUM7SUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNoQixDQUFDO0FBTGUsZUFBTyxVQUt0QixDQUFBO0FBQUEsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0gsY0FBcUIsT0FBbUIsRUFBRSxHQUFRO0lBQzlDLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDN0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUhlLFlBQUksT0FHbkIsQ0FBQTtBQUFBLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILG9CQUEyQixNQUFjLEVBQUUsUUFBZ0IsRUFBRSxJQUFZO0lBQ3JFLElBQUksUUFBUSxHQUFHO1FBQ1IsUUFBUSxFQUFFLGFBQWE7UUFDdkIsT0FBTyxFQUFFLFVBQVU7S0FDekIsQ0FBQztJQUNGLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM3QixNQUFNLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFQZSxrQkFBVSxhQU96QixDQUFBO0FBQUEsQ0FBQyJ9