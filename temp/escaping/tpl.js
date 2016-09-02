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
			"escaped": false
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
		"path": {
			"source": "data",
			"path": [
				"danger"
			],
			"escaped": false
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
		"path": {
			"source": "data",
			"path": [
				"danger"
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
					"src": "Hello #{danger}!",
					"parts": [
						"Hello ",
						"!"
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"danger"
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
					"src": "Hello !{danger}!",
					"parts": [
						"Hello ",
						"!"
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"danger"
							],
							"escaped": false
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
		"tagName": "img",
		"attrs": {
			"data-src": {
				"src": "url/#{badUrl}",
				"parts": [
					"url/",
					""
				],
				"gaps": [
					{
						"source": "data",
						"path": [
							"badUrl"
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
		},
		"content": [

		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "img",
		"attrs": {
			"data-src": {
				"src": "url/!{badUrl}",
				"parts": [
					"url/",
					""
				],
				"gaps": [
					{
						"source": "data",
						"path": [
							"badUrl"
						],
						"escaped": false
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
		},
		"content": [

		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "img",
		"attrs": {
			"data-src": {
				"src": "#{badUrl}",
				"parts": [
					"",
					""
				],
				"gaps": [
					{
						"source": "data",
						"path": [
							"badUrl"
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
		},
		"content": [

		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "img",
		"attrs": {
			"data-src": {
				"src": "!{badUrl}",
				"parts": [
					"",
					""
				],
				"gaps": [
					{
						"source": "data",
						"path": [
							"badUrl"
						],
						"escaped": false
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
		},
		"content": [

		]
	}
]