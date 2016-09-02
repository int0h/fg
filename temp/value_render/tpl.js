module.exports = [
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"path": {
			"source": "data",
			"path": [
				"val"
			],
			"escaped": true
		},
		"content": [

		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			{
				"type": "dynamicText",
				"tpl": {
					"src": "#{val}",
					"parts": [
						"",
						""
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						}
					],
					"parse": function (tpl, valueParseFn) {
					        var gapStrArr = tpl.match(gapRe);
					        if (!gapStrArr) {
					            this.isString = true;
					            this.parts = [tpl];
					            return;
					        }
					        ;
					        this.gaps = gapStrArr.map(function (part) {
					            var partValue = part.slice(2, -1);
					            var partRes = valueParseFn(partValue);
					            partRes.escaped = part[0] !== "!";
					            return partRes;
					        });
					        this.parts = tpl.split(gapRe);
					        return this;
					    },
					"render": function (valueRenderFn) {
					        var gaps = this.gaps.map(valueRenderFn);
					        var parts = mixArrays(this.parts, gaps);
					        return parts.join('');
					    }
				}
			}
		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			{
				"type": "dynamicText",
				"tpl": {
					"src": "Hello #{val}!",
					"parts": [
						"Hello ",
						"!"
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						}
					],
					"parse": function (tpl, valueParseFn) {
					        var gapStrArr = tpl.match(gapRe);
					        if (!gapStrArr) {
					            this.isString = true;
					            this.parts = [tpl];
					            return;
					        }
					        ;
					        this.gaps = gapStrArr.map(function (part) {
					            var partValue = part.slice(2, -1);
					            var partRes = valueParseFn(partValue);
					            partRes.escaped = part[0] !== "!";
					            return partRes;
					        });
					        this.parts = tpl.split(gapRe);
					        return this;
					    },
					"render": function (valueRenderFn) {
					        var gaps = this.gaps.map(valueRenderFn);
					        var parts = mixArrays(this.parts, gaps);
					        return parts.join('');
					    }
				}
			}
		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			{
				"type": "dynamicText",
				"tpl": {
					"src": "Hello #{val}! #{val} is great! I'd like to live in #{val}!",
					"parts": [
						"Hello ",
						"! ",
						" is great! I'd like to live in ",
						"!"
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						},
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						},
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						}
					],
					"parse": function (tpl, valueParseFn) {
					        var gapStrArr = tpl.match(gapRe);
					        if (!gapStrArr) {
					            this.isString = true;
					            this.parts = [tpl];
					            return;
					        }
					        ;
					        this.gaps = gapStrArr.map(function (part) {
					            var partValue = part.slice(2, -1);
					            var partRes = valueParseFn(partValue);
					            partRes.escaped = part[0] !== "!";
					            return partRes;
					        });
					        this.parts = tpl.split(gapRe);
					        return this;
					    },
					"render": function (valueRenderFn) {
					        var gaps = this.gaps.map(valueRenderFn);
					        var parts = mixArrays(this.parts, gaps);
					        return parts.join('');
					    }
				}
			}
		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			{
				"type": "dynamicText",
				"tpl": {
					"src": "I'm the creator of the #{val}!\nHello #{val}!\n",
					"parts": [
						"I'm the creator of the ",
						"!\nHello ",
						"!\n"
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						},
						{
							"source": "data",
							"path": [
								"val"
							],
							"escaped": true
						}
					],
					"parse": function (tpl, valueParseFn) {
					        var gapStrArr = tpl.match(gapRe);
					        if (!gapStrArr) {
					            this.isString = true;
					            this.parts = [tpl];
					            return;
					        }
					        ;
					        this.gaps = gapStrArr.map(function (part) {
					            var partValue = part.slice(2, -1);
					            var partRes = valueParseFn(partValue);
					            partRes.escaped = part[0] !== "!";
					            return partRes;
					        });
					        this.parts = tpl.split(gapRe);
					        return this;
					    },
					"render": function (valueRenderFn) {
					        var gaps = this.gaps.map(valueRenderFn);
					        var parts = mixArrays(this.parts, gaps);
					        return parts.join('');
					    }
				}
			}
		]
	}
]