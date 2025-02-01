const buildOptions = {
	baseShape: "icosahedron",
	frequency: 5,
	sizeConstraint: 1000, // min of canvas width and height
	fillPercentage: .98, // percentage of sizeConstraint that the structure should fill initially
};

const renderOptions = {
	backgroundColor: "black",
	rotationStep: 0.002,
	base: {
		near: {
			nodes: {
				show: true,
				color: "blue",
				size: 8,
			},
			edges: {
				show: true,
				color: "darkgreen",
				size: 6,
			},
			faces: {
				show: false,
				color: "#66666699",
			}
		},
		far: {
			nodes: {
				show: true,
				color: "blue",
				size: 6,
			},
			edges: {
				show: true,
				color: "darkred",
				size: 3,
			},
			faces: {
				show: true,
				color: "#88444499",
			}
		}
	},
};

export { buildOptions, renderOptions };
