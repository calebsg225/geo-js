import * as Types from "./types.js";
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

/**
 * generates base icosahedron structure
 * @param {Types.BuildOptions} options
 * @returns {Types.StructureLayer}
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

	/** @type {Types.Nodes} */
	const nodes = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Edges} */
	const edges = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Faces} */
	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

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

			const conNode = getNode(nodes, conName).node;

			// connect edges
			if (
				getNode(nodes, conName).node &&
				!getEdge(edges, edgeName).edge
			) {
				connectEdge(edges, node, conNode, edgeColorMap);
			}

			// connect faces
			if (
				getNode(nodes, conName).node &&
				getNode(nodes, con2Name).node &&
				!getFace(faces, faceName).face
			) {
				const con2Node = getNode(nodes, con2Name).node;
				connectFace(faces, node, conNode, con2Node, faceColorMap);
			}
		}

		// add node to nodes
		if (isNear([node.z])) {
			nodes.near.set(node.name, node);
		} else {
			nodes.far.set(node.name, node);
		}
	}
	return { nodes, edges, faces, maxEdgeLength: edges.near.get('a-b').length }
}

/**
 * generates base tetrahedron structure
 * @param {BuildOptions} options
 * @returns {Types.StructureLayer}
 */
const generateBaseTetrahedron = (options) => {
	const r = options.sizeConstraint * options.fillPercentage / 2;
	// x, y, and z vectors result in radius vector
	const d = Math.sqrt(r ** 2 / 3);

	// tetrahedron node coords
	const coords = [
		[d, d, d],
		[-d, d, -d],
		[d, -d, -d],
		[-d, -d, d],
	];

	/** @type {Types.Nodes} */
	const nodes = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Edges} */
	const edges = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Faces} */
	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (let i = 0; i < 4; i++) {
		const nodeName = numToChar(i);
		const node = new Node(...coords[i], nodeName);

		// connect edges from nodes B, C, and D
		for (let j = i - 1; j >= 0; j--) {
			const connectedEdgeNode = getNode(nodes, numToChar(j)).node;
			connectEdge(edges, node, connectedEdgeNode, edgeColorMap);
			// connect faces from nodes C and D
			for (let k = j - 1; k >= 0; k--) {
				connectFace(faces, node, connectedEdgeNode, getNode(nodes, numToChar(k)).node, faceColorMap);
			}
		}

		const nodeDistType = isNear([node.z]) ? 'near' : 'far';
		nodes[nodeDistType].set(nodeName, node);
	}

	return { nodes, edges, faces, maxEdgeLength: edges.near.get('a-b').length };
}

/**
 * generates base octahedron structure
 * @param {BuildOptions} options
 * @returns {Types.StructureLayer}
 */
const generateBaseOctahedron = (options) => {
	const r = options.sizeConstraint * options.fillPercentage / 2;

	// octahedron node coords
	const coords = [
		[r, 0, 0],
		[-r, 0, 0],
		[0, r, 0],
		[0, -r, 0],
		[0, 0, r],
		[0, 0, -r],
	];

	/** @type {Types.Nodes} */
	const nodes = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Edges} */
	const edges = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Faces} */
	const faces = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Map<number, number>} */
	const edgeColorMap = new Map();

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (let i = 0; i < 6; i++) {
		const nodeName = numToChar(i);
		const node = new Node(...coords[i], nodeName);

		for (let j = 0; j < 2; j++) {
			if (i < 2) continue;
			const connectedNode = getNode(nodes, numToChar(j)).node;
			connectEdge(edges, node, connectedNode, edgeColorMap);
			for (let k = 2; k < 4; k++) {
				if (i < 4) continue;
				const connectedMidNode = getNode(nodes, numToChar(k)).node;
				connectEdge(edges, node, connectedMidNode, edgeColorMap);
				connectFace(faces, node, connectedNode, connectedMidNode, faceColorMap);
			}
		}

		const nodeDistType = isNear([node.z]) ? 'near' : 'far';
		nodes[nodeDistType].set(nodeName, node);
	}

	return { nodes, edges, faces, maxEdgeLength: edges.near.get('a-c').length };
}

/**
 * creates a class I subdivision of the inputed structure layer
 * @param {Types.StructureLayer} layer
 * @param {BuildOptions} options
 * @param {number} nv frequency
 * @returns {Types.StructureLayer}
 */
const classILayer = (layer, options, nv) => {
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

	/** @type {Types.Edges} */
	const edges = {
		near: new Map(),
		far: new Map()
	};

	/** @type {Types.Faces} */
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
 * @param {Types.StructureLayer} layer
 * @param {BuildOptions} options
 * @param {number} nv frequency
 * @returns {Types.StructureLayer}
 */
const classIILayer = (layer, options, nv) => {
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
 * @param {Types.Edges} edges
 * @param {Types.Nodes} node1
 * @param {Types.Nodes} node2
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
 * @param {Types.Faces} faces
 * @param {Types.Nodes} node1
 * @param {Types.Nodes} node2
 * @param {Types.Nodes} node3
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
	generateBaseIcosahedron,
	generateBaseOctahedron,
	generateBaseTetrahedron,
	classILayer,
	classIILayer,
}
