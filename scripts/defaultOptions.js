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
				color: "#505050",
				size: 6,
			},
			edges: {
				show: true,
				color: "#444444",
				size: 4,
			},
			faces: {
				show: false,
				color: "#66666699",
			}
		},
		far: {
			nodes: {
				show: true,
				color: "#222222",
				size: 6,
			},
			edges: {
				show: true,
				color: "#222222",
				size: 4,
			},
			faces: {
				show: false,
				color: "#88444499",
			}
		}
	},
	edge: {
		near: {
			nodes: {
				show: true,
				color: "blue",
				size: 3,
			},
			edges: {
				show: true,
				color: "#00c703",
				size: 2,
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
				size: 3,
			},
			edges: {
				show: true,
				color: "darkred",
				size: 2,
			},
			faces: {
				show: false,
				color: "#88444499",
			}
		}
	},
	face: {
		near: {
			nodes: {
				show: true,
				color: "purple",
				size: 3,
			},
			edges: {
				show: true,
				color: "#007302",
				size: 2,
			},
			faces: {
				show: false,
				color: "#66666699",
			}
		},
		far: {
			nodes: {
				show: true,
				color: "#400040",
				size: 3,
			},
			edges: {
				show: true,
				color: "#440000",
				size: 2,
			},
			faces: {
				show: false,
				color: "#88444499",
			}
		}
	},
};

export { buildOptions, renderOptions };
