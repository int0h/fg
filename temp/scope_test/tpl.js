module.exports = [
	"",
	{
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"basicScope"
			],
			"escaped": true
		},
		"content": [
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "div",
				"attrs": {

				},
				"content": [
					"repeat me 3 times"
				],
				"isScopeItem": true
			}
		],
		"eid": null
	},
	"",
	{
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"emptyScope"
			],
			"escaped": true
		},
		"content": [
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "div",
				"attrs": {
					"class": "mustNotBeHere"
				},
				"content": [

				],
				"isScopeItem": true
			}
		],
		"eid": null
	},
	"",
	{
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"noScope"
			],
			"escaped": true
		},
		"content": [
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "div",
				"attrs": {
					"class": "mustNotBeHere"
				},
				"content": [

				],
				"isScopeItem": true
			}
		],
		"eid": null
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {
			"class": "person"
		},
		"content": [
			{
				"type": "scope",
				"isVirtual": true,
				"path": {
					"source": "data",
					"path": [
						"person"
					],
					"escaped": true
				},
				"content": [
					{
						"type": "data",
						"isVirtual": false,
						"path": {
							"source": "data",
							"path": [
								"name"
							],
							"escaped": true
						},
						"eid": null
					},
					{
						"type": "data",
						"isVirtual": false,
						"path": {
							"source": "data",
							"path": [
								"dob"
							],
							"escaped": true
						},
						"eid": null
					}
				],
				"eid": null
			}
		],
		"isScopeHolder": true
	},
	"",
	{
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"nested"
			],
			"escaped": true
		},
		"content": [
			{
				"type": "dynamicText",
				"tpl": {
					"src": " Kind: #{kind}",
					"parts": [
						" Kind: ",
						""
					],
					"gaps": [
						{
							"source": "data",
							"path": [
								"kind"
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
			{
				"type": "scope",
				"isVirtual": true,
				"path": {
					"source": "data",
					"path": [
						"values"
					],
					"escaped": true
				},
				"content": [
					{
						"type": "raw",
						"isVirtual": false,
						"isRootNode": false,
						"tagName": "div",
						"attrs": {
							"class": "subScopeItem"
						},
						"content": [
							{
								"type": "data",
								"isVirtual": false,
								"path": {
									"source": "data",
									"path": [

									],
									"escaped": true
								},
								"eid": null
							}
						],
						"isScopeItem": true
					}
				],
				"eid": null
			}
		],
		"eid": null
	}
]