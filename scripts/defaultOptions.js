const buildOptions = {
	baseShape: "icosahedron",
	frequency: 6,
	sizeConstraint: 1000, // min of canvas width and height
	fillPercentage: .98, // percentage of sizeConstraint that the structure should fill initially
};

const renderOptions = {
	backgroundColor: "black",
	rotationStep: 0.002,
	nodes: {
		near: {
			show: true,
			color: 'green',
			size: 6
		},
		far: {
			show: true,
			color: 'red',
			size: 4
		},
	},
	edges: {
		near: {
			show: true,
			color: 'grey',
			size: 3
		},
		far: {
			show: false,
			color: 'grey',
			size: 2
		},
	},
	faces: {
		near: {
			show: false,
			color: '#00FF0055',
		},
		far: {
			show: false,
			color: 'black',
		},
	}
};

export { buildOptions, renderOptions };
