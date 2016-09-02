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

					],
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
	}
]