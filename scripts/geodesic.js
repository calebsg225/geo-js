import { Node, Edge, Face } from "./structures.js";
import { getBaseIcosahedronConnections, numToChar } from "./util.js";

// TODO: put types in a separate file
// TODO: try out generic types?

/**
 * @typedef {Object} SeparateNodes
 * @property {Map<string, Node>} near
 * @property {Map<string, Node>} far
 */

/**
 * @typedef {Object} SeparateEdges
 * @property {Map<string, Edge>} near
 * @property {Map<string, Edge>} far
 */

/**
 * @typedef {Object} SeparateFaces
 * @property {Map<string, Face>} near
 * @property {Map<string, Face>} far
 */

/**
 * @typedef {Object} Nodes
 * @property {SeparateNodes} base
 * @property {SeparateNodes} edge
 * @property {SeparateNodes} face
 */

/**
 * @typedef {Object} Edges
 * @property {SeparateEdges} base
 * @property {SeparateEdges} edge
 * @property {SeparateEdges} face
 */

/**
 * @typedef {Object} Faces
 * @property {SeparateFaces} base
 * @property {SeparateFaces} edge
 * @property {SeparateFaces} face
 */

/**
 * geodesic structure data
 * @typedef {Object} Structure
 * @property {Nodes} nodes
 * @property {Edges} edges
 * @property {Faces} faces
 */

/**
 * generates icosahedron structure
 * @param {number} v frequency of icosahedron
 */
const buildIcosahedronAtFrequency = (v) => {
	// golden ratio
	const g = (1 + Math.sqrt(5)) / 2;
	// coordinate list
	const coords = [
		[0, -g, -1],
		[0, -g, 1],
		[0, g, -1],
		[0, g, 1],
		[-g, -1, 0],
		[-g, 1, 0],
		[g, -1, 0],
		[g, 1, 0],
		[-1, 0, -g],
		[1, 0, -g],
		[-1, 0, g],
		[1, 0, g]
	];

	/** @type {Nodes} */
	const nodes = {
		base: {
			near: new Map(),
			far: new Map()
		}
	};

	/** @type {Edges} */
	const edges = {
		base: {
			near: new Map(),
			far: new Map()
		}
	};

	/** @type {Faces} */
	const faces = {};

	/**
	 * gets a Node
	 * @param {string} key points to desired node
	 * @returns {Node}
	 */
	const getBaseNode = (key) => {
		return nodes.base.near.get(key) || nodes.base.far.get(key);
	};

	/**
	 * adds a node to structure
	 * @param {Node} node node to add
	 */
	const addBaseNode = (node) => {
		if (node.isNear()) {
			nodes.base.near.set(node.name, node);
		} else {
			nodes.base.far.set(node.name, node);
		}
	}

	/** @type {Set<string>} */
	const addedNodes = new Set();

	/** @type {Set<string>} */
	const addedEdges = new Set();

	// generate base nodes
	for (let i = 0; i < 12; i++) {
		const nodeName = numToChar(i);
		const node = new Node(
			coords[i][0],
			coords[i][1],
			coords[i][2],
			nodeName
		);

		addedNodes.add(nodeName);

		const connections = getBaseIcosahedronConnections(i);

		for (let con = 0; con < connections.length; con++) {
			const conName = numToChar(connections[con]);
			if (!addedNodes.has(conName)) continue;
			// both nodes required for edge have been added

			const edgeKey = `${nodeName}-${conName}`;
			const conNode = getBaseNode(conName);

			const edge = new Edge(node, conNode);
			node.addEdge(edgeKey);
			conNode.addEdge(edgeKey);
		}

		addBaseNode(node);
	}

	/** @type {Structure} */
	const structure = {
		nodes: nodes,
		edges: edges,
		faces: faces
	};

	return structure;
};

export {
	buildIcosahedronAtFrequency
}
