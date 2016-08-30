"use strict";
var utils = require('./utils');
var path = require('path');
var gapClassMgr_1 = require('./client/gapClassMgr');
var gapClassTable = {};
/**
 * Reads the given ast and returns gap tree.
 * @param {object} ast - Parsed AST of a template.
 * @param {string} html - Source code of template. [deprecated]
 * @param {object} parentMeta - Parent gap.
 * @return {gap | null}
 */
function parse(ast, html, parentMeta) {
    /*var name = ast.nodeName;
    var gap = gapTable[name];
    if (!gap){
        return false;
    };*/
    var matched = [];
    for (var i in gapClassTable) {
        var gap = gapClassTable[i];
        var meta = gap.parse(ast, html, parentMeta);
        if (meta) {
            matched.push({
                "gap": gap,
                "meta": meta
            });
        }
        ;
    }
    ;
    if (matched.length > 1) {
        var maxPrior = Math.max.apply(Math, matched.map(function (item) {
            return item.gap.priority;
        }));
        matched = matched.filter(function (item) {
            return item.gap.priority === maxPrior;
        });
    }
    if (matched.length === 1) {
        return matched[0].meta;
    }
    ;
    if (matched.length === 0) {
        return null;
    }
    ;
    if (matched.length > 1) {
        throw new Error("Gap parsing conflict");
    }
    ;
    return null;
}
exports.parse = parse;
;
/**
 * Renders a gap type according to parsed meta.
 * @param {object} data - Data for gap.
 * @param {object} meta - Meta for gap.
 * @param {object} context - Fg containing the gap.
 * @return {string}
 */
function render(data, meta, context) {
    var gap = gapClassTable[meta.type];
    return gap.render(data, meta, context);
}
exports.render = render;
;
/**
 * Generates gap info for client. [deprecated]
 * @return {string}
 */
function genClientCode() {
    var clientCode = "var gapClassMgr = require('./gapClassMgr.js');"
        + "var renderTpl = require('fg-js/tplRender.js').renderTpl.bind(null, gapClassMgr);\n";
    var gapCodes = [];
    for (var i in gapClassTable) {
        var gap = gapClassTable[i];
        var propCode = [
            '"render": ' + gap.render.toString(),
            '"update": ' + gap.update.toString(),
        ].join(',\n');
        gapCodes.push('exports["' + i + '"] = {\n\t' + propCode + '\n};');
    }
    ;
    clientCode += gapCodes.join('\n\n');
    return clientCode;
}
exports.genClientCode = genClientCode;
;
/**
 * Reads gap directory and registers gaps from there.
 * @param {string} gapPath - path to the "gaps" directory.
 */
function readGapDir(gapPath) {
    // TODO: delete
    var name = /\/([^\/]*)\/?$/.exec(gapPath)[1];
    //var reqPath = './' + path.relative(path.dirname(module.filename), gapPath).replace(/\\/g, '/');
    var clientPath = path.dirname(require.resolve('fg-js/client/main.js'));
    var reqPath = path.relative(clientPath, gapPath).replace(/\\/g, '/');
    var configObj = {
        "name": name,
        "path": reqPath,
        "parse": require(gapPath + '/parse.js'),
        "render": require(gapPath + '/render.js'),
        "update": require(gapPath + '/update.js')
    };
    new gapClassMgr_1.Gap(configObj);
}
exports.readGapDir = readGapDir;
;
/**
 * Generates gap include file for the client.
 * @return {string}
 */
function genIncludeFile() {
    var code = "var gapClassMgr = require('fg-js/client/gapClassMgr.js');";
    utils.objFor(gapClassTable, function (gap) {
        code += '\ngapClassMgr.regGap({\n'
            + '\t"name": "' + gap.name + '",\n'
            + '\t"path": "' + gap.path + '",\n'
            + '\t"render": require("' + gap.path + '/render.js"),\n'
            + '\t"update": require("' + gap.path + '/update.js"),\n'
            + '});';
    });
    return code;
}
exports.genIncludeFile = genIncludeFile;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FwU2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dhcFNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixJQUFZLEtBQUssV0FBTSxTQUFTLENBQUMsQ0FBQTtBQUNqQyxJQUFZLElBQUksV0FBTSxNQUFNLENBQUMsQ0FBQTtBQUU3Qiw0QkFBa0Isc0JBQXNCLENBQUMsQ0FBQTtBQUd6QyxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFFdkI7Ozs7OztHQU1HO0FBQ0gsZUFBc0IsR0FBYSxFQUFFLElBQVksRUFBRSxVQUFlO0lBQ2pFOzs7O1FBSUk7SUFDSixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksYUFBYSxDQUFDLENBQUEsQ0FBQztRQUM1QixJQUFJLEdBQUcsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBLENBQUM7WUFDVCxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNaLEtBQUssRUFBRSxHQUFHO2dCQUNWLE1BQU0sRUFBRSxJQUFJO2FBQ1osQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUFBLENBQUM7SUFDSCxDQUFDO0lBQUEsQ0FBQztJQUNGLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztRQUN2QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFTLElBQUk7WUFDNUQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzFCLENBQUMs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