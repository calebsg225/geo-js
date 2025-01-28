const buildOptions = {
	baseShape: "icosahedron",
	frequency: 5,
	sizeConstraint: 1000, // min of canvas width and height
	centerX: 0,
	centerY: 0,
	fillPercentage: .9, // percentage of sizeConstraint that the structure should fill initially
};

const renderOptions = {
	backgroundColor: "black",
	base: {
		near: {
			nodes: {
				show: true,
				color: "#FFFFFF",
				size: 3,
			},
			edges: {
				show: true,
				color: "#FFFFFF",
				size: 3,
			},
			faces: {
				show: true,
				color: "#FFFFFF",
			}
		},
		far: {
			nodes: {
				show: true,
				color: "#FFFFFF",
				size: 3,
			},
			edges: {
				show: true,
				color: "#FFFFFF",
				size: 3,
			},
			faces: {
				show: true,
				color: "#FFFFFF",
			}
		}
	},
};

export { buildOptions, renderOptions };
