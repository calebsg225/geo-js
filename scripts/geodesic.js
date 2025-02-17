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
 * @typedef {Object} Nodes
 * @property {Map<string, Node>} near
 * @property {Map<string, Node>} far
 */

/**
 * @typedef {Object} Edges
 * @property {Map<string, Edge>} near
 * @property {Map<string, Edge>} far
 */

/**
 * @typedef {Object} Faces
 * @property {Map<string, Face>} near
 * @property {Map<string, Face>} far
 */

/**
 * @typedef {object} StructureLayer
 * @property {Nodes} nodes
 * @property {Edges} edges
 * @property {Faces} faces
 * @property {number} maxEdgeLength
 */

/**
 * geodesic structure data
 * @typedef {Object} Structure
 * @property {StructureLayer[]} layers
 */

/**
 * generates icosahedron structure
 * @param {Object} options build options
 * @returns {Structure}
 */
const buildIcosahedronAtFrequency = (options) => {

	/** @type {Structure} */
	const structure = {
		layers: [],
	}

	structure.layers.push(generateBaseIcosahedron(options));
	structure.layers.push(classILayer(
		structure.layers[structure.layers.length - 1],
		options
	));
	structure.layers.push(classIILayer(
		structure.layers[structure.layers.length - 1],
		options
	));

	return structure;
};

/**
 * generates base icosahedron structure
 * @param {Object} options
 * @returns {StructureLayer}
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
		near: new Map(),
		far: new Map()
	};

	/** @type {Edges} */
	const edges = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Faces} */
	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {number} */
	let maxEdgeLength = -Infinity;

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	/**
	 * gets a Node
	 * @param {string} key points to desired node
	 * @returns {Node}
	 */
	const getBaseNode = (key) => {
		return nodes.near.get(key) || nodes.far.get(key);
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

				const edgeColorKey = parseFloat(edge.length.toPrecision(10));
				if (edgeColorMap.has(edgeColorKey)) {
					edge.colorCode = edgeColorMap.get(edgeColorKey);
				} else {
					const edgeColorCode = edgeColorMap.size;
					edgeColorMap.set(edgeColorKey, edgeColorCode);
					edge.colorCode = edgeColorCode;
				}

				// add edge to edges
				if (isNear([node.z, conNode.z])) {
					edges.near.set(edgeName, edge);
				} else {
					edges.far.set(edgeName, edge);
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

				const faceColorKey = parseFloat(face.area.toPrecision(10));
				if (faceColorMap.has(faceColorKey)) {
					face.colorCode = faceColorMap.get(faceColorKey);
				} else {
					const faceColorCode = faceColorMap.size;
					faceColorMap.set(faceColorKey, faceColorCode);
					face.colorCode = faceColorCode;
				}

				// add face to faces
				if (isNear([node.z, conNode.z, con2Node.z])) {
					faces.near.set(faceName, face);
				} else {
					faces.far.set(faceName, face);
				}
				addedFaces.add(faceName);
			}
		}

		// add node to nodes
		if (isNear([node.z])) {
			nodes.near.set(node.name, node);
		} else {
			nodes.far.set(node.name, node);
		}
		addedNodes.add(nodeName);
	}
	return { nodes, edges, faces, maxEdgeLength }
}

/**
 * creates a class I subdivision of the inputed structure layer
 * @param {StructureLayer} layer
 * @param {Object} options
 * @returns {StructureLayer}
 */
