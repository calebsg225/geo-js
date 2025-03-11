import * as Types from "./types.js";
import { Node, Edge, Face } from "./structures.js";
import { rotateNode, isNear, getNode, getEdge, getFace, isFaceNear } from "./util.js";

/**
 * @class
 * @classdesc Handles geodesic structure rendering to an HTMLCanvasElement
 */
class Renderer {

	// TODO: remove 'structure' from input: should not be required for initializing the renderer
	/**
	 * @constructor
	 * @param {HTMLCanvasElement} canvas
	 * @param {Types.RenderOptions} defaultOptions
	 * @param {Types.Structure} structure
	 */
	constructor(canvas, defaultOptions, structure) {
		this.canvas = canvas;
		this.cX = canvas.width / 2;
		this.cY = canvas.height / 2;
		this.options = defaultOptions;
		this.ctx = canvas.getContext('2d');
		this.structure = structure;
		this.renderLayer = structure.layers.length - 1;
		this.layer = structure.layers[this.renderLayer];

		/** @type {Map<number, string>} */
		this.edgeColorCodes = new Map();

		/** @type {Map<number, string>} */
		this.faceColorCodes = new Map();
	}

	/** 
	 * clears and renders inputed data
	 */
	render = () => {
		this.clearCanvas();

		// render far nodes
		this.drawNodes(
			this.layer.nodes.far,
			this.options.nodes.far,
			true
		);

		// render far faces
		this.drawFaces(
			this.layer.faces.far,
			this.options.faces.far,
			this.options.defaultColors,
			true
		);

		// render far edges
		this.drawEdges(
			this.layer.edges.far,
			this.options.edges.far,
			this.options.defaultColors,
			true
		);

		// render near edges
		this.drawEdges(
			this.layer.edges.near,
			this.options.edges.near,
			this.options.defaultColors
		);

		// render near faces
		this.drawFaces(
			this.layer.faces.near,
			this.options.faces.near,
			this.options.defaultColors
		);

		// render near nodes
		this.drawNodes(
			this.layer.nodes.near,
			this.options.nodes.near
		);

	}

	/**
	 * rotates the structure based on inputed deltas
	 * @param {number} dX delta X
	 * @param {number} dY delta Y
	 */
	rotate = (dX, dY) => {
		// rotate all nodes
		// update near and far nodes accordingly

		/**
		 * @type {Set<string>}
		 */
		const rotatedNodes = new Set();

		/**
		 * @type {Set<string>}
		 */
		const edgesToUpdate = new Set();

		/**
		 * @type {Set<string>}
		 */
		const facesToUpdate = new Set();

		for (const distType of Object.keys(this.layer.nodes)) {
			const nodes = this.layer.nodes[distType];

			nodes.forEach((node, _) => {
				// return if its already been rotated
				if (rotatedNodes.has(node.name)) return;

				// rotate node, check if node switched near/far
				const { switched, underThreshold } = node.updateCoord(...rotateNode(node.x, node.y, node.z, dX, dY, this.options.rotationStep), Math.max(this.layer.maxEdgeLength, Math.abs(dX), Math.abs(dY)));

				// if node z value is or was under max edge length, edges and faces connected to this node need to be checked if it crossed to near/far
				if (underThreshold) {
					for (let i = 0; i < node.edges.length; i++) {
						edgesToUpdate.add(node.edges[i]);
					}
					for (let i = 0; i < node.faces.length; i++) {
						facesToUpdate.add(node.faces[i]);
					}
				}

				if (!switched) return;

				// update node dist
				const newDist = distType === "near" ? "far" : "near";
				this.layer.nodes[newDist].set(node.name, node);
				this.layer.nodes[distType].delete(node.name);
				rotatedNodes.add(node.name);
			});
		}

		// for detected edges near z=0, check if switched to near/far
		edgesToUpdate.forEach(edgeKey => {
			const { edge, distType } = getEdge(this.layer.edges, edgeKey);
			const { node: node1 } = getNode(this.layer.nodes, edge.nodes[0]);
			const { node: node2 } = getNode(this.layer.nodes, edge.nodes[1]);

			const newDist = isNear([node1.z, node2.z]) ? "near" : "far";

			// if edge used to be near and is now far (or vice versa)
			if (newDist !== distType) {
				this.layer.edges[newDist].set(edgeKey, edge);
				this.layer.edges[distType].delete(edgeKey);
			}
		});


		// for detected faces near z=0, check if switched to near/far
		facesToUpdate.forEach(faceKey => {
			const { face, distType } = getFace(this.layer.faces, faceKey);
			const { node: node1 } = getNode(this.layer.nodes, face.nodes[0]);
			const { node: node2 } = getNode(this.layer.nodes, face.nodes[1]);
			const { node: node3 } = getNode(this.layer.nodes, face.nodes[2]);

			const newDist = isFaceNear(node1, node2, node3) ? "near" : "far";

			// if face used to be near and is now far (or vice versa)
			if (newDist !== distType) {
				this.layer.faces[newDist].set(faceKey, face);
				this.layer.faces[distType].delete(faceKey);
			}
		});

		this.render();
	}

	/**
	 * draws a node with specified parameters
	 * @param {number} x
	 * @param {number} y
	 * @param {number} size
	 * @param {string} color
	 */
	drawNode = (
		x,
		y,
		size,
		color
	) => {
		this.ctx.beginPath();
		this.ctx.arc(x, y, size, 0, 2 * Math.PI);
		this.ctx.fillStyle = color;
		this.ctx.fill();
	}

