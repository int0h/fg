module.exports = [
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "h1",
		"attrs": {

		},
		"value": [
			"name"
		],
		"content": [

		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "section",
		"attrs": {
			"class": "skills"
		},
		"content": [
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "h3",
				"attrs": {

				},
				"value": [
					"skillsTitle"
				],
				"content": [

				]
			},
			"<table>",
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "tbody",
				"attrs": {

				},
				"content": [
					{
						"type": "scope",
						"isVirtual": true,
						"path": [
							"skills"
						],
						"content": [
							{
								"type": "raw",
								"isVirtual": false,
								"isRootNode": false,
								"tagName": "tr",
								"attrs": {

								},
								"content": [
									"<td>",
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "div",
										"attrs": {
											"class": "skillGroup"
										},
										"value": [
											"name"
										],
										"content": [

										]
									},
									"</td>",
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "td",
										"attrs": {

										},
										"value": [
											"list"
										],
										"content": [

										]
									}
								],
								"isScopeItem": true
							}
						],
						"eid": null
					}
				],
				"isScopeHolder": true
			},
			"</table>"
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "section",
		"attrs": {
			"class": "education"
		},
		"content": [
			"<h3>",
			" Education",
			"</h3>",
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "ul",
				"attrs": {

				},
				"content": [
					{
						"type": "scope",
						"isVirtual": true,
						"path": [
							"education"
						],
						"content": [
							{
								"type": "raw",
								"isVirtual": false,
								"isRootNode": false,
								"tagName": "li",
								"attrs": {

								},
								"content": [
									"[",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"range",
											"0"
										],
										"eid": null
									},
									" - ",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"range",
											"1"
										],
										"eid": null
									},
									"] ",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"name"
										],
										"eid": null
									}
								],
								"isScopeItem": true
							}
						],
						"eid": null
					}
				],
				"isScopeHolder": true
			}
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "section",
		"attrs": {
			"class": "experience"
		},
		"content": [
			"<h3>",
			" Work Experience",
			"</h3>",
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "ul",
				"attrs": {

				},
				"content": [
					{
						"type": "scope",
						"isVirtual": true,
						"path": [
							"experience"
						],
						"content": [
							{
								"type": "raw",
								"isVirtual": false,
								"isRootNode": false,
								"tagName": "li",
								"attrs": {

								},
								"content": [
									"<h4>",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"name"
										],
										"eid": null
									},
									" [",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"date"
										],
										"eid": null
									},
									"]",
									"</h4>",
									"<p class=\"desc\">",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"desc"
										],
										"eid": null
									},
									"</p>",
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "ul",
										"attrs": {
											"class": "tags"
										},
										"content": [
											{
												"type": "scope",
												"isVirtual": true,
												"path": [
													"tags"
												],
												"content": [
													{
														"type": "raw",
														"isVirtual": false,
														"isRootNode": false,
														"tagName": "li",
														"attrs": {

														},
														"content": [
															{
																"type": "fg",
																"isVirtual": true,
																"fgName": "tag",
																"path": [

																],
																"eid": null,
																"content": [
																	{
																		"type": "data",
																		"isVirtual": false,
																		"path": [

																		],
																		"eid": null
																	}
																]
															}
														],
														"isScopeItem": true
													}
												],
												"eid": null
											}
										],
										"isScopeHolder": true
									}
								],
								"isScopeItem": true
							}
						],
						"eid": null
					}
				],
				"isScopeHolder": true
			}
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "section",
		"attrs": {
			"class": "projects"
		},
		"content": [
			"<h3>",
			" Projects",
			"</h3>",
			{
				"type": "raw",
				"isVirtual": false,
				"isRootNode": false,
				"tagName": "ul",
				"attrs": {

				},
				"content": [
					{
						"type": "scope",
						"isVirtual": true,
						"path": [
							"projects"
						],
						"content": [
							{
								"type": "raw",
								"isVirtual": false,
								"isRootNode": false,
								"tagName": "li",
								"attrs": {

								},
								"content": [
									"<h4>",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"name"
										],
										"eid": null
									},
									" [",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"date"
										],
										"eid": null
									},
									"]",
									"</h4>",
									"<p class=\"desc\">",
									{
										"type": "data",
										"isVirtual": false,
										"path": [
											"desc"
										],
										"eid": null
									},
									"</p>",
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "ul",
										"attrs": {
											"class": "tags"
										},
										"content": [
											{
												"type": "scope",
												"isVirtual": true,
												"path": [
													"tags"
												],
												"content": [
													{
														"type": "raw",
														"isVirtual": false,
														"isRootNode": false,
														"tagName": "li",
														"attrs": {

														},
														"content": [
															{
																"type": "fg",
																"isVirtual": true,
																"fgName": "tag",
																"path": [

																],
																"eid": null,
																"content": [
																	{
																		"type": "data",
																		"isVirtual": false,
																		"path": [

																		],
																		"eid": null
																	}
																]
															}
														],
														"isScopeItem": true
													}
												],
												"eid": null
											}
										],
										"isScopeHolder": true
									}
								],
								"isScopeItem": true
							}
						],
						"eid": null
					}
				],
				"isScopeHolder": true
			}
		]
	}
]