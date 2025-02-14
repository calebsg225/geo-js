const buildOptions = {
	baseShape: "icosahedron",
	frequency: 4,
	sizeConstraint: 1000, // min of canvas width and height
	fillPercentage: .98, // percentage of sizeConstraint that the structure should fill initially
};

const renderOptions = {
	backgroundColor: "black",
	rotationStep: 0.003,
	defaultColors: [
		"#FF0000",
		"#00FF00",
		"#0000FF",
		"#FFFF00",
		"#00FFFF",
		"#FF00FF",
		"#820000",
		"#008200",
		"#000082",
		"#828200",
		"#008282",
		"#820082",
		"#7B3C00",
		"#FF7B00",
		"#FF7B7B",
		"#7BFF7B",
		"#7B7BFF",
		"#FFFF7B",
		"#7BFFFF",
		"#FF7BFF",
		"#FFBB7B",
	],
	nodes: {
		near: {
			show: true,
			color: 'green',
			size: 3
		},
		far: {
			show: true,
			color: 'red',
			size: 2
		},
	},
	edges: {
		near: {
			show: true,
			colorLength: true,
			color: 'grey',
			size: 4
		},
		far: {
			show: false,
			colorLength: false,
			color: 'grey',
			size: 2
		},
	},
	faces: {
		near: {
			show: true,
			colorArea: true,
			color: '#FFFF0055',
		},
		far: {
			show: false,
			colorArea: true,
			color: 'black',
		},
	}
};

export { buildOptions, renderOptions };