const classILayer = (layer, options) => {
	const nv = options.frequency;
	const radius = options.sizeConstraint * options.fillPercentage / 2;

	const nodes = {
		near: new Map(),
		far: new Map()
	};

	// carry over nodes from previous layer without previous layer node connections
	for (const distType of Object.keys(layer.nodes)) {
		layer.nodes[distType].forEach((node, nodeKey) => {
			nodes[distType].set(nodeKey, new Node(
				node.x,
				node.y,
				node.z,
				nodeKey
			));
		});
	}

	const edges = {
		near: new Map(),
		far: new Map()
	};

	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (const distType of Object.keys(layer.faces)) {
		layer.faces[distType].forEach((face, _) => {
			// get face nodes
			const faceNodes = [];
			for (const nodeKey of face.nodes.sort()) {
				faceNodes.push(
					layer.nodes.far.get(nodeKey) ||
					layer.nodes.near.get(nodeKey)
				);
			}
			// TODO: (for class III subdivision) order in a consistent way
			const [a, b, c] = faceNodes;

			// initialize node weights
			let aw = nv;
			let bw = 0;
			let cw = 0;

			let prevDepthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
			while (bw < nv) { // can still slide from a to b
				const { node: prevDepthNode } = getNode(nodes, prevDepthNodeName);
				// slide from a to b
				aw -= 1;
				bw += 1;
				const depthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

				// if node does not exist, create node
				if (!getNode(nodes, depthNodeName).node) {
					// calculate coords for new node
					const cmCoords = calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = normalizeNode(...cmCoords, radius);
					// create new node
					const newNode = new Node(...nCoords, depthNodeName);

					const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
					// add new node to new layer
					nodes[nodeIsNear].set(depthNodeName, newNode);
				}

				const { edge: depthEdge } = getEdge(edges, generateEdgeKey(prevDepthNodeName, depthNodeName));

				// if edge between nodes does not exist, connect edge
				if (!depthEdge) {
					const { node: depthNode } = getNode(nodes, depthNodeName);
					connectEdge(edges, depthNode, prevDepthNode, edgeColorMap);
				}


				let prevWidthNodeName = depthNodeName;
				let [aww, bww, cww] = [aw, bw, cw];
				while (bww) { // can still slide from b to c
					const { node: prevWidthNode } = getNode(nodes, prevWidthNodeName);
					// slide from b to c
					bww -= 1;
					cww += 1;
					const widthNodeName = generateNodeKey(a.name, b.name, c.name, aww, bww, cww);

					// if node does not exist, create node
					if (!getNode(nodes, widthNodeName).node) {
						const cmCoords = calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);

						const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
						nodes[nodeIsNear].set(widthNodeName, newNode);
					}

					const { edge: widthEdge } = getEdge(edges, generateEdgeKey(prevWidthNodeName, widthNodeName));

					const { node: widthNode } = getNode(nodes, widthNodeName);
					// if edge does not exist, connect edge
					if (!widthEdge) {
						connectEdge(edges, prevWidthNode, widthNode, edgeColorMap);
					}

					// add face
					const topNodeName = generateNodeKey(a.name, b.name, c.name, aww + 1, bww, cww - 1);
					const { node: topNode } = getNode(nodes, topNodeName);
					connectFace(faces, prevWidthNode, widthNode, topNode, faceColorMap);

					// add bc edge if it does not exist. This is a must for structures built off of more than one layer.
					if (!getEdge(edges, generateEdgeKey(widthNode, topNode)).edge) {
						connectEdge(edges, widthNode, topNode, edgeColorMap);
					}

					// if node is not on the top edges, create angled edges and face
					if (bww && cww) {
						const leftNodeName = generateNodeKey(a.name, b.name, c.name, aww + 1, bww, cww - 1);
						const rightNodeName = generateNodeKey(a.name, b.name, c.name, aww + 1, bww - 1, cww);
						const { node: leftNode } = getNode(nodes, leftNodeName);
						const { node: rightNode } = getNode(nodes, rightNodeName);
						connectEdge(edges, leftNode, widthNode, edgeColorMap);
						connectEdge(edges, rightNode, widthNode, edgeColorMap);

						// add face
						connectFace(faces, leftNode, rightNode, widthNode, faceColorMap);
					}

					prevWidthNodeName = widthNodeName;

				}
				prevDepthNodeName = depthNodeName;
			}
		});
	}

	return { nodes, edges, faces };
}

/**
 * creates a class II subdivision of the inputed structure layer
 * @param {StructureLayer} layer
 * @param {Object} options
 * @returns {StructureLayer}
 */
