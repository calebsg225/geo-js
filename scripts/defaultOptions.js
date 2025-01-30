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
				color: "green",
				size: 6,
			},
			edges: {
				show: false,
				color: "#FFFFFF",
				size: 3,
			},
			faces: {
				show: false,
				color: "#FFFFFF",
			}
		},
		far: {
			nodes: {
				show: true,
				color: "red",
				size: 3,
			},
			edges: {
				show: false,
				color: "#F42FFF",
				size: 3,
			},
			faces: {
				show: false,
				color: "#3FFFFF",
			}
		}
	},
};

export { buildOptions, renderOptions };
