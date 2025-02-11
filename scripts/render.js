import { Node, Face, Edge } from "./structures.js";
import { rotateNode, isNear, getNode, getEdge, getFace } from "./util.js";

/**
 * manages render
 * @class
 */
class Renderer {

	/**
	 * @constructor
	 * @param {HTMLCanvasElement} canvas 
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
	}

	/** 
	 * clears and renders inputed data
	 */
	render = () => {
		this.clearCanvas();

		// render far nodes
		this.drawNodes(
			this.layer.nodes.far,
			this.options.nodes.far
		);

		// render far faces
		this.drawFaces(
			this.layer.faces.far,
			this.options.faces.far
		);

		// render far edges
		this.drawEdges(
			this.layer.edges.far,
			this.options.edges.far
		);

		// render near edges
		this.drawEdges(
			this.layer.edges.near,
			this.options.edges.near
		);

		// render near faces
		this.drawFaces(
			this.layer.faces.near,
			this.options.faces.near
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
		// TODO: determine whether edges/faces need to be moved to near/far

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
				const { switched, underThreshold } = node.updateCoord(...rotateNode(node.x, node.y, node.z, dX, dY, this.options.rotationStep), 1000);

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

			const newDist = isNear([node1.z, node2.z, node3.z]) ? "near" : "far";

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

	randCol = () => {
		const str = [];
		str.push("#");
		for (let i = 0; i < 6; i++) {
			str.push("123456789ABCDEF"[Math.floor(Math.random() * 15)]);
		}
		return str.join("");
	}

	/**
	 * draws inputed nodes using the inputed styles
	 * @param {Map<Node>} nodes
	 * @param {Object} styles
	 */
	drawNodes = (nodes, styles) => {
		if (!styles.show) return;
		nodes.forEach((node, _) => {
			this.drawNode(node.x + this.cX, node.y + this.cY, styles.size, styles.color);
		});
	}

	/**
	 * draws inputed edges using the inputed styles
	 * @param {Map<Edge>} edges
	 * @param {Object} styles
	 */
	drawEdges = (edges, styles) => {
		if (!styles.show) return;
		edges.forEach((edge, _) => {
			this.drawEdge(
				edge.nodes.map((nodeKey) => {
					const { node } = getNode(this.layer.nodes, nodeKey);
					return [node.x + this.cX, node.y + this.cY]
				}),
				styles.size,
				styles.color
			);
		});
	}

	/**
	 * draws inputed faces using the inputed styles
	 * @param {Map<Face>} faces
	 * @param {Object} styles
	 */
	drawFaces = (faces, styles) => {
		if (!styles.show) return;
		faces.forEach((face, _) => {
			this.drawFace(
				face.nodes.map((nodeKey) => {
					const { node } = getNode(this.layer.nodes, nodeKey);
					return [node.x + this.cX, node.y + this.cY];
				}),
				styles.color
			);
		});
	}

	// TODO: put Structure type in a differnet file so type can be accessed here
	/**
	* sets 3d object structure to render
	*/
	setStructure = (structure) => {
		this.structure = structure;
		this.render();
	}

	/**
	 * fills the canvas with the backgroundColor stored in options
	 */
	clearCanvas = () => {
		this.ctx.fillStyle = this.options.backgroundColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	updateOptions = (options) => {
		this.options = options;
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
