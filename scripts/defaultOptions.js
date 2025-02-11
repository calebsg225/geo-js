const buildOptions = {
	baseShape: "icosahedron",
	frequency: 3,
	sizeConstraint: 1000, // min of canvas width and height
	fillPercentage: .98, // percentage of sizeConstraint that the structure should fill initially
};

const renderOptions = {
	backgroundColor: "black",
	rotationStep: 0.002,
	nodes: {
		near: {
			show: false,
			color: 'green',
			size: 2
		},
		far: {
			show: false,
			color: 'red',
			size: 4
		},
	},
	edges: {
		near: {
			show: true,
			color: 'grey',
			size: 1
		},
		far: {
			show: false,
			color: 'grey',
			size: 2
		},
	},
	faces: {
		near: {
			show: true,
			color: '#FFFF0055',
		},
		far: {
			show: false,
			color: 'black',
		},
	}
};

export { buildOptions, renderOptions };