	/**
	 * draws an edge with specified parameters
	 * @param {number[][]} nodes
	 * @param {number} size
	 * @param {string} color
	 */
	drawEdge = (
		nodes,
		size,
		color
	) => {
		this.ctx.beginPath();
		this.ctx.moveTo(nodes[0][0], nodes[0][1]);
		this.ctx.lineTo(nodes[1][0], nodes[1][1]);
		this.ctx.lineWidth = size;
		this.ctx.strokeStyle = color;
		this.ctx.stroke();
	}

	/**
	 * draws a face from node coords
	 * @param {number[][]} nodes
	 * @param {string} color
	 */
	drawFace = (nodes, color) => {
		this.ctx.beginPath();
		this.ctx.moveTo(nodes[0][0], nodes[0][1]);
		this.ctx.lineTo(nodes[1][0], nodes[1][1]);
		this.ctx.lineTo(nodes[2][0], nodes[2][1]);
		this.ctx.lineTo(nodes[0][0], nodes[0][1]);
		this.ctx.fillStyle = color;
		this.ctx.fill();
	}

	/**
	 * generates a random opaque color
	 * @returns {string}
	 */
	randomColor = () => {
		const str = [];
		str.push("#");
		for (let i = 0; i < 6; i++) {
			str.push("123456789ABCDEF"[Math.floor(Math.random() * 15)]);
		}
		return str.join("");
	}

	labelNode = (node, color = "white", style = "bold 40px serif") => {
		this.ctx.fillStyle = color;
		this.ctx.font = style;
		this.ctx.fillText(node.name.toUpperCase(), node.x + this.cX, node.y + this.cY);
	}

	/**
	 * draws inputed nodes using the inputed styles
	 * @param {Map<Node>} nodes
	 * @param {Types.NodesOptions} styles
	 * @param {boolean} isFar
	 */
	drawNodes = (nodes, styles, isFar = false) => {
		if (!styles.show) return;
		nodes.forEach((node, _) => {
			this.drawNode(node.x + this.cX, node.y + this.cY, styles.size, styles.color + (isFar ? this.options.farStructureOpacity : this.options.nearStructureOpacity));
			/*
			if (node.name.length < 2) { this.labelNode(node) }
			else { this.labelNode(node, "white", "8px serif") }
			*/
		});
	}

	/**
	 * draws inputed edges using the inputed styles
	 * @param {Map<string, Edge>} edges
	 * @param {Types.EdgesOptions} styles
	 * @param {string[]} defaultColors
	 * @param {boolean} isFar
	 */
	drawEdges = (edges, styles, defaultColors, isFar = false) => {
		if (!styles.show) return;
		edges.forEach((edge, _) => {

			let color = styles.color;
			if (styles.colorLength) {
				if (edge.colorCode < defaultColors.length) {
					color = defaultColors[edge.colorCode];
				} else {
					if (!this.edgeColorCodes.has(edge.colorCode)) {
						this.edgeColorCodes.set(edge.colorCode, this.randomColor());
					}
					color = this.edgeColorCodes.get(edge.colorCode);
				}
			}

			this.drawEdge(
				edge.nodes.map((nodeKey) => {
					const { node } = getNode(this.layer.nodes, nodeKey);
					return [node.x + this.cX, node.y + this.cY]
				}),
				styles.size,
				color + (isFar ? this.options.farStructureOpacity : this.options.nearStructureOpacity)
			);
		});
	}

	/**
	 * draws inputed faces using the inputed styles
	 * @param {Map<string, Face>} faces
	 * @param {Types.FacesOptions} styles
	 * @param {string[]} defaultColors
	 * @param {boolean} isFar
	 */
	drawFaces = (faces, styles, defaultColors, isFar = false) => {
		if (!styles.show) return;
		faces.forEach((face, _) => {

			let color = styles.color;
			if (styles.colorArea) {
				if (face.colorCode < defaultColors.length) {
					color = defaultColors[face.colorCode];
				} else {
					if (!this.faceColorCodes.has(face.colorCode)) {
						this.faceColorCodes.set(face.colorCode, this.randomColor());
					}
					color = this.faceColorCodes.get(face.colorCode);
				}
			}

			this.drawFace(
				face.nodes.map((nodeKey) => {
					const { node } = getNode(this.layer.nodes, nodeKey);
					return [node.x + this.cX, node.y + this.cY];
				}),
				color + (isFar ? this.options.farStructureOpacity : this.options.nearStructureOpacity)
			);
		});
	}

	// TODO: put Structure type in a differnet file so type can be accessed here
	/**
	 * sets 3d object structure to render
	 * @param {Types.Structure} strucrure
	 */
	setStructure = (structure) => {
		this.structure = structure;
		this.renderLayer = structure.layers.length - 1;
		this.layer = structure.layers[this.renderLayer];
	}

	/**
	 * fills the canvas with the backgroundColor stored in options
	 */
	clearCanvas = () => {
		this.ctx.fillStyle = this.options.backgroundColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	/**
	 * updates whether structures should be rendered near/far
	 * @param {string} type nodes/edges/faces
	 * @param {string} newDist the new distance to update to
	 */
	updateDistOptions = (type, newDist) => {
		const showNear = newDist === 'all' || newDist === 'near';
		const showFar = newDist === 'all' || newDist === 'far';
		this.options[type].near.show = showNear;
		this.options[type].far.show = showFar;
	}

	/**
	 * update render center point on window resize
	 * @param {number} new window width
	 * @param {height} new window height
	 */
	updateCenter = (width, height) => {
		this.cX = width / 2;
		this.cY = height / 2;
	}

	/**
	 * displays client window dimensions on canvas
	 */
	showCanvasDim = () => {
		this.ctx.fillStyle = "red";
		this.ctx.font = "2rem serif";
		this.ctx.fillText(`${this.canvas.width}, ${this.canvas.height}`, 10, 30);
	}
}

export default Renderer;
