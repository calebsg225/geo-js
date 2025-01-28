import { Node } from "./structures.js";

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
	drawFace = () => { }

	/**
	 * draws inputed nodes using the inputed styles
	 * @param {Map<Node>} nodes
	 * @param {Object} styles
	 */
	drawNodes = (nodes, styles) => {
		if (!styles.show) return;
		nodes.forEach((node, _) => {
			this.drawNode(node.x, node.y, styles.size, styles.color);
		});
	}
	drawEdges = () => { }
	drawFaces = () => { }

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
	 * displays client window dimensions on canvas
	 */
	showCanvasDim = () => {
		this.ctx.fillStyle = "red";
		this.ctx.font = "2rem serif";
		this.ctx.fillText(`${this.canvas.width}, ${this.canvas.height}`, 10, 30);
	}
}

export default Renderer;
