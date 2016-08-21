var gapClassMgr = require('fg-js/client/gapClass.js');
gapClassMgr.regGap({
	"name": "content",
	"path": "../gaps/content",
	"render": require("../gaps/content/render.js"),
	"update": require("../gaps/content/update.js"),
});
gapClassMgr.regGap({
	"name": "data",
	"path": "../gaps/data",
	"render": require("../gaps/data/render.js"),
	"update": require("../gaps/data/update.js"),
});
gapClassMgr.regGap({
	"name": "dynamic-text",
	"path": "../gaps/dynamic-text",
	"render": require("../gaps/dynamic-text/render.js"),
	"update": require("../gaps/dynamic-text/update.js"),
});
gapClassMgr.regGap({
	"name": "fg",
	"path": "../gaps/fg",
	"render": require("../gaps/fg/render.js"),
	"update": require("../gaps/fg/update.js"),
});
gapClassMgr.regGap({
	"name": "raw",
	"path": "../gaps/raw",
	"render": require("../gaps/raw/render.js"),
	"update": require("../gaps/raw/update.js"),
});
gapClassMgr.regGap({
	"name": "scope",
	"path": "../gaps/scope",
	"render": require("../gaps/scope/render.js"),
	"update": require("../gaps/scope/update.js"),
});
gapClassMgr.regGap({
	"name": "scope-item",
	"path": "../gaps/scope-item",
	"render": require("../gaps/scope-item/render.js"),
	"update": require("../gaps/scope-item/update.js"),
});