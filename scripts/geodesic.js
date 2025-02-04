import { Node, Edge, Face } from "./structures.js";
import {
	getNode,
	getEdge,
	getFace,
	getBaseIcosahedronConnections,
	isNear,
	numToChar,
	generateNodeKey,
	generateEdgeKey,
	generateFaceKey,
	normalizeNode,
	calcMidNodeCoords
} from "./util.js";

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
 * @property {number} maxEdgeLength
 */

/**
 * generates icosahedron structure
 * @param {Object} options build options
 * @returns {Structure}
 */
const buildIcosahedronAtFrequency = (options) => {
	/** @type {Structure} */
	const baseIco = generateBaseIcosahedron(options);

	const structure = geodesizeIcosahedron(baseIco, options);

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

	/** @type {number} */
	let maxEdgeLength = -Infinity;

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

				maxEdgeLength = Math.max(maxEdgeLength, edge.length);

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
	return { nodes, edges, faces, maxEdgeLength }
}

/**
 * generates the nodes, edges, and faces of a geodesized icosahedron
 * @param {Structure} structure
 * @param {Object} options
 * @returns {Structure}
 */
const geodesizeIcosahedron = (structure, options) => {
	const nv = options.frequency;
	const radius = options.sizeConstraint * options.fillPercentage / 2;

	structure.nodes.edge = {
		near: new Map(),
		far: new Map()
	};

	structure.nodes.face = {
		near: new Map(),
		far: new Map()
	};

	structure.edges.edge = {
		near: new Map(),
		far: new Map()
	};

	structure.edges.face = {
		near: new Map(),
		far: new Map()
	};

	structure.faces.edge = {
		near: new Map(),
		far: new Map()
	};

	structure.faces.face = {
		near: new Map(),
		far: new Map()
	};

	for (const distType of Object.keys(structure.faces.base)) {
		structure.faces.base[distType].forEach((face, _) => {
			// get nodes, geodesize
			const baseNodes = [];
			for (const node of face.nodes) {
				baseNodes.push(
					structure.nodes.base.far.get(node) ||
					structure.nodes.base.near.get(node)
				);
			}
			// get base nodes
			const [a, b, c] = baseNodes.sort();

			// initialize node weights
			let aw = nv;
			let bw = 0;
			let cw = 0;

			let prevDepthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
			while (bw < nv) { // can still slide from a to b
				const { node: prevDepthNode } = getNode(structure.nodes, prevDepthNodeName);
				// slide from a to b
				aw -= 1;
				bw += 1;
				const depthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

				// if node does not exist, create node and connect edge
				if (!getNode(structure.nodes, depthNodeName).node) {
					// calculate coords for new node
					const cmCoords = calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = normalizeNode(...cmCoords, radius);
					// create new node
					const newNode = new Node(...nCoords, depthNodeName);

					const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
					// add new node to structure
					structure.nodes.edge[nodeIsNear].set(depthNodeName, newNode);
				}

				const { edge: depthEdge } = getEdge(structure.edges, generateEdgeKey(prevDepthNodeName, depthNodeName));

				if (!depthEdge) {
					const { node: depthNode } = getNode(structure.nodes, depthNodeName);
					connectEdge(structure, depthNode, prevDepthNode, 'edge');
				}


				let prevWidthNodeName = depthNodeName;
				let [aww, bww, cww] = [aw, bw, cw];
				while (bww) { // can still slide from b to c
					const { node: prevWidthNode } = getNode(structure.nodes, prevWidthNodeName);
					// slide from b to c
					bww -= 1;
					cww += 1;
					const widthNodeName = generateNodeKey(a.name, b.name, c.name, aww, bww, cww);

					// if node does not exist, create node and connect edge
					if (!getNode(structure.nodes, widthNodeName).node) {
						const cmCoords = calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);

						const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
						structure.nodes[aww && bww && cww ? 'face' : 'edge'][nodeIsNear].set(widthNodeName, newNode);
					}

					const { edge: widthEdge } = getEdge(structure.edges, generateEdgeKey(prevWidthNodeName, widthNodeName));

					const { node: widthNode } = getNode(structure.nodes, widthNodeName);
					// if edge does not exist, add it
					if (!widthEdge) {
						connectEdge(structure, prevWidthNode, widthNode, (!aww ? 'edge' : 'face'));
					}

					// if node is not on the top edges, create angled edges
					if (bww && cww) {
						const leftNodeName = generateNodeKey(a.name, b.name, c.name, aww + 1, bww, cww - 1);
						const rightNodeName = generateNodeKey(a.name, b.name, c.name, aww + 1, bww - 1, cww);
						const { node: leftNode } = getNode(structure.nodes, leftNodeName);
						const { node: rightNode } = getNode(structure.nodes, rightNodeName);
						connectEdge(structure, leftNode, widthNode, 'face');
						connectEdge(structure, rightNode, widthNode, 'face');
					}

					prevWidthNodeName = widthNodeName;

				}
				prevDepthNodeName = depthNodeName;
			}
		});
	}

	return structure;
}

/**
 * given 2 existing nodes, add a connected edge between them
 * @param {Structure} structure
 * @param {Node} node1
 * @param {Node} node2
 * @param {string} edgeType
 */
const connectEdge = (structure, node1, node2, edgeType) => {
	// generate name of new edge
	const edgeKey = generateEdgeKey(node1.name, node2.name);

	// connect edge to nodes
	node1.addEdge(edgeKey);
	node2.addEdge(edgeKey);

	// create new edge
	const newEdge = new Edge(node1, node2);

	// find out view distance of edge
	const distType = isNear([node1.z, node2.z]) ? 'near' : 'far';

	// add edge to structure
	structure.edges[edgeType][distType].set(edgeKey, newEdge);
}

export {
	buildIcosahedronAtFrequency
}
