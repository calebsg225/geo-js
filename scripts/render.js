import { Node, Face, Edge } from "./structures.js";

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
	}

	/** 
	 * clears and renders inputed data
	 */
	render = () => {
		this.clearCanvas();
		// render far base nodes
		this.drawNodes(
			this.structure.nodes.base.far,
			this.options.base.far.nodes
		);

		// render far base faces
		this.drawFaces(
			this.structure.faces.base.far,
			this.options.base.far.faces
		);

		/**
		 * draw order:
		 *
		 * base: far nodes
		 *
		 * other: far nodes
		 * other: far faces
		 * other: far edges
		 *
		 * base: far faces
		 * base: far edges
		 *
		 * base: near edges
		 * base: near faces
		 *
		 * other: near edges
		 * other: near faces
		 * other: near nodes
		 *
		 * base: near nodes
		 */
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
	drawEdge = () => { }
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

	drawEdges = () => { }

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
					const node = this.getNode(nodeKey);
					return [node.x + this.cX, node.y + this.cY];
				}),
				styles.color
			);
		});
	}

	/**
	 * @param {string} key
	 */
	getNode = (key) => {
		return (
			this.structure.nodes.base.near.get(key) ||
			this.structure.nodes.base.far.get(key) ||
			this.structure.nodes.edge.near.get(key) ||
			this.structure.nodes.edge.far.get(key) ||
			this.structure.nodes.face.near.get(key) ||
			this.structure.nodes.face.far.get(key)
		);
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
