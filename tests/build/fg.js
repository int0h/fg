(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = [
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"inner text"
		]
	}
]
},{}],2:[function(require,module,exports){
module.exports = [
	""
]
},{}],3:[function(require,module,exports){
module.exports = [
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"inner text"
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"2nd inner text"
		]
	}
]
},{}],4:[function(require,module,exports){
module.exports = [
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"Hello"
		]
	}
]
},{}],5:[function(require,module,exports){
module.exports = [
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"hello world!"
		]
	}
]
},{}],6:[function(require,module,exports){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
				"parse": function (tpl, valueParseFn){
					var gapStrArr = tpl.match(gapRe);
					if (!gapStrArr){
						this.isString = true;
						this.parts = [tpl];
						return;
					};
					this.gaps = gapStrArr.map(function(part){
						var partValue = part.slice(2, -1);
						var partRes = valueParseFn(partValue);
						partRes.escaped = part[0] !== "!";
						return partRes;
					});		
					this.parts = tpl.split(gapRe);
					return this;
				},
				"render": function (valueRenderFn){
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
				"parse": function (tpl, valueParseFn){
					var gapStrArr = tpl.match(gapRe);
					if (!gapStrArr){
						this.isString = true;
						this.parts = [tpl];
						return;
					};
					this.gaps = gapStrArr.map(function(part){
						var partValue = part.slice(2, -1);
						var partRes = valueParseFn(partValue);
						partRes.escaped = part[0] !== "!";
						return partRes;
					});		
					this.parts = tpl.split(gapRe);
					return this;
				},
				"render": function (valueRenderFn){
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
				"parse": function (tpl, valueParseFn){
					var gapStrArr = tpl.match(gapRe);
					if (!gapStrArr){
						this.isString = true;
						this.parts = [tpl];
						return;
					};
					this.gaps = gapStrArr.map(function(part){
						var partValue = part.slice(2, -1);
						var partRes = valueParseFn(partValue);
						partRes.escaped = part[0] !== "!";
						return partRes;
					});		
					this.parts = tpl.split(gapRe);
					return this;
				},
				"render": function (valueRenderFn){
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
				"parse": function (tpl, valueParseFn){
					var gapStrArr = tpl.match(gapRe);
					if (!gapStrArr){
						this.isString = true;
						this.parts = [tpl];
						return;
					};
					this.gaps = gapStrArr.map(function(part){
						var partValue = part.slice(2, -1);
						var partRes = valueParseFn(partValue);
						partRes.escaped = part[0] !== "!";
						return partRes;
					});		
					this.parts = tpl.split(gapRe);
					return this;
				},
				"render": function (valueRenderFn){
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
},{}],7:[function(require,module,exports){
module.exports = [
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

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
			"class": "boo"
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
			"class": "boo"
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
			""
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {

		},
		"content": [
			"multi \n\tline \ntext\n"
		]
	}
]
},{}],8:[function(require,module,exports){
module.exports = [
	"",
	{
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"basicScope"
			]
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
			]
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
			]
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
					]
				},
				"content": [
					{
						"type": "data",
						"isVirtual": false,
						"path": {
							"source": "data",
							"path": [
								"name"
							]
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
							]
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
			]
		},
		"content": [
			{
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
					]
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

									]
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
},{}],9:[function(require,module,exports){
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
		"type": "scope",
		"isVirtual": true,
		"path": {
			"source": "data",
			"path": [
				"basicScope"
			]
		},
		"content": [
			{
				"type": "data",
				"isVirtual": false,
				"path": {
					"source": "data",
					"path": [

					]
				},
				"eid": null
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
			]
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
			]
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
					]
				},
				"content": [
					{
						"type": "data",
						"isVirtual": false,
						"path": {
							"source": "data",
							"path": [
								"name"
							]
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
							]
						},
						"eid": null
					}
				],
				"eid": null
			}
		],
		"isScopeHolder": true
	}
]
},{}],10:[function(require,module,exports){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
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
				"type": "dynamic-text",
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
					"parse": function (tpl, valueParseFn){
						var gapStrArr = tpl.match(gapRe);
						if (!gapStrArr){
							this.isString = true;
							this.parts = [tpl];
							return;
						};
						this.gaps = gapStrArr.map(function(part){
							var partValue = part.slice(2, -1);
							var partRes = valueParseFn(partValue);
							partRes.escaped = part[0] !== "!";
							return partRes;
						});		
						this.parts = tpl.split(gapRe);
						return this;
					},
					"render": function (valueRenderFn){
						var gaps = this.gaps.map(valueRenderFn);
						var parts = mixArrays(this.parts, gaps);
						return parts.join('');	
					}
				}
			}
		]
	}
]
},{}],11:[function(require,module,exports){
var fgs = [];

fgs.push({
	"name": "api_basic-basicFg",
	"tpl": require("./api_basic-basicFg/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic-emptyFg",
	"tpl": require("./api_basic-emptyFg/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic-multiRoot",
	"tpl": require("./api_basic-multiRoot/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "api_basic",
	"tpl": require("./api_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "basic",
	"tpl": require("./basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "escaping",
	"tpl": require("./escaping/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "parse_basic",
	"tpl": require("./parse_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "scope_test",
	"tpl": require("./scope_test/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "update_basic",
	"tpl": require("./update_basic/tpl.js"),
	"classFn": null
});
fgs.push({
	"name": "value_render",
	"tpl": require("./value_render/tpl.js"),
	"classFn": null
});

$fg.load(fgs);
},{"./api_basic-basicFg/tpl.js":1,"./api_basic-emptyFg/tpl.js":2,"./api_basic-multiRoot/tpl.js":3,"./api_basic/tpl.js":4,"./basic/tpl.js":5,"./escaping/tpl.js":6,"./parse_basic/tpl.js":7,"./scope_test/tpl.js":8,"./update_basic/tpl.js":9,"./value_render/tpl.js":10}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9mZy1qcy9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwidGVtcC9hcGlfYmFzaWMtYmFzaWNGZy90cGwuanMiLCJ0ZW1wL2FwaV9iYXNpYy1lbXB0eUZnL3RwbC5qcyIsInRlbXAvYXBpX2Jhc2ljLW11bHRpUm9vdC90cGwuanMiLCJ0ZW1wL2FwaV9iYXNpYy90cGwuanMiLCJ0ZW1wL2Jhc2ljL3RwbC5qcyIsInRlbXAvZXNjYXBpbmcvdHBsLmpzIiwidGVtcC9wYXJzZV9iYXNpYy90cGwuanMiLCJ0ZW1wL3Njb3BlX3Rlc3QvdHBsLmpzIiwidGVtcC91cGRhdGVfYmFzaWMvdHBsLmpzIiwidGVtcC92YWx1ZV9yZW5kZXIvdHBsLmpzIiwidGVtcC9pbmNsdWRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcImlubmVyIHRleHRcIlxuXHRcdF1cblx0fVxuXSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHRcIlwiXG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwiaW5uZXIgdGV4dFwiXG5cdFx0XVxuXHR9LFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcIjJuZCBpbm5lciB0ZXh0XCJcblx0XHRdXG5cdH1cbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XCJIZWxsb1wiXG5cdFx0XVxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwiaGVsbG8gd29ybGQhXCJcblx0XHRdXG5cdH1cbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcInZhbFwiXG5cdFx0XHRdLFxuXHRcdFx0XCJlc2NhcGVkXCI6IGZhbHNlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwidmFsXCJcblx0XHRcdF0sXG5cdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcImRhbmdlclwiXG5cdFx0XHRdLFxuXHRcdFx0XCJlc2NhcGVkXCI6IGZhbHNlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiZGFuZ2VyXCJcblx0XHRcdF0sXG5cdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJkeW5hbWljLXRleHRcIixcblx0XHRcdFx0XCJ0cGxcIjoge1xuXHRcdFx0XHRcdFwic3JjXCI6IFwiSGVsbG8gI3tkYW5nZXJ9IVwiLFxuXHRcdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFx0XCJIZWxsbyBcIixcblx0XHRcdFx0XHRcdFwiIVwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcImRhbmdlclwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWMtdGV4dFwiLFxuXHRcdFx0XHRcInRwbFwiOiB7XG5cdFx0XHRcdFx0XCJzcmNcIjogXCJIZWxsbyAhe2Rhbmdlcn0hXCIsXG5cdFx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XHRcIkhlbGxvIFwiLFxuXHRcdFx0XHRcdFx0XCIhXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwiZGFuZ2VyXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IGZhbHNlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiaW1nXCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImRhdGEtc3JjXCI6IHtcblx0XHRcdFx0XCJzcmNcIjogXCJ1cmwvI3tiYWRVcmx9XCIsXG5cdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFwidXJsL1wiLFxuXHRcdFx0XHRcdFwiXCJcblx0XHRcdFx0XSxcblx0XHRcdFx0XCJnYXBzXCI6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFwiYmFkVXJsXCJcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pe1xyXG5cdFx0XHRcdFx0dmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdHRoaXMuaXNTdHJpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHR0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uKHBhcnQpe1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0XHRcdHBhcnRSZXMuZXNjYXBlZCA9IHBhcnRbMF0gIT09IFwiIVwiO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdH0pO1x0XHRcclxuXHRcdFx0XHRcdHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0fSxcblx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pe1xyXG5cdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0dmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzLmpvaW4oJycpO1x0XHJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImltZ1wiLFxuXHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XCJkYXRhLXNyY1wiOiB7XG5cdFx0XHRcdFwic3JjXCI6IFwidXJsLyF7YmFkVXJsfVwiLFxuXHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcInVybC9cIixcblx0XHRcdFx0XHRcIlwiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcImJhZFVybFwiXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IGZhbHNlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHR2YXIgZ2FwU3RyQXJyID0gdHBsLm1hdGNoKGdhcFJlKTtcclxuXHRcdFx0XHRcdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24ocGFydCl7XHJcblx0XHRcdFx0XHRcdHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0cGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcInJlbmRlclwiOiBmdW5jdGlvbiAodmFsdWVSZW5kZXJGbil7XHJcblx0XHRcdFx0XHR2YXIgZ2FwcyA9IHRoaXMuZ2Fwcy5tYXAodmFsdWVSZW5kZXJGbik7XHJcblx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRyZXR1cm4gcGFydHMuam9pbignJyk7XHRcclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiaW1nXCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImRhdGEtc3JjXCI6IHtcblx0XHRcdFx0XCJzcmNcIjogXCIje2JhZFVybH1cIixcblx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcIlwiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcImJhZFVybFwiXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKXtcclxuXHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0aWYgKCFnYXBTdHJBcnIpe1xyXG5cdFx0XHRcdFx0XHR0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0dmFyIHBhcnRWYWx1ZSA9IHBhcnQuc2xpY2UoMiwgLTEpO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHBhcnRSZXM7XHJcblx0XHRcdFx0XHR9KTtcdFx0XHJcblx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHRcdHZhciBwYXJ0cyA9IG1peEFycmF5cyh0aGlzLnBhcnRzLCBnYXBzKTtcclxuXHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJpbWdcIixcblx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFwiZGF0YS1zcmNcIjoge1xuXHRcdFx0XHRcInNyY1wiOiBcIiF7YmFkVXJsfVwiLFxuXHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcdFwiXCJcblx0XHRcdFx0XSxcblx0XHRcdFx0XCJnYXBzXCI6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFwiYmFkVXJsXCJcblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogZmFsc2Vcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKXtcclxuXHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0aWYgKCFnYXBTdHJBcnIpe1xyXG5cdFx0XHRcdFx0XHR0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0dmFyIHBhcnRWYWx1ZSA9IHBhcnQuc2xpY2UoMiwgLTEpO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHBhcnRSZXM7XHJcblx0XHRcdFx0XHR9KTtcdFx0XHJcblx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHRcdHZhciBwYXJ0cyA9IG1peEFycmF5cyh0aGlzLnBhcnRzLCBnYXBzKTtcclxuXHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH1cbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImNsYXNzXCI6IFwiYm9vXCJcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFwiY2xhc3NcIjogXCJib29cIlxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XCJcIlxuXHRcdF1cblx0fSxcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XCJtdWx0aSBcXG5cXHRsaW5lIFxcbnRleHRcXG5cIlxuXHRcdF1cblx0fVxuXSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiYmFzaWNTY29wZVwiXG5cdFx0XHRdXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0XCJyZXBlYXQgbWUgMyB0aW1lc1wiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiZW1wdHlTY29wZVwiXG5cdFx0XHRdXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XHRcdFwiY2xhc3NcIjogXCJtdXN0Tm90QmVIZXJlXCJcblx0XHRcdFx0fSxcblx0XHRcdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImlzU2NvcGVJdGVtXCI6IHRydWVcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcIm5vU2NvcGVcIlxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcImlzUm9vdE5vZGVcIjogZmFsc2UsXG5cdFx0XHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFx0XHRcImNsYXNzXCI6IFwibXVzdE5vdEJlSGVyZVwiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJpc1Njb3BlSXRlbVwiOiB0cnVlXG5cdFx0XHR9XG5cdFx0XSxcblx0XHRcImVpZFwiOiBudWxsXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFwiY2xhc3NcIjogXCJwZXJzb25cIlxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcdFx0XCJwYXRoXCI6IHtcblx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XCJwZXJzb25cIlxuXHRcdFx0XHRcdF1cblx0XHRcdFx0fSxcblx0XHRcdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwibmFtZVwiXG5cdFx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwiZG9iXCJcblx0XHRcdFx0XHRcdFx0XVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiaXNTY29wZUhvbGRlclwiOiB0cnVlXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJzY29wZVwiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJuZXN0ZWRcIlxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZHluYW1pYy10ZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIiBLaW5kOiAje2tpbmR9XCIsXG5cdFx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XHRcIiBLaW5kOiBcIixcblx0XHRcdFx0XHRcdFwiXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwia2luZFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJzY29wZVwiLFxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcInZhbHVlc1wiXG5cdFx0XHRcdFx0XVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcImlzUm9vdE5vZGVcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcdFx0XHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XHRcdFx0XHRcImNsYXNzXCI6IFwic3ViU2NvcGVJdGVtXCJcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cblx0XHRcdFx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJlaWRcIjogbnVsbFxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJ2YWxcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiYmFzaWNTY29wZVwiXG5cdFx0XHRdXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cblx0XHRcdFx0XHRdXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcImVtcHR5U2NvcGVcIlxuXHRcdFx0XVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcImlzUm9vdE5vZGVcIjogZmFsc2UsXG5cdFx0XHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFx0XHRcImNsYXNzXCI6IFwibXVzdE5vdEJlSGVyZVwiXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJpc1Njb3BlSXRlbVwiOiB0cnVlXG5cdFx0XHR9XG5cdFx0XSxcblx0XHRcImVpZFwiOiBudWxsXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJzY29wZVwiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJub1Njb3BlXCJcblx0XHRcdF1cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJpc1Jvb3ROb2RlXCI6IGZhbHNlLFxuXHRcdFx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcdFx0XCJjbGFzc1wiOiBcIm11c3ROb3RCZUhlcmVcIlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImNsYXNzXCI6IFwicGVyc29uXCJcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFwicGVyc29uXCJcblx0XHRcdFx0XHRdXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcIm5hbWVcIlxuXHRcdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XCJlaWRcIjogbnVsbFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcImRvYlwiXG5cdFx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHR9XG5cdFx0XSxcblx0XHRcImlzU2NvcGVIb2xkZXJcIjogdHJ1ZVxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJ2YWxcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWMtdGV4dFwiLFxuXHRcdFx0XHRcInRwbFwiOiB7XG5cdFx0XHRcdFx0XCJzcmNcIjogXCIje3ZhbH1cIixcblx0XHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XHRcIlwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWMtdGV4dFwiLFxuXHRcdFx0XHRcInRwbFwiOiB7XG5cdFx0XHRcdFx0XCJzcmNcIjogXCJIZWxsbyAje3ZhbH0hXCIsXG5cdFx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XHRcIkhlbGxvIFwiLFxuXHRcdFx0XHRcdFx0XCIhXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHRcdGlmICghZ2FwU3RyQXJyKXtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0XHR0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uKHBhcnQpe1xyXG5cdFx0XHRcdFx0XHRcdHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRcdHBhcnRSZXMuZXNjYXBlZCA9IHBhcnRbMF0gIT09IFwiIVwiO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0XHR9KTtcdFx0XHJcblx0XHRcdFx0XHRcdHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pe1xyXG5cdFx0XHRcdFx0XHR2YXIgZ2FwcyA9IHRoaXMuZ2Fwcy5tYXAodmFsdWVSZW5kZXJGbik7XHJcblx0XHRcdFx0XHRcdHZhciBwYXJ0cyA9IG1peEFycmF5cyh0aGlzLnBhcnRzLCBnYXBzKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHBhcnRzLmpvaW4oJycpO1x0XHJcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZHluYW1pYy10ZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIkhlbGxvICN7dmFsfSEgI3t2YWx9IGlzIGdyZWF0ISBJJ2QgbGlrZSB0byBsaXZlIGluICN7dmFsfSFcIixcblx0XHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcdFwiSGVsbG8gXCIsXG5cdFx0XHRcdFx0XHRcIiEgXCIsXG5cdFx0XHRcdFx0XHRcIiBpcyBncmVhdCEgSSdkIGxpa2UgdG8gbGl2ZSBpbiBcIixcblx0XHRcdFx0XHRcdFwiIVwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWMtdGV4dFwiLFxuXHRcdFx0XHRcInRwbFwiOiB7XG5cdFx0XHRcdFx0XCJzcmNcIjogXCJJJ20gdGhlIGNyZWF0b3Igb2YgdGhlICN7dmFsfSFcXG5IZWxsbyAje3ZhbH0hXFxuXCIsXG5cdFx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XHRcIkknbSB0aGUgY3JlYXRvciBvZiB0aGUgXCIsXG5cdFx0XHRcdFx0XHRcIiFcXG5IZWxsbyBcIixcblx0XHRcdFx0XHRcdFwiIVxcblwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcInZhbFwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbil7XHJcblx0XHRcdFx0XHRcdHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0XHRpZiAoIWdhcFN0ckFycil7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdFx0dGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbihwYXJ0KXtcclxuXHRcdFx0XHRcdFx0XHR2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHRcdFx0XHRwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdFx0fSk7XHRcdFxyXG5cdFx0XHRcdFx0XHR0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKXtcclxuXHRcdFx0XHRcdFx0dmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0XHR2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHRcdHJldHVybiBwYXJ0cy5qb2luKCcnKTtcdFxyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9XG5dIiwidmFyIGZncyA9IFtdO1xuXG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcImFwaV9iYXNpYy1iYXNpY0ZnXCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL2FwaV9iYXNpYy1iYXNpY0ZnL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJhcGlfYmFzaWMtZW1wdHlGZ1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9hcGlfYmFzaWMtZW1wdHlGZy90cGwuanNcIiksXG5cdFwiY2xhc3NGblwiOiBudWxsXG59KTtcbmZncy5wdXNoKHtcblx0XCJuYW1lXCI6IFwiYXBpX2Jhc2ljLW11bHRpUm9vdFwiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9hcGlfYmFzaWMtbXVsdGlSb290L3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJhcGlfYmFzaWNcIixcblx0XCJ0cGxcIjogcmVxdWlyZShcIi4vYXBpX2Jhc2ljL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJiYXNpY1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9iYXNpYy90cGwuanNcIiksXG5cdFwiY2xhc3NGblwiOiBudWxsXG59KTtcbmZncy5wdXNoKHtcblx0XCJuYW1lXCI6IFwiZXNjYXBpbmdcIixcblx0XCJ0cGxcIjogcmVxdWlyZShcIi4vZXNjYXBpbmcvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInBhcnNlX2Jhc2ljXCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL3BhcnNlX2Jhc2ljL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJzY29wZV90ZXN0XCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL3Njb3BlX3Rlc3QvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInVwZGF0ZV9iYXNpY1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi91cGRhdGVfYmFzaWMvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInZhbHVlX3JlbmRlclwiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi92YWx1ZV9yZW5kZXIvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5cbiRmZy5sb2FkKGZncyk7Il19
