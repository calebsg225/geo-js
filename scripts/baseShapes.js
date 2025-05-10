import * as Types from "./types.js";
import { Node } from "./structures.js";
import { connectFace, connectEdge } from "./connections.js";
import * as util from "./util.js";

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

	/** @type {Map<(number | string), number>} */
	const edgeColorMap = new Map();

	// piggy back off of edgeColorMap to store maxEdgeLength
	edgeColorMap.set('maxEdgeLength', -Infinity);

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (let i = 0; i < 12; i++) {
		const nodeName = util.numToChar(i);
		const node = new Node(
			coords[i][0] * scale,
			coords[i][1] * scale,
			coords[i][2] * scale,
			nodeName
		);

		const connections = util.getBaseIcosahedronConnections(i);

		for (let con = 0; con < connections.length; con++) {
			const conName = util.numToChar(connections[con]);
			const con2Name = util.numToChar(connections[(con + 1) % 5]);
			const edgeName = [nodeName, conName].sort().join('-');
			const faceName = [nodeName, conName, con2Name].sort().join('-');

			const conNode = util.getNode(nodes, conName).node;

			// connect edges
			if (
				util.getNode(nodes, conName).node &&
				!util.getEdge(edges, edgeName).edge
			) {
				connectEdge(edges, node, conNode, edgeColorMap);
			}

			// connect faces
			if (
				util.getNode(nodes, conName).node &&
				util.getNode(nodes, con2Name).node &&
				!util.getFace(faces, faceName).face
			) {
				const con2Node = util.getNode(nodes, con2Name).node;
				connectFace(faces, node, conNode, con2Node, faceColorMap);
			}
		}

		// add node to nodes
		if (util.isNear([node.z])) {
			nodes.near.set(node.name, node);
		} else {
			nodes.far.set(node.name, node);
		}
	}
	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') }
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

	/** @type {Map<(number | string), number>} */
	const edgeColorMap = new Map();

	// piggy back off of edgeColorMap to store maxEdgeLength
	edgeColorMap.set('maxEdgeLength', -Infinity);

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (let i = 0; i < 4; i++) {
		const nodeName = util.numToChar(i);
		const node = new Node(...coords[i], nodeName);

		// connect edges from nodes B, C, and D
		for (let j = i - 1; j >= 0; j--) {
			const connectedEdgeNode = util.getNode(nodes, util.numToChar(j)).node;
			connectEdge(edges, node, connectedEdgeNode, edgeColorMap);
			// connect faces from nodes C and D
			for (let k = j - 1; k >= 0; k--) {
				connectFace(faces, node, connectedEdgeNode, util.getNode(nodes, util.numToChar(k)).node, faceColorMap);
			}
		}

		const nodeDistType = util.isNear([node.z]) ? 'near' : 'far';
		nodes[nodeDistType].set(nodeName, node);
	}

	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') };
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

	/** @type {Map<(number | string), number>} */
	const edgeColorMap = new Map();

	// piggy back off of edgeColorMap to store maxEdgeLength
	edgeColorMap.set('maxEdgeLength', -Infinity);

	/** @type {Map<number, number>} */
	const faceColorMap = new Map();

	for (let i = 0; i < 6; i++) {
		const nodeName = util.numToChar(i);
		const node = new Node(...coords[i], nodeName);

		for (let j = 0; j < 2; j++) {
			if (i < 2) continue;
			const connectedNode = util.getNode(nodes, util.numToChar(j)).node;
			connectEdge(edges, node, connectedNode, edgeColorMap);
			for (let k = 2; k < 4; k++) {
				if (i < 4) continue;
				const connectedMidNode = util.getNode(nodes, util.numToChar(k)).node;
				connectEdge(edges, node, connectedMidNode, edgeColorMap);
				connectFace(faces, node, connectedNode, connectedMidNode, faceColorMap);
			}
		}

		const nodeDistType = util.isNear([node.z]) ? 'near' : 'far';
		nodes[nodeDistType].set(nodeName, node);
	}

	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') };
}

export default {
	"tetrahedron": generateBaseTetrahedron,
	"octahedron": generateBaseOctahedron,
	"icosahedron": generateBaseIcosahedron,
};