const classIILayer = (layer, options) => {
	const nv = options.frequency;
	const radius = options.sizeConstraint * options.fillPercentage / 2;

	// store nodes between faces
	/** @type {Map<string, string[]>) */
	const interFaceConnections = new Map();

	const nodes = {
		near: new Map(),
		far: new Map()
	};

	// carry over nodes from previous layer without previous layer node connections
	for (const distType of Object.keys(layer.nodes)) {
		layer.nodes[distType].forEach((node, nodeKey) => {
			nodes[distType].set(nodeKey, new Node(
				node.x,
				node.y,
				node.z,
				nodeKey
			));
		});
	}

	const edges = {
		near: new Map(),
		far: new Map()
	};

	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (const distType of Object.keys(layer.faces)) {
		layer.faces[distType].forEach((face, _) => {
			// get face nodes
			const faceNodes = [];
			for (const nodeKey of face.nodes.sort()) {
				faceNodes.push(
					layer.nodes.far.get(nodeKey) ||
					layer.nodes.near.get(nodeKey)
				);
			}
			const [a, b, c] = faceNodes;

			// keep track of interFaceConnections
			const abInter = [];
			const bcInter = [];
			const acInter = [];

			const abEdgeKey = generateEdgeKey(a.name, b.name);
			const bcEdgeKey = generateEdgeKey(b.name, c.name);
			const acEdgeKey = generateEdgeKey(a.name, c.name);

			// how much to slide when sliding from node to node
			const slide = 2 / 3;

			// initialize node weights
			let aw = nv;
			let bw = 0;
			let cw = 0;

			let previouslySlidDown = false;

			let prevDepthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
			while (bw + .1 < nv) { // we have not yet reached node b // adding .1 in case of 7.99999... instead of 8
				if (previouslySlidDown) {
					// slide toward B
					aw -= slide;
					bw += 2 * slide;
					cw -= slide;
				} else {
					// slide away from A
					aw -= 2 * slide;
					bw += slide;
					cw += slide;
				}

				const depthNodeName = generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

				// create new node here if no node
				if (!getNode(nodes, depthNodeName).node) {
					const cmCoords = calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = normalizeNode(...cmCoords, radius);
					const newNode = new Node(...nCoords, depthNodeName);
					const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
					nodes[nodeIsNear].set(depthNodeName, newNode);
				}

				const prevDepthNode = getNode(nodes, prevDepthNodeName).node;
				const depthNode = getNode(nodes, depthNodeName).node;
				connectEdge(edges, prevDepthNode, depthNode, edgeColorMap);

				// connect interFace connections on edge AB
				if (cw < .1) {
					if (interFaceConnections.has(abEdgeKey)) {
						const connectedFaceNode = getNode(nodes, interFaceConnections.get(abEdgeKey)[(Math.floor(bw) / 2) - 1]).node;
						const nodeTowardA = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aw + 2, bw - 2, cw)).node;
						connectEdge(edges, prevDepthNode, connectedFaceNode, edgeColorMap);
						connectFace(faces, prevDepthNode, depthNode, connectedFaceNode, faceColorMap);
						connectFace(faces, prevDepthNode, connectedFaceNode, nodeTowardA, faceColorMap);
					} else {
						abInter.push(prevDepthNodeName);
					}
				}

				if (!previouslySlidDown && bw > 1) {
					// draw down-specific nodes and edges
					const rightNode = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aw + slide, bw - (2 * slide), cw + slide)).node;
					connectEdge(edges, depthNode, rightNode, edgeColorMap);
					connectFace(faces, prevDepthNode, depthNode, rightNode, faceColorMap);
				}

				// draw layer nodes
				let prevWidthNodeName = depthNodeName;
				let [aww, bww, cww] = [aw, bw, cw];

				while (aww > .1 && bww > .1) { // make sure aww and bww are not 'zero' (rounded)
					// slide toward C
					aww -= slide;
					bww -= slide;
					cww += 2 * slide;
					const widthNodeName = generateNodeKey(a.name, b.name, c.name, aww, bww, cww);

					if (!getNode(nodes, widthNodeName).node) {
						const cmCoords = calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);
						const nodeIsNear = isNear([newNode.z]) ? 'near' : 'far';
						nodes[nodeIsNear].set(widthNodeName, newNode);
					}

					const prevWidthNode = getNode(nodes, prevWidthNodeName).node;
					const widthNode = getNode(nodes, widthNodeName).node;
					connectEdge(edges, prevWidthNode, widthNode, edgeColorMap);

					// connect interFace connections on edge AC
					if (bww < .1) {
						if (interFaceConnections.has(acEdgeKey)) {
							const connectedFaceNode = getNode(nodes, interFaceConnections.get(acEdgeKey)[(Math.round(cww) / 2) - 1]).node;
							const nodeTowardA = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aww + 2, bww, cww - 2)).node;
							connectEdge(edges, prevWidthNode, connectedFaceNode, edgeColorMap);
							connectFace(faces, prevWidthNode, widthNode, connectedFaceNode, faceColorMap);
							connectFace(faces, prevWidthNode, connectedFaceNode, nodeTowardA, faceColorMap);
						} else {
							acInter.push(prevWidthNodeName);
						}
					}

					// connect interFace connections on edge BC
					if (aww < .1) {
						if (interFaceConnections.has(bcEdgeKey)) {
							const connectedFaceNode = getNode(nodes, interFaceConnections.get(bcEdgeKey)[(Math.round(cww) / 2) - 1]).node;
							const nodeTowardB = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aww, bww + 2, cww - 2)).node;
							connectEdge(edges, prevWidthNode, connectedFaceNode, edgeColorMap);
							connectFace(faces, prevWidthNode, widthNode, connectedFaceNode, faceColorMap);
							connectFace(faces, prevWidthNode, connectedFaceNode, nodeTowardB, faceColorMap);
						} else {
							bcInter.unshift(prevWidthNodeName);
						}
					}

					// if b > ~0 connect edge towards A
					if (bww > .1) {
						const upNode = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aww + (2 * slide), bww - slide, cww - slide)).node;
						connectEdge(edges, widthNode, upNode, edgeColorMap);
						connectFace(faces, prevWidthNode, widthNode, upNode, faceColorMap);
						// if b > 1 connect edge away from B
						if (bww > 1) {
							const rightNode = getNode(nodes, generateNodeKey(a.name, b.name, c.name, aww + slide, bww - (2 * slide), cww + slide)).node;
							connectEdge(edges, widthNode, rightNode, edgeColorMap);
							connectFace(faces, widthNode, upNode, rightNode, faceColorMap);
						}
					}


					prevWidthNodeName = widthNodeName;
				}

				previouslySlidDown = !previouslySlidDown;
				prevDepthNodeName = depthNodeName;
			}

			// update interFace connections
			if (!interFaceConnections.has(abEdgeKey)) interFaceConnections.set(abEdgeKey, abInter);
			if (!interFaceConnections.has(acEdgeKey)) interFaceConnections.set(acEdgeKey, acInter);
			if (!interFaceConnections.has(bcEdgeKey)) interFaceConnections.set(bcEdgeKey, bcInter);
		});
	}
	return { nodes, edges, faces };
}

