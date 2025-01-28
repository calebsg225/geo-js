import { Node, Edge, Face } from "./structures.js";
import { getBaseIcosahedronConnections, isNear, numToChar } from "./util.js";

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
 * @param {Object} options build options
 * @returns {Structure}
 */
const buildIcosahedronAtFrequency = (options) => {
	/** @type {Structure} */
	const structure = generateBaseIcosahedron(options);

	return structure;
};

/**
 * generates base icosahedron structure
 * @param {Object} options
 * @returns {Structure}
 */
const generateBaseIcosahedron = (options) => {
	const radius = options.sizeConstraint * options.fillPercentage / 2;
	// golden ratio
	const g = (1 + Math.sqrt(5)) / 2;
	const scale = radius / Math.sqrt(g ** 2 + 1);
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
	const faces = {
		base: {
			near: new Map(),
			far: new Map()
		}
	};

	/**
	 * gets a Node
	 * @param {string} key points to desired node
	 * @returns {Node}
	 */
	const getBaseNode = (key) => {
		return nodes.base.near.get(key) || nodes.base.far.get(key);
	};

	/** @type {Set<string>} */
	const addedNodes = new Set();

	/** @type {Set<string>} */
	const addedEdges = new Set();

	/** @type {Set<string>} */
	const addedFaces = new Set();

	for (let i = 0; i < 12; i++) {
		const nodeName = numToChar(i);
		const node = new Node(
			coords[i][0] * scale,
			coords[i][1] * scale,
			coords[i][2] * scale,
			nodeName
		);

		const connections = getBaseIcosahedronConnections(i);

		for (let con = 0; con < connections.length; con++) {
			const conName = numToChar(connections[con]);
			const con2Name = numToChar(connections[(con + 1) % 5]);
			const edgeName = [nodeName, conName].sort().join('-');
			const faceName = [nodeName, conName, con2Name].sort().join('-');

			// connect edges
			if (
				addedNodes.has(conName) &&
				!addedEdges.has(edgeName)
			) {
				// both nodes required for edge have been added
				// edge has not already been added

				const conNode = getBaseNode(conName);

				const edge = new Edge(node, conNode);
				node.addEdge(edgeName);
				conNode.addEdge(edgeName);

				// add edge to edges
				if (isNear([node.z, conNode.z])) {
					edges.base.near.set(edgeName, edge);
				} else {
					edges.base.far.set(edgeName, edge);
				}
				addedEdges.add(edgeName);
			}

			// connect faces
			if (
				addedNodes.has(conName) &&
				addedNodes.has(con2Name) &&
				!addedFaces.has(faceName)
			) {
				// all nodes required for face have been added
				// face has not already been added

				const conNode = getBaseNode(conName);
				const con2Node = getBaseNode(con2Name);

				const face = new Face(node, conNode, con2Node);
				node.addFace(faceName);
				conNode.addFace(faceName);
				con2Node.addFace(faceName);

				// add face to faces
				if (isNear([node.z, conNode.z, con2Node.z])) {
					faces.base.near.set(faceName, face);
				} else {
					faces.base.far.set(faceName, face);
				}
				addedFaces.add(faceName);
			}
		}

		// add node to nodes
		if (isNear([node.z])) {
			nodes.base.near.set(node.name, node);
		} else {
			nodes.base.far.set(node.name, node);
		}
		addedNodes.add(nodeName);
	}
	return { nodes, edges, faces }
}

export {
	buildIcosahedronAtFrequency
}
