(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = [
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "inner text"
        ]
    }
];
},{}],2:[function(require,module,exports){
module.exports = [
    ""
];
},{}],3:[function(require,module,exports){
module.exports = [
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "inner text"
        ]
    },
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "2nd inner text"
        ]
    }
];
},{}],4:[function(require,module,exports){
module.exports = [
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "Hello"
        ]
    }
];
},{}],5:[function(require,module,exports){
module.exports = [
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "hello world!"
        ]
    }
];
},{}],6:[function(require,module,exports){
module.exports = [
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "val"
            ],
            "escaped": false
        },
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "val"
            ],
            "escaped": true
        },
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "danger"
            ],
            "escaped": false
        },
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "danger"
            ],
            "escaped": true
        },
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
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
        "attrs": {},
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
        "content": []
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
        "content": []
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
        "content": []
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
        "content": []
    }
];
},{}],7:[function(require,module,exports){
module.exports = [
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": []
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
        "content": []
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
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            ""
        ]
    },
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "content": [
            "multi \n\tline \ntext\n"
        ]
    }
];
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
            ],
            "escaped": true
        },
        "content": [
            {
                "type": "raw",
                "isVirtual": false,
                "isRootNode": false,
                "tagName": "div",
                "attrs": {},
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
                "content": [],
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
                "content": [],
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
                                    "path": [],
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
];
},{}],9:[function(require,module,exports){
module.exports = [
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "val"
            ],
            "escaped": true
        },
        "content": []
    },
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
                "type": "data",
                "isVirtual": false,
                "path": {
                    "source": "data",
                    "path": [],
                    "escaped": true
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
                "content": [],
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
                "content": [],
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
    }
];
},{}],10:[function(require,module,exports){
module.exports = [
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
        "path": {
            "source": "data",
            "path": [
                "val"
            ],
            "escaped": true
        },
        "content": []
    },
    "",
    {
        "type": "raw",
        "isVirtual": false,
        "isRootNode": true,
        "tagName": "div",
        "attrs": {},
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
        "attrs": {},
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
        "attrs": {},
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
        "attrs": {},
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
];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0ZW1wL2FwaV9iYXNpYy1iYXNpY0ZnL3RwbC5qcyIsInRlbXAvYXBpX2Jhc2ljLWVtcHR5RmcvdHBsLmpzIiwidGVtcC9hcGlfYmFzaWMtbXVsdGlSb290L3RwbC5qcyIsInRlbXAvYXBpX2Jhc2ljL3RwbC5qcyIsInRlbXAvYmFzaWMvdHBsLmpzIiwidGVtcC9lc2NhcGluZy90cGwuanMiLCJ0ZW1wL3BhcnNlX2Jhc2ljL3RwbC5qcyIsInRlbXAvc2NvcGVfdGVzdC90cGwuanMiLCJ0ZW1wL3VwZGF0ZV9iYXNpYy90cGwuanMiLCJ0ZW1wL3ZhbHVlX3JlbmRlci90cGwuanMiLCJ0ZW1wL2luY2x1ZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2hCO1FBQ0MsTUFBTSxFQUFFLEtBQUs7UUFDYixXQUFXLEVBQUUsS0FBSztRQUNsQixZQUFZLEVBQUUsSUFBSTtRQUNsQixTQUFTLEVBQUUsS0FBSztRQUNoQixPQUFPLEVBQUUsRUFFUjtRQUNELFNBQVMsRUFBRTtZQUNWLFlBQVk7U0FDWjtLQUNEO0NBQ0QsQ0FBQTs7QUNiRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2hCLEVBQUU7Q0FDRixDQUFBOztBQ0ZELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDaEI7UUFDQyxNQUFNLEVBQUUsS0FBSztRQUNiLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLE9BQU8sRUFBRSxFQUVSO1FBQ0QsU0FBUyxFQUFFO1lBQ1YsWUFBWTtTQUNaO0tBQ0Q7SUFDRDtRQUNDLE1BQU0sRUFBRSxLQUFLO1FBQ2IsV0FBVyxFQUFFLEtBQUs7UUFDbEIsWUFBWSxFQUFFLElBQUk7UUFDbEIsU0FBUyxFQUFFLEtBQUs7UUFDaEIsT0FBTyxF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Q0FBQztJQUNSLE1BQU0sRUFBRSxVQUFVO0lBQ2xCLEtBQUssRUFBRSxPQUFPLENBQUMsbUJBQW1CLENBQUM7SUFDbkMsU0FBUyxFQUFFLElBQUk7Q0FDZixDQUFDLENBQUM7QUFDSCxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ1IsTUFBTSxFQUFFLGFBQWE7SUFDckIsS0FBSyxFQUFFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQztJQUN0QyxTQUFTLEVBQUUsSUFBSTtDQUNmLENBQUMsQ0FBQztBQUNILEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDUixNQUFNLEVBQUUsWUFBWTtJQUNwQixLQUFLLEVBQUUsT0FBTyxDQUFDLHFCQUFxQixDQUFDO0lBQ3JDLFNBQVMsRUFBRSxJQUFJO0NBQ2YsQ0FBQyxDQUFDO0FBQ0gsR0FBRyxDQUFDLElBQUksQ0FBQztJQUNSLE1BQU0sRUFBRSxjQUFjO0lBQ3RCLEtBQUssRUFBRSxPQUFPLENBQUMsdUJBQXVCLENBQUM7SUFDdkMsU0FBUyxFQUFFLElBQUk7Q0FDZixDQUFDLENBQUM7QUFDSCxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ1IsTUFBTSxFQUFFLGNBQWM7SUFDdEIsS0FBSyxFQUFFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQztJQUN2QyxTQUFTLEVBQUUsSUFBSTtDQUNmLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwiaW5uZXIgdGV4dFwiXG5cdFx0XVxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdFwiXCJcbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XCJpbm5lciB0ZXh0XCJcblx0XHRdXG5cdH0sXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwiMm5kIGlubmVyIHRleHRcIlxuXHRcdF1cblx0fVxuXSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcIkhlbGxvXCJcblx0XHRdXG5cdH1cbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XCJoZWxsbyB3b3JsZCFcIlxuXHRcdF1cblx0fVxuXSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwidmFsXCJcblx0XHRcdF0sXG5cdFx0XHRcImVzY2FwZWRcIjogZmFsc2Vcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJ2YWxcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiZGFuZ2VyXCJcblx0XHRcdF0sXG5cdFx0XHRcImVzY2FwZWRcIjogZmFsc2Vcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJkYW5nZXJcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWNUZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIkhlbGxvICN7ZGFuZ2VyfSFcIixcblx0XHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcdFwiSGVsbG8gXCIsXG5cdFx0XHRcdFx0XHRcIiFcIlxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJnYXBzXCI6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFx0XCJkYW5nZXJcIlxuXHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIGlmICghZ2FwU3RyQXJyKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybjtcclxuXHRcdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdFx0ICAgICAgICA7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICBwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHRcdCAgICAgICAgdGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdFx0ICAgIH0sXG5cdFx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0ICAgICAgICB2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcnKTtcclxuXHRcdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZHluYW1pY1RleHRcIixcblx0XHRcdFx0XCJ0cGxcIjoge1xuXHRcdFx0XHRcdFwic3JjXCI6IFwiSGVsbG8gIXtkYW5nZXJ9IVwiLFxuXHRcdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFx0XCJIZWxsbyBcIixcblx0XHRcdFx0XHRcdFwiIVwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcImRhbmdlclwiXG5cdFx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiBmYWxzZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIGlmICghZ2FwU3RyQXJyKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybjtcclxuXHRcdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdFx0ICAgICAgICA7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICBwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHRcdCAgICAgICAgdGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdFx0ICAgIH0sXG5cdFx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0ICAgICAgICB2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcnKTtcclxuXHRcdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJpbWdcIixcblx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFwiZGF0YS1zcmNcIjoge1xuXHRcdFx0XHRcInNyY1wiOiBcInVybC8je2JhZFVybH1cIixcblx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XCJ1cmwvXCIsXG5cdFx0XHRcdFx0XCJcIlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XCJiYWRVcmxcIlxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcInBhcnNlXCI6IGZ1bmN0aW9uICh0cGwsIHZhbHVlUGFyc2VGbikge1xyXG5cdFx0XHRcdCAgICAgICAgdmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0ICAgICAgICBpZiAoIWdhcFN0ckFycikge1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHRoaXMuaXNTdHJpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHQgICAgICAgICAgICByZXR1cm47XHJcblx0XHRcdFx0ICAgICAgICB9XHJcblx0XHRcdFx0ICAgICAgICA7XHJcblx0XHRcdFx0ICAgICAgICB0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgdmFyIHBhcnRWYWx1ZSA9IHBhcnQuc2xpY2UoMiwgLTEpO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0ICAgICAgICAgICAgcGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdFx0ICAgICAgICAgICAgcmV0dXJuIHBhcnRSZXM7XHJcblx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHQgICAgICAgIHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdCAgICAgICAgcmV0dXJuIHRoaXM7XHJcblx0XHRcdFx0ICAgIH0sXG5cdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKSB7XHJcblx0XHRcdFx0ICAgICAgICB2YXIgZ2FwcyA9IHRoaXMuZ2Fwcy5tYXAodmFsdWVSZW5kZXJGbik7XHJcblx0XHRcdFx0ICAgICAgICB2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0ICAgICAgICByZXR1cm4gcGFydHMuam9pbignJyk7XHJcblx0XHRcdFx0ICAgIH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJpbWdcIixcblx0XHRcImF0dHJzXCI6IHtcblx0XHRcdFwiZGF0YS1zcmNcIjoge1xuXHRcdFx0XHRcInNyY1wiOiBcInVybC8he2JhZFVybH1cIixcblx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XCJ1cmwvXCIsXG5cdFx0XHRcdFx0XCJcIlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XCJiYWRVcmxcIlxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHQgICAgICAgIHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdCAgICAgICAgaWYgKCFnYXBTdHJBcnIpIHtcclxuXHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHQgICAgICAgICAgICB0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0ICAgICAgICAgICAgcmV0dXJuO1xyXG5cdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdCAgICAgICAgO1xyXG5cdFx0XHRcdCAgICAgICAgdGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbiAocGFydCkge1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHBhcnRSZXMuZXNjYXBlZCA9IHBhcnRbMF0gIT09IFwiIVwiO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdCAgICAgICAgfSk7XHJcblx0XHRcdFx0ICAgICAgICB0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdCAgICB9LFxuXHRcdFx0XHRcInJlbmRlclwiOiBmdW5jdGlvbiAodmFsdWVSZW5kZXJGbikge1xyXG5cdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdCAgICAgICAgdmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdCAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xyXG5cdFx0XHRcdCAgICB9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiaW1nXCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImRhdGEtc3JjXCI6IHtcblx0XHRcdFx0XCJzcmNcIjogXCIje2JhZFVybH1cIixcblx0XHRcdFx0XCJwYXJ0c1wiOiBbXG5cdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcIlwiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcImJhZFVybFwiXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKSB7XHJcblx0XHRcdFx0ICAgICAgICB2YXIgZ2FwU3RyQXJyID0gdHBsLm1hdGNoKGdhcFJlKTtcclxuXHRcdFx0XHQgICAgICAgIGlmICghZ2FwU3RyQXJyKSB7XHJcblx0XHRcdFx0ICAgICAgICAgICAgdGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0ICAgICAgICAgICAgdGhpcy5wYXJ0cyA9IFt0cGxdO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHJldHVybjtcclxuXHRcdFx0XHQgICAgICAgIH1cclxuXHRcdFx0XHQgICAgICAgIDtcclxuXHRcdFx0XHQgICAgICAgIHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcclxuXHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0ICAgICAgICAgICAgdmFyIHBhcnRSZXMgPSB2YWx1ZVBhcnNlRm4ocGFydFZhbHVlKTtcclxuXHRcdFx0XHQgICAgICAgICAgICBwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHQgICAgICAgICAgICByZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHQgICAgICAgIH0pO1xyXG5cdFx0XHRcdCAgICAgICAgdGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0ICAgICAgICByZXR1cm4gdGhpcztcclxuXHRcdFx0XHQgICAgfSxcblx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pIHtcclxuXHRcdFx0XHQgICAgICAgIHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHQgICAgICAgIHZhciBwYXJ0cyA9IG1peEFycmF5cyh0aGlzLnBhcnRzLCBnYXBzKTtcclxuXHRcdFx0XHQgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcnKTtcclxuXHRcdFx0XHQgICAgfVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImltZ1wiLFxuXHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XCJkYXRhLXNyY1wiOiB7XG5cdFx0XHRcdFwic3JjXCI6IFwiIXtiYWRVcmx9XCIsXG5cdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFwiXCIsXG5cdFx0XHRcdFx0XCJcIlxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XCJiYWRVcmxcIlxuXHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiBmYWxzZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XSxcblx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHQgICAgICAgIHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdCAgICAgICAgaWYgKCFnYXBTdHJBcnIpIHtcclxuXHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHQgICAgICAgICAgICB0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0ICAgICAgICAgICAgcmV0dXJuO1xyXG5cdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdCAgICAgICAgO1xyXG5cdFx0XHRcdCAgICAgICAgdGhpcy5nYXBzID0gZ2FwU3RyQXJyLm1hcChmdW5jdGlvbiAocGFydCkge1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHBhcnRSZXMuZXNjYXBlZCA9IHBhcnRbMF0gIT09IFwiIVwiO1xyXG5cdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdCAgICAgICAgfSk7XHJcblx0XHRcdFx0ICAgICAgICB0aGlzLnBhcnRzID0gdHBsLnNwbGl0KGdhcFJlKTtcclxuXHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdCAgICB9LFxuXHRcdFx0XHRcInJlbmRlclwiOiBmdW5jdGlvbiAodmFsdWVSZW5kZXJGbikge1xyXG5cdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdCAgICAgICAgdmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdCAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJycpO1xyXG5cdFx0XHRcdCAgICB9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XCJjbGFzc1wiOiBcImJvb1wiXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImNsYXNzXCI6IFwiYm9vXCJcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwiXCJcblx0XHRdXG5cdH0sXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdFwibXVsdGkgXFxuXFx0bGluZSBcXG50ZXh0XFxuXCJcblx0XHRdXG5cdH1cbl0iLCJtb2R1bGUuZXhwb3J0cyA9IFtcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcImJhc2ljU2NvcGVcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XHRcdFwiYXR0cnNcIjoge1xuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0XCJyZXBlYXQgbWUgMyB0aW1lc1wiXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwiZW1wdHlTY29wZVwiXG5cdFx0XHRdLFxuXHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJpc1Jvb3ROb2RlXCI6IGZhbHNlLFxuXHRcdFx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcdFx0XCJjbGFzc1wiOiBcIm11c3ROb3RCZUhlcmVcIlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwic2NvcGVcIixcblx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwibm9TY29wZVwiXG5cdFx0XHRdLFxuXHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XCJpc1Jvb3ROb2RlXCI6IGZhbHNlLFxuXHRcdFx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcdFx0XCJjbGFzc1wiOiBcIm11c3ROb3RCZUhlcmVcIlxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiaXNTY29wZUl0ZW1cIjogdHJ1ZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0XCJlaWRcIjogbnVsbFxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcImNsYXNzXCI6IFwicGVyc29uXCJcblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFwicGVyc29uXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJ0eXBlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcIm5hbWVcIlxuXHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwidHlwZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XCJwYXRoXCI6IHtcblx0XHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFx0XCJkb2JcIlxuXHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiaXNTY29wZUhvbGRlclwiOiB0cnVlXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJzY29wZVwiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJuZXN0ZWRcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJkeW5hbWljVGV4dFwiLFxuXHRcdFx0XHRcInRwbFwiOiB7XG5cdFx0XHRcdFx0XCJzcmNcIjogXCIgS2luZDogI3traW5kfVwiLFxuXHRcdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFx0XCIgS2luZDogXCIsXG5cdFx0XHRcdFx0XHRcIlwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImdhcHNcIjogW1xuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFx0XHRcImtpbmRcIlxuXHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIGlmICghZ2FwU3RyQXJyKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybjtcclxuXHRcdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdFx0ICAgICAgICA7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICBwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHRcdCAgICAgICAgdGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdFx0ICAgIH0sXG5cdFx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0ICAgICAgICB2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcnKTtcclxuXHRcdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IHRydWUsXG5cdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XHRcdFwidmFsdWVzXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFx0XHRcdFx0XCJhdHRyc1wiOiB7XG5cdFx0XHRcdFx0XHRcdFwiY2xhc3NcIjogXCJzdWJTY29wZUl0ZW1cIlxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XCJwYXRoXCI6IFtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XHRcImlzU2NvcGVJdGVtXCI6IHRydWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdF0sXG5cdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fVxuXSIsIm1vZHVsZS5leHBvcnRzID0gW1xuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcInNvdXJjZVwiOiBcImRhdGFcIixcblx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFwidmFsXCJcblx0XHRcdF0sXG5cdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdF1cblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcImJhc2ljU2NvcGVcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0XHRcdH0sXG5cdFx0XHRcdFwiZWlkXCI6IG51bGxcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcImVtcHR5U2NvcGVcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XHRcdFwiY2xhc3NcIjogXCJtdXN0Tm90QmVIZXJlXCJcblx0XHRcdFx0fSxcblx0XHRcdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImlzU2NvcGVJdGVtXCI6IHRydWVcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInNjb3BlXCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogdHJ1ZSxcblx0XHRcInBhdGhcIjoge1xuXHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcIm5vU2NvcGVcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XHRcdFwiaXNSb290Tm9kZVwiOiBmYWxzZSxcblx0XHRcdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XHRcdFwiY2xhc3NcIjogXCJtdXN0Tm90QmVIZXJlXCJcblx0XHRcdFx0fSxcblx0XHRcdFx0XCJjb250ZW50XCI6IFtcblxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImlzU2NvcGVJdGVtXCI6IHRydWVcblx0XHRcdH1cblx0XHRdLFxuXHRcdFwiZWlkXCI6IG51bGxcblx0fSxcblx0XCJcIixcblx0e1xuXHRcdFwidHlwZVwiOiBcInJhd1wiLFxuXHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFwiaXNSb290Tm9kZVwiOiB0cnVlLFxuXHRcdFwidGFnTmFtZVwiOiBcImRpdlwiLFxuXHRcdFwiYXR0cnNcIjoge1xuXHRcdFx0XCJjbGFzc1wiOiBcInBlcnNvblwiXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0e1xuXHRcdFx0XHRcInR5cGVcIjogXCJzY29wZVwiLFxuXHRcdFx0XHRcImlzVmlydHVhbFwiOiB0cnVlLFxuXHRcdFx0XHRcInBhdGhcIjoge1xuXHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcInBlcnNvblwiXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRcImNvbnRlbnRcIjogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFwidHlwZVwiOiBcImRhdGFcIixcblx0XHRcdFx0XHRcdFwiaXNWaXJ0dWFsXCI6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XCJwYXRoXCI6IHtcblx0XHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFx0XCJuYW1lXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcInR5cGVcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcdFx0XHRcdFwicGF0aFwiOiB7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwiZG9iXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdLFxuXHRcdFx0XHRcImVpZFwiOiBudWxsXG5cdFx0XHR9XG5cdFx0XSxcblx0XHRcImlzU2NvcGVIb2xkZXJcIjogdHJ1ZVxuXHR9XG5dIiwibW9kdWxlLmV4cG9ydHMgPSBbXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJwYXRoXCI6IHtcblx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XCJwYXRoXCI6IFtcblx0XHRcdFx0XCJ2YWxcIlxuXHRcdFx0XSxcblx0XHRcdFwiZXNjYXBlZFwiOiB0cnVlXG5cdFx0fSxcblx0XHRcImNvbnRlbnRcIjogW1xuXG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWNUZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIiN7dmFsfVwiLFxuXHRcdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFx0XCJcIixcblx0XHRcdFx0XHRcdFwiXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICBpZiAoIWdhcFN0ckFycikge1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgdGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm47XHJcblx0XHRcdFx0XHQgICAgICAgIH1cclxuXHRcdFx0XHRcdCAgICAgICAgO1xyXG5cdFx0XHRcdFx0ICAgICAgICB0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgcGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdCAgICAgICAgfSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gdGhpcztcclxuXHRcdFx0XHRcdCAgICB9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gcGFydHMuam9pbignJyk7XHJcblx0XHRcdFx0XHQgICAgfVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWNUZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIkhlbGxvICN7dmFsfSFcIixcblx0XHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcdFwiSGVsbG8gXCIsXG5cdFx0XHRcdFx0XHRcIiFcIlxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJnYXBzXCI6IFtcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XCJzb3VyY2VcIjogXCJkYXRhXCIsXG5cdFx0XHRcdFx0XHRcdFwicGF0aFwiOiBbXG5cdFx0XHRcdFx0XHRcdFx0XCJ2YWxcIlxuXHRcdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFx0XHRcImVzY2FwZWRcIjogdHJ1ZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdF0sXG5cdFx0XHRcdFx0XCJwYXJzZVwiOiBmdW5jdGlvbiAodHBsLCB2YWx1ZVBhcnNlRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcFN0ckFyciA9IHRwbC5tYXRjaChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIGlmICghZ2FwU3RyQXJyKSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLmlzU3RyaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHRoaXMucGFydHMgPSBbdHBsXTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybjtcclxuXHRcdFx0XHRcdCAgICAgICAgfVxyXG5cdFx0XHRcdFx0ICAgICAgICA7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMuZ2FwcyA9IGdhcFN0ckFyci5tYXAoZnVuY3Rpb24gKHBhcnQpIHtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0VmFsdWUgPSBwYXJ0LnNsaWNlKDIsIC0xKTtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHZhciBwYXJ0UmVzID0gdmFsdWVQYXJzZUZuKHBhcnRWYWx1ZSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICBwYXJ0UmVzLmVzY2FwZWQgPSBwYXJ0WzBdICE9PSBcIiFcIjtcclxuXHRcdFx0XHRcdCAgICAgICAgICAgIHJldHVybiBwYXJ0UmVzO1xyXG5cdFx0XHRcdFx0ICAgICAgICB9KTtcclxuXHRcdFx0XHRcdCAgICAgICAgdGhpcy5wYXJ0cyA9IHRwbC5zcGxpdChnYXBSZSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiB0aGlzO1xyXG5cdFx0XHRcdFx0ICAgIH0sXG5cdFx0XHRcdFx0XCJyZW5kZXJcIjogZnVuY3Rpb24gKHZhbHVlUmVuZGVyRm4pIHtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIGdhcHMgPSB0aGlzLmdhcHMubWFwKHZhbHVlUmVuZGVyRm4pO1xyXG5cdFx0XHRcdFx0ICAgICAgICB2YXIgcGFydHMgPSBtaXhBcnJheXModGhpcy5wYXJ0cywgZ2Fwcyk7XHJcblx0XHRcdFx0XHQgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcnKTtcclxuXHRcdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRdXG5cdH0sXG5cdFwiXCIsXG5cdHtcblx0XHRcInR5cGVcIjogXCJyYXdcIixcblx0XHRcImlzVmlydHVhbFwiOiBmYWxzZSxcblx0XHRcImlzUm9vdE5vZGVcIjogdHJ1ZSxcblx0XHRcInRhZ05hbWVcIjogXCJkaXZcIixcblx0XHRcImF0dHJzXCI6IHtcblxuXHRcdH0sXG5cdFx0XCJjb250ZW50XCI6IFtcblx0XHRcdHtcblx0XHRcdFx0XCJ0eXBlXCI6IFwiZHluYW1pY1RleHRcIixcblx0XHRcdFx0XCJ0cGxcIjoge1xuXHRcdFx0XHRcdFwic3JjXCI6IFwiSGVsbG8gI3t2YWx9ISAje3ZhbH0gaXMgZ3JlYXQhIEknZCBsaWtlIHRvIGxpdmUgaW4gI3t2YWx9IVwiLFxuXHRcdFx0XHRcdFwicGFydHNcIjogW1xuXHRcdFx0XHRcdFx0XCJIZWxsbyBcIixcblx0XHRcdFx0XHRcdFwiISBcIixcblx0XHRcdFx0XHRcdFwiIGlzIGdyZWF0ISBJJ2QgbGlrZSB0byBsaXZlIGluIFwiLFxuXHRcdFx0XHRcdFx0XCIhXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICBpZiAoIWdhcFN0ckFycikge1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgdGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm47XHJcblx0XHRcdFx0XHQgICAgICAgIH1cclxuXHRcdFx0XHRcdCAgICAgICAgO1xyXG5cdFx0XHRcdFx0ICAgICAgICB0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgcGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdCAgICAgICAgfSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gdGhpcztcclxuXHRcdFx0XHRcdCAgICB9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gcGFydHMuam9pbignJyk7XHJcblx0XHRcdFx0XHQgICAgfVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9LFxuXHRcIlwiLFxuXHR7XG5cdFx0XCJ0eXBlXCI6IFwicmF3XCIsXG5cdFx0XCJpc1ZpcnR1YWxcIjogZmFsc2UsXG5cdFx0XCJpc1Jvb3ROb2RlXCI6IHRydWUsXG5cdFx0XCJ0YWdOYW1lXCI6IFwiZGl2XCIsXG5cdFx0XCJhdHRyc1wiOiB7XG5cblx0XHR9LFxuXHRcdFwiY29udGVudFwiOiBbXG5cdFx0XHR7XG5cdFx0XHRcdFwidHlwZVwiOiBcImR5bmFtaWNUZXh0XCIsXG5cdFx0XHRcdFwidHBsXCI6IHtcblx0XHRcdFx0XHRcInNyY1wiOiBcIkknbSB0aGUgY3JlYXRvciBvZiB0aGUgI3t2YWx9IVxcbkhlbGxvICN7dmFsfSFcXG5cIixcblx0XHRcdFx0XHRcInBhcnRzXCI6IFtcblx0XHRcdFx0XHRcdFwiSSdtIHRoZSBjcmVhdG9yIG9mIHRoZSBcIixcblx0XHRcdFx0XHRcdFwiIVxcbkhlbGxvIFwiLFxuXHRcdFx0XHRcdFx0XCIhXFxuXCJcblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwiZ2Fwc1wiOiBbXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFwic291cmNlXCI6IFwiZGF0YVwiLFxuXHRcdFx0XHRcdFx0XHRcInBhdGhcIjogW1xuXHRcdFx0XHRcdFx0XHRcdFwidmFsXCJcblx0XHRcdFx0XHRcdFx0XSxcblx0XHRcdFx0XHRcdFx0XCJlc2NhcGVkXCI6IHRydWVcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdFwicGFyc2VcIjogZnVuY3Rpb24gKHRwbCwgdmFsdWVQYXJzZUZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBTdHJBcnIgPSB0cGwubWF0Y2goZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICBpZiAoIWdhcFN0ckFycikge1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgdGhpcy5pc1N0cmluZyA9IHRydWU7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB0aGlzLnBhcnRzID0gW3RwbF07XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm47XHJcblx0XHRcdFx0XHQgICAgICAgIH1cclxuXHRcdFx0XHRcdCAgICAgICAgO1xyXG5cdFx0XHRcdFx0ICAgICAgICB0aGlzLmdhcHMgPSBnYXBTdHJBcnIubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFZhbHVlID0gcGFydC5zbGljZSgyLCAtMSk7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICB2YXIgcGFydFJlcyA9IHZhbHVlUGFyc2VGbihwYXJ0VmFsdWUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICAgICAgcGFydFJlcy5lc2NhcGVkID0gcGFydFswXSAhPT0gXCIhXCI7XHJcblx0XHRcdFx0XHQgICAgICAgICAgICByZXR1cm4gcGFydFJlcztcclxuXHRcdFx0XHRcdCAgICAgICAgfSk7XHJcblx0XHRcdFx0XHQgICAgICAgIHRoaXMucGFydHMgPSB0cGwuc3BsaXQoZ2FwUmUpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gdGhpcztcclxuXHRcdFx0XHRcdCAgICB9LFxuXHRcdFx0XHRcdFwicmVuZGVyXCI6IGZ1bmN0aW9uICh2YWx1ZVJlbmRlckZuKSB7XHJcblx0XHRcdFx0XHQgICAgICAgIHZhciBnYXBzID0gdGhpcy5nYXBzLm1hcCh2YWx1ZVJlbmRlckZuKTtcclxuXHRcdFx0XHRcdCAgICAgICAgdmFyIHBhcnRzID0gbWl4QXJyYXlzKHRoaXMucGFydHMsIGdhcHMpO1xyXG5cdFx0XHRcdFx0ICAgICAgICByZXR1cm4gcGFydHMuam9pbignJyk7XHJcblx0XHRcdFx0XHQgICAgfVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XVxuXHR9XG5dIiwidmFyIGZncyA9IFtdO1xuXG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcImFwaV9iYXNpYy1iYXNpY0ZnXCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL2FwaV9iYXNpYy1iYXNpY0ZnL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJhcGlfYmFzaWMtZW1wdHlGZ1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9hcGlfYmFzaWMtZW1wdHlGZy90cGwuanNcIiksXG5cdFwiY2xhc3NGblwiOiBudWxsXG59KTtcbmZncy5wdXNoKHtcblx0XCJuYW1lXCI6IFwiYXBpX2Jhc2ljLW11bHRpUm9vdFwiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9hcGlfYmFzaWMtbXVsdGlSb290L3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJhcGlfYmFzaWNcIixcblx0XCJ0cGxcIjogcmVxdWlyZShcIi4vYXBpX2Jhc2ljL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJiYXNpY1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi9iYXNpYy90cGwuanNcIiksXG5cdFwiY2xhc3NGblwiOiBudWxsXG59KTtcbmZncy5wdXNoKHtcblx0XCJuYW1lXCI6IFwiZXNjYXBpbmdcIixcblx0XCJ0cGxcIjogcmVxdWlyZShcIi4vZXNjYXBpbmcvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInBhcnNlX2Jhc2ljXCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL3BhcnNlX2Jhc2ljL3RwbC5qc1wiKSxcblx0XCJjbGFzc0ZuXCI6IG51bGxcbn0pO1xuZmdzLnB1c2goe1xuXHRcIm5hbWVcIjogXCJzY29wZV90ZXN0XCIsXG5cdFwidHBsXCI6IHJlcXVpcmUoXCIuL3Njb3BlX3Rlc3QvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInVwZGF0ZV9iYXNpY1wiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi91cGRhdGVfYmFzaWMvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5mZ3MucHVzaCh7XG5cdFwibmFtZVwiOiBcInZhbHVlX3JlbmRlclwiLFxuXHRcInRwbFwiOiByZXF1aXJlKFwiLi92YWx1ZV9yZW5kZXIvdHBsLmpzXCIpLFxuXHRcImNsYXNzRm5cIjogbnVsbFxufSk7XG5cbiRmZy5sb2FkKGZncyk7Il19
