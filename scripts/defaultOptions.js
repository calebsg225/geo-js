import * as Types from "./types.js";

/** @type {Types.BuildOptions} */
const buildOptions = {
	sizeConstraint: 1000, // min of canvas width and height
	fillPercentage: .98, // percentage of sizeConstraint that the structure should fill initially
};


/** @type {Types.RenderOptions} */
const renderOptions = {
	backgroundColor: "black",
	farStructureOpacity: "88",
	nearStructureOpacity: "cc",
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
			show: false,
			color: '#FFFFFF',
			size: 4
		},
		far: {
			show: false,
			color: '#cccccc',
			size: 4
		},
	},
	edges: {
		near: {
			show: false,
			colorLength: true,
			color: '#000000',
			size: 2
		},
		far: {
			show: false,
			colorLength: true,
			color: '#999999',
			size: 1
		},
	},
	faces: {
		near: {
			show: true,
			colorArea: true,
			color: '#999999',
		},
		far: {
			show: true,
			colorArea: true,
			color: '#999999',
		},
	}
};

/** @type {Object} */
const defaultOptions = {
	nodes: {
		show: "none",
		color: "white",
		size: 2,
	},
	edges: {
		show: "none",
		color: "by length",
		size: 2,
	},
	faces: {
		show: "all",
		color: "by area",
	}
}

export { buildOptions, renderOptions, defaultOptions };