/**
 * given 2 existing nodes, add a connected edge between them
 * @param {Edges} edges
 * @param {Node} node1
 * @param {Node} node2
 * @param {Map<number, number>} edgeColorMap
 */
const connectEdge = (edges, node1, node2, edgeColorMap) => {
	// generate name of new edge
	const edgeKey = generateEdgeKey(node1.name, node2.name);

	// connect edge to nodes
	node1.addEdge(edgeKey);
	node2.addEdge(edgeKey);

	// create new edge
	const newEdge = new Edge(node1, node2);

	const edgeColorKey = parseFloat(newEdge.length.toPrecision(10));
	if (edgeColorMap.has(edgeColorKey)) {
		newEdge.colorCode = edgeColorMap.get(edgeColorKey);
	} else {
		const edgeColorCode = edgeColorMap.size;
		edgeColorMap.set(edgeColorKey, edgeColorCode);
		newEdge.colorCode = edgeColorCode;
	}
	// find out view distance of edge
	const distType = isNear([node1.z, node2.z]) ? 'near' : 'far';

	// add edge to structure
	edges[distType].set(edgeKey, newEdge);
}

/**
 * given 3 existing nodes, add a connected face between them
 * @param {Faces} faces
 * @param {Node} node1
 * @param {Node} node2
 * @param {Node} node3
 * @param {string} faceType
 * @param {Map<number, number>} faceColorMap
 */
const connectFace = (faces, node1, node2, node3, faceColorMap) => {
	// generate name of new face
	const faceKey = generateFaceKey(node1.name, node2.name, node3.name);

	// connect face to nodes
	node1.addFace(faceKey);
	node2.addFace(faceKey);
	node3.addFace(faceKey);

	// create new face
	const newFace = new Face(node1, node2, node3);

	const faceColorKey = parseFloat(newFace.area.toPrecision(10));
	if (faceColorMap.has(faceColorKey)) {
		newFace.colorCode = faceColorMap.get(faceColorKey);
	} else {
		const faceColorCode = faceColorMap.size;
		faceColorMap.set(faceColorKey, faceColorCode);
		newFace.colorCode = faceColorCode;
	}

	// find out view distance of face
	const distType = isNear([node1.z, node2.z, node3.z]) ? 'near' : 'far';

	// add face to structure
	faces[distType].set(faceKey, newFace);
}

export {
	buildIcosahedronAtFrequency
}
