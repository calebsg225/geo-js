import { calc3dDistance, calcTriangleArea } from "./util.js";

/**
 * Creates a new Node
 * @class
 */
class Node {

	/**
	 * builds initial node state
	 * @constructor
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 * @param {string} name
	 */
	constructor(x, y, z, name) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.edges = [];
		this.faces = [];
		this.name = name;
	}

	/**
	 * replaces old Node coordinates with new Coordinates
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	updateCoord(x, y, z) {
		// TODO: return whether node switches near/far
		this.x = x;
		this.y = y;
		this.z = z;
	}

	/**
	 * adds an edge connection to Node
	 * @param {string} edge
	 */
	addEdge(edge) {
		this.edges.push(edge);
	}

	/**
	 * adds a face connection to Node
	 * @param {string} face
	 */
	addFace(face) {
		this.faces.push(face);
	}
}

/**
 * Creates a new Edge
 * @class
 */
class Edge {
	/**
	* builds initial node state
	* @constructor
	* @param {Node} node1 
	* @param {Node} node2 
	*/
	constructor(node1, node2) {
		this.nodes = [];
		this.nodes.push(node1.name, node2.name);
		this.length = calc3dDistance(
			node1.x,
			node1.y,
			node1.z,
			node2.x,
			node2.y,
			node2.z
		);
	}

}

/**
 * Creates a new Face
 * @class
 */
class Face {
	/**
	* build a new Face
	* @constructor
	* @param {Node} node1 
	* @param {Node} node2 
	* @param {Node} node3 
	*/
	constructor(node1, node2, node3) {
		this.nodes = [];
		this.nodes.push(node1.name, node2.name, node3.name);
		this.area = calcTriangleArea(
			node1.x,
			node1.y,
			node1.z,
			node2.x,
			node2.y,
			node2.z,
			node3.x,
			node3.y,
			node3.z,
		);
	}
}

export { Node, Edge, Face };
