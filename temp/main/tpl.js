module.exports = [
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "h1",
		"attrs": {

		},
		"content": [
			" Hello! That's test app"
		]
	},
	"",
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "h3",
		"attrs": {

		},
		"content": [
			" list of things to do:"
		]
	},
	{
		"type": "raw",
		"isVirtual": false,
		"isRootNode": true,
		"tagName": "div",
		"attrs": {
			"class": "col2"
		},
		"content": [
			"<table class=\"table\">",
			"<thead>",
			"<tr>",
			"<th>",
			" Name",
			"</th>",
			"<th>",
			" Tags",
			"</th>",
			"</tr>",
			"</thead>",
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
							"todo"
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
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "td",
										"attrs": {

										},
										"value": [
											"name"
										],
										"content": [

										]
									},
									"<td>",
									{
										"type": "raw",
										"isVirtual": false,
										"isRootNode": false,
										"tagName": "div",
										"attrs": {
											"class": "tag-box"
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
												"eid": null
											},
											""
										],
										"isScopeHolder": true
									},
									"</td>"
								],
								"isScopeItem": true
							},
							""
						],
						"eid": "row"
					}
				],
				"isScopeHolder": true
			},
			"</table>"
		]
	},
	{
		"type": "fg",
		"isVirtual": true,
		"fgName": "button",
		"path": [

		],
		"eid": "helloBtn",
		"content": [
			" hello!"
		]
	},
	{
		"type": "fg",
		"isVirtual": true,
		"fgName": "tag",
		"path": [

		],
		"eid": null,
		"content": [
			" I'm tag"
		]
	}
]