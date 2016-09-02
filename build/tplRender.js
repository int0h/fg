"use strict";
var utils = require('./utils');
;
/**
 * Renders template.
 * @param {Object[]} tpl - array of path's parts.
 * @param {Object} parent - parent for a template.
 * @param {Object} data - data object to render.
 * @param {Object} meta - meta modifier.
 * @returns {string} result code.
 */
function renderTpl(tpl, parent, data, metaMod) {
    var self = this;
    var parts = tpl.map(function (part, partId) {
        if (typeof part === "string") {
            return part;
        }
        ;
        var partMeta = utils.simpleClone(part);
        if (metaMod) {
            if (typeof metaMod === "function") {
                partMeta = metaMod(partMeta, partId);
            }
            else {
                partMeta = utils.extend(partMeta, metaMod || {});
            }
            ;
        }
        ;
        return self.renderGap(self.context, parent, data, partMeta);
    });
    var code = parts.join('');
    return code;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = renderTpl;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHBsUmVuZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RwbFJlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixJQUFZLEtBQUssV0FBTSxTQUFTLENBQUMsQ0FBQTtBQVFoQyxDQUFDO0FBRUY7Ozs7Ozs7R0FPRztBQUNILG1CQUFrQyxHQUFRLEVBQUUsTUFBVyxFQUFFLElBQVMsRUFBRSxPQUFPO0lBQzFFLElBQUksSUFBSSxHQUFnQixJQUFJLENBQUM7SUFDN0IsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQUksRUFBRSxNQUFNO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7WUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUM7UUFBQSxDQUFDO1FBQ0YsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxDQUFDO1lBQ1osRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssVUFBVSxDQUFDLENBQUEsQ0FBQztnQkFDbEMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUFBLElBQUksQ0FBQSxDQUFDO2dCQUNMLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEQsQ0FBQztZQUFBLENBQUM7UUFDSCxDQUFDO1FBQUEsQ0FBQztRQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM3RCxDQUFDLENBQUMsQ0FBQztJQUNILElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNiLENBQUM7QUFsQkQ7MkJBa0JDLENBQUE7QUFBQSxDQUFDIn0=