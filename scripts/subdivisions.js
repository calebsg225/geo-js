import * as Types from "./types.js";
import { Node } from "./structures.js";
import { connectFace, connectEdge } from "./connections.js";
import * as util from "./util.js";

/**
 * creates a class I subdivision of the inputed structure layer
 * @param {Types.StructureLayer} layer
 * @param {BuildOptions} options
 * @param {number[]} frequency
 * @returns {Types.StructureLayer}
 */
const classILayer = (layer, options, frequency) => {
	const nv = frequency[0] + frequency[1];
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

	/** @type {Map<(number | string), number>} */
	const edgeColorMap = new Map();

	// piggy back off of edgeColorMap to store maxEdgeLength
	edgeColorMap.set('maxEdgeLength', -Infinity);

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

			// initialize node weights
			let aw = nv;
			let bw = 0;
			let cw = 0;

			let prevDepthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
			while (bw < nv) { // can still slide from a to b
				const { node: prevDepthNode } = util.getNode(nodes, prevDepthNodeName);
				// slide from a to b
				aw -= 1;
				bw += 1;
				const depthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

				// if node does not exist, create node
				if (!util.getNode(nodes, depthNodeName).node) {
					// calculate coords for new node
					const cmCoords = util.calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = util.normalizeNode(...cmCoords, radius);
					// create new node
					const newNode = new Node(...nCoords, depthNodeName);

					const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
					// add new node to new layer
					nodes[nodeIsNear].set(depthNodeName, newNode);
				}

				const { edge: depthEdge } = util.getEdge(edges, util.generateEdgeKey(prevDepthNodeName, depthNodeName));

				// if edge between nodes does not exist, connect edge
				if (!depthEdge) {
					const { node: depthNode } = util.getNode(nodes, depthNodeName);
					connectEdge(edges, depthNode, prevDepthNode, edgeColorMap);
				}


				let prevWidthNodeName = depthNodeName;
				let [aww, bww, cww] = [aw, bw, cw];
				while (bww) { // can still slide from b to c
					const { node: prevWidthNode } = util.getNode(nodes, prevWidthNodeName);
					// slide from b to c
					bww -= 1;
					cww += 1;
					const widthNodeName = util.generateNodeKey(a.name, b.name, c.name, aww, bww, cww);

					// if node does not exist, create node
					if (!util.getNode(nodes, widthNodeName).node) {
						const cmCoords = util.calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = util.normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);

						const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
						nodes[nodeIsNear].set(widthNodeName, newNode);
					}

					const { edge: widthEdge } = util.getEdge(edges, util.generateEdgeKey(prevWidthNodeName, widthNodeName));

					const { node: widthNode } = util.getNode(nodes, widthNodeName);
					// if edge does not exist, connect edge
					if (!widthEdge) {
						connectEdge(edges, prevWidthNode, widthNode, edgeColorMap);
					}

					// add face
					const topNodeName = util.generateNodeKey(a.name, b.name, c.name, aww + 1, bww, cww - 1);
					const { node: topNode } = util.getNode(nodes, topNodeName);
					connectFace(faces, prevWidthNode, widthNode, topNode, faceColorMap);

					// add bc edge if it does not exist. This is a must for structures built off of more than one layer.
					if (!util.getEdge(edges, util.generateEdgeKey(widthNode, topNode)).edge) {
						connectEdge(edges, widthNode, topNode, edgeColorMap);
					}

					// if node is not on the top edges, create angled edges and face
					if (bww && cww) {
						const leftNodeName = util.generateNodeKey(a.name, b.name, c.name, aww + 1, bww, cww - 1);
						const rightNodeName = util.generateNodeKey(a.name, b.name, c.name, aww + 1, bww - 1, cww);
						const { node: leftNode } = util.getNode(nodes, leftNodeName);
						const { node: rightNode } = util.getNode(nodes, rightNodeName);
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
	console.log(`~~~~~~~~ LAYER Class I: ${nv}v ~~~~~~~~`);
	console.log('total node count: ', nodes.far.size + nodes.near.size);
	console.log('total unique edges: ', edgeColorMap.size - 1);
	console.log('total unique faces: ', faceColorMap.size);
	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') };
}

/**
 * creates a class II subdivision of the inputed structure layer
 * @param {Types.StructureLayer} layer
 * @param {BuildOptions} options
 * @param {number[]} frequency
 * @returns {Types.StructureLayer}
 */
const classIILayer = (layer, options, frequency) => {
	const nv = frequency[0] + frequency[1];
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

	for (const distType of Object.keys(layer.faces)) {
		layer.faces[distType].forEach((face, _) => {
			// get face nodes
			/** @type {Node[]} **/
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

			const abEdgeKey = util.generateEdgeKey(a.name, b.name);
			const bcEdgeKey = util.generateEdgeKey(b.name, c.name);
			const acEdgeKey = util.generateEdgeKey(a.name, c.name);

			// how much to slide when sliding from node to node
			const slide = 2 / 3;

			// initialize node weights
			let aw = nv;
			let bw = 0;
			let cw = 0;

			let previouslySlidDown = false;

			let prevDepthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
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

				const depthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

				// create new node here if no node
				if (!util.getNode(nodes, depthNodeName).node) {
					const cmCoords = util.calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = util.normalizeNode(...cmCoords, radius);
					const newNode = new Node(...nCoords, depthNodeName);
					const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
					nodes[nodeIsNear].set(depthNodeName, newNode);
				}

				const prevDepthNode = util.getNode(nodes, prevDepthNodeName).node;
				const depthNode = util.getNode(nodes, depthNodeName).node;
				connectEdge(edges, prevDepthNode, depthNode, edgeColorMap);

				// connect interFace connections on edge AB
				if (cw < .1) {
					if (interFaceConnections.has(abEdgeKey)) {
						const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(abEdgeKey)[(Math.floor(bw) / 2) - 1]).node;
						const nodeTowardA = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aw + 2, bw - 2, cw)).node;
						connectEdge(edges, prevDepthNode, connectedFaceNode, edgeColorMap);
						connectFace(faces, prevDepthNode, depthNode, connectedFaceNode, faceColorMap);
						connectFace(faces, prevDepthNode, connectedFaceNode, nodeTowardA, faceColorMap);
					} else {
						abInter.push(prevDepthNodeName);
					}
				}

				if (!previouslySlidDown && bw > 1) {
					// draw down-specific nodes and edges
					const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aw + slide, bw - (2 * slide), cw + slide)).node;
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
					const widthNodeName = util.generateNodeKey(a.name, b.name, c.name, aww, bww, cww);

					if (!util.getNode(nodes, widthNodeName).node) {
						const cmCoords = util.calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = util.normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);
						const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
						nodes[nodeIsNear].set(widthNodeName, newNode);
					}

					const prevWidthNode = util.getNode(nodes, prevWidthNodeName).node;
					const widthNode = util.getNode(nodes, widthNodeName).node;
					connectEdge(edges, prevWidthNode, widthNode, edgeColorMap);

					// connect interFace connections on edge AC
					if (bww < .1) {
						if (interFaceConnections.has(acEdgeKey)) {
							const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(acEdgeKey)[(Math.round(cww) / 2) - 1]).node;
							const nodeTowardA = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + 2, bww, cww - 2)).node;
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
							const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[(Math.round(cww) / 2) - 1]).node;
							const nodeTowardB = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww, bww + 2, cww - 2)).node;
							connectEdge(edges, prevWidthNode, connectedFaceNode, edgeColorMap);
							connectFace(faces, prevWidthNode, widthNode, connectedFaceNode, faceColorMap);
							connectFace(faces, prevWidthNode, connectedFaceNode, nodeTowardB, faceColorMap);
						} else {
							bcInter.unshift(prevWidthNodeName);
						}
					}

					// if b > ~0 connect edge towards A
					if (bww > .1) {
						const upNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + (2 * slide), bww - slide, cww - slide)).node;
						connectEdge(edges, widthNode, upNode, edgeColorMap);
						connectFace(faces, prevWidthNode, widthNode, upNode, faceColorMap);
						// if b > 1 connect edge away from B
						if (bww > 1) {
							const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + slide, bww - (2 * slide), cww + slide)).node;
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
	console.log(`~~~~~~~~ LAYER Class II: ${nv}v ~~~~~~~~`);
	console.log('total node count: ', nodes.far.size + nodes.near.size);
	console.log('total unique edges: ', edgeColorMap.size - 1);
	console.log('total unique faces: ', faceColorMap.size);
	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') };
}

/**
 * creates a class III subdivision of the inputed structure layer
 * @param {StructureLayer} layer
 * @param {Object} options
 * @param {number[]} frequency
 * @returns {StructureLayer}
 */
const classIIILayer = (layer, options, frequency) => {
	const [mInitial, nInitial] = frequency;
	let reverseOrder = mInitial < nInitial ? true : false;
	const [m, n] = reverseOrder ? [nInitial, mInitial] : [mInitial, nInitial];
	const v = m + n;
	const radius = options.sizeConstraint * options.fillPercentage / 2;

	const s3 = Math.sqrt(3);
	// calculate the number of triangles resulting from Class III subdivision
	const triangleCount = m ** 2 + m * n + n ** 2;

	// calculate the ratio between the height of a classI v triangle and the height of a classIII v triangle
	const u = (2 * v) / (Math.sqrt(triangleCount) * s3);

	const rL = (m - n) / (v * s3);
	const rM = (v + n) / (m * s3);
	const rS = (v + m) / (n * s3);

	// large, medium, and small slide values
	const sL = u / Math.sqrt(rL ** 2 + 1);
	const sM = u / Math.sqrt(rM ** 2 + 1);
	const sS = u / Math.sqrt(rS ** 2 + 1);

	// approximate zero (lower bound) for rounding error
	const zero = -0.0000001;

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

	for (const distType of Object.keys(layer.faces)) {
		layer.faces[distType].forEach((face, _) => {
			// get face nodes
			/** @type {Node[]} **/
			const faceNodes = [];
			for (const nodeKey of face.nodes.sort()) {
				faceNodes.push(
					layer.nodes.far.get(nodeKey) ||
					layer.nodes.near.get(nodeKey)
				);
			}

			// order nodes based on normal vector
			const { orderedNodes: [a, b, c], swapped } = util.orderFaceNodesByNormal(faceNodes, reverseOrder);

			// keep track of interFaceConnections
			const abInter = [];
			const bcInter = new Array(v - 1);
			const acInter = [];

			const abEdgeKey = util.generateEdgeKey(a.name, b.name);
			const bcEdgeKey = util.generateEdgeKey(b.name, c.name);
			const acEdgeKey = util.generateEdgeKey(a.name, c.name);

			// initialize node weights
			let aw = v;
			let bw = 0;
			let cw = 0;

			let prevDepthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);

			while (aw - sS >= zero) {
				let wentDown = false;
				// try to slide along cb, otherwise slide along ab
				if (cw - sM >= zero) {
					aw -= sS;
					bw += sL;
					cw -= sM;
				} else {
					aw -= sL;
					bw += sM;
					cw += sS;
					wentDown = true;
				}

				const depthNodeName = util.generateNodeKey(a.name, b.name, c.name, aw, bw, cw);
				// create new node here if no node
				if (!util.getNode(nodes, depthNodeName).node) {
					const cmCoords = util.calcMidNodeCoords(a, b, c, aw, bw, cw);
					const nCoords = util.normalizeNode(...cmCoords, radius);
					const newNode = new Node(...nCoords, depthNodeName);
					const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
					nodes[nodeIsNear].set(depthNodeName, newNode);
				}

				// draw internal edges along base edge AB
				const depthNode = util.getNode(nodes, depthNodeName).node;
				const prevDepthNode = util.getNode(nodes, prevDepthNodeName).node;
				connectEdge(edges, prevDepthNode, depthNode, edgeColorMap);

				if (wentDown && bw - sL >= zero) {
					const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aw + sS, bw - sL, cw + sM)).node;
					connectEdge(edges, depthNode, rightNode, edgeColorMap);
					connectFace(faces, prevDepthNode, depthNode, rightNode, faceColorMap);
				}

				// connect interFace connections on edge AB
				if (cw - sL <= -zero) {
					const ind = v - Math.ceil(aw + zero) - 1;
					if (interFaceConnections.has(abEdgeKey)) {
						const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(abEdgeKey)[ind]).node;
						const prevConnectedFaceNode = util.getNode(nodes, interFaceConnections.get(abEdgeKey)[ind - 1]).node;
						if (wentDown) {
							connectEdge(edges, depthNode, connectedFaceNode, edgeColorMap);
							connectFace(faces, prevDepthNode, depthNode, connectedFaceNode, faceColorMap);
							if (ind) {
								if (prevDepthNode.name !== prevConnectedFaceNode.name) {
									connectFace(faces, prevDepthNode, prevConnectedFaceNode, connectedFaceNode, faceColorMap);
								}
								connectEdge(edges, prevDepthNode, connectedFaceNode, edgeColorMap);
							}
						} else {
							// node is not on the AB edge
							if (cw >= -zero) {
								connectEdge(edges, depthNode, connectedFaceNode, edgeColorMap);
								connectEdge(edges, depthNode, prevConnectedFaceNode, edgeColorMap);
								connectFace(faces, depthNode, prevConnectedFaceNode, connectedFaceNode, faceColorMap);
							}
							connectFace(faces, depthNode, prevDepthNode, prevConnectedFaceNode, faceColorMap);
						}
					} else if (bw < v + zero) {
						abInter.push(depthNodeName);
					}
				}

				// add first interFace node on edge AC
				if (aw + sL >= v + zero) {
					if (interFaceConnections.has(acEdgeKey)) {
						const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(acEdgeKey)[0]).node;
						connectEdge(edges, depthNode, connectedFaceNode, edgeColorMap);
						connectFace(faces, prevDepthNode, depthNode, connectedFaceNode, faceColorMap);
					} else {
						acInter.push(depthNodeName);
					}
				}

				// add first interFace node on edge BC
				if (bw + sL >= v + zero && bw <= v + zero) {
					// if nodes B and C were swapped on this face, reverse bcInter order
					const ind = swapped ? v - 2 : 0;
					if (interFaceConnections.has(bcEdgeKey)) {
						const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[ind]).node;
						const prevConnectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[ind + (swapped ? -1 : 1)]).node;
						const nodeB = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aw - sS, bw + sL, cw - sM)).node;
						const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aw + sS, bw - sL, cw + sM)).node;
						connectEdge(edges, depthNode, connectedFaceNode, edgeColorMap);
						connectEdge(edges, depthNode, prevConnectedFaceNode, edgeColorMap);
						connectFace(faces, nodeB, depthNode, connectedFaceNode, faceColorMap);
						connectFace(faces, depthNode, connectedFaceNode, prevConnectedFaceNode, faceColorMap);
						connectFace(faces, depthNode, rightNode, prevConnectedFaceNode, faceColorMap);
					} else {
						bcInter[ind] = depthNodeName;
					}
				}

				let [aww, bww, cww] = [aw, bw, cw];
				let prevWidthNodeName = depthNodeName;

				while (bww - sS >= zero && aww - sM >= zero) {
					aww -= sM;
					bww -= sS;
					cww += sL;

					const widthNodeName = util.generateNodeKey(a.name, b.name, c.name, aww, bww, cww);
					// create new node here if no node
					if (!util.getNode(nodes, widthNodeName).node) {
						const cmCoords = util.calcMidNodeCoords(a, b, c, aww, bww, cww);
						const nCoords = util.normalizeNode(...cmCoords, radius);
						const newNode = new Node(...nCoords, widthNodeName);
						const nodeIsNear = util.isNear([newNode.z]) ? 'near' : 'far';
						nodes[nodeIsNear].set(widthNodeName, newNode);
					}

					// draw main internal edges towards base node C
					const widthNode = util.getNode(nodes, widthNodeName).node;
					const prevWidthNode = util.getNode(nodes, prevWidthNodeName).node;
					connectEdge(edges, widthNode, prevWidthNode, edgeColorMap);


					// draw secondary internal edges and faces
					if (bww - sM >= zero) {
						const upNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + sL, bww - sM, cww - sS)).node;
						connectEdge(edges, widthNode, upNode, edgeColorMap);
						connectFace(faces, prevWidthNode, widthNode, upNode, faceColorMap);

						if (bww - sL >= zero) {
							const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + sS, bww - sL, cww + sM)).node;
							connectEdge(edges, widthNode, rightNode, edgeColorMap);
							connectFace(faces, widthNode, upNode, rightNode, faceColorMap);
						}
					}

					// connect interFace connections on edge AC
					if (bww - sL <= zero) {
						const ind = Math.ceil(cww + zero) - 1;
						if (interFaceConnections.has(acEdgeKey)) {
							const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(acEdgeKey)[ind]).node;
							const prevConnectedFaceNode = util.getNode(nodes, interFaceConnections.get(acEdgeKey)[ind - 1]).node;
							// not last node
							if (bww >= -zero) {
								const upNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + sL, bww - sM, cww - sS)).node;
								connectEdge(edges, widthNode, connectedFaceNode, edgeColorMap);
								// up node is on other face
								if (bww - sM <= zero) {
									connectEdge(edges, widthNode, prevConnectedFaceNode, edgeColorMap);
									connectFace(faces, widthNode, prevConnectedFaceNode, connectedFaceNode, faceColorMap);
								} else {
									connectFace(faces, upNode, widthNode, connectedFaceNode, faceColorMap);
									if (upNode.name !== prevConnectedFaceNode.name) {
										connectFace(faces, upNode, connectedFaceNode, prevConnectedFaceNode, faceColorMap);
									}
									connectEdge(edges, upNode, connectedFaceNode, edgeColorMap);
								}
							}
							// up node is on other face
							if (bww - sM <= zero) {
								connectFace(faces, prevWidthNode, widthNode, prevConnectedFaceNode, faceColorMap);
							}
						} else if (cww < v + zero) {
							acInter.push(widthNodeName);
						}
					}

					// connect interFace connections on edge BC
					if (aww - sL <= zero) {
						// if nodes B and C were swapped on this face, reverse bcInter order
						const ind = swapped ? v - Math.ceil(cww + zero) - 1 : Math.ceil(cww + zero) - 1;
						if (interFaceConnections.has(bcEdgeKey)) {
							const connectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[ind]).node;
							const prevConnectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[ind + (swapped ? -1 : 1)]).node;
							const nextConnectedFaceNode = util.getNode(nodes, interFaceConnections.get(bcEdgeKey)[ind + (swapped ? 1 : -1)]).node;
							const rightNode = util.getNode(nodes, util.generateNodeKey(a.name, b.name, c.name, aww + sS, bww - sL, cww + sM)).node;
							if (aww >= -zero) {
								// previous and next node order depends on if B and C were swapped
								connectEdge(edges, widthNode, connectedFaceNode, edgeColorMap);
								// down node is on other face
								if (aww - sM <= zero) {
									connectEdge(edges, widthNode, prevConnectedFaceNode, edgeColorMap);
									connectFace(faces, widthNode, prevConnectedFaceNode, connectedFaceNode, faceColorMap);
									connectFace(faces, widthNode, rightNode, prevConnectedFaceNode, faceColorMap);
								}
								// down node is on other face
								if (aww - sS <= zero) {
									connectEdge(edges, widthNode, nextConnectedFaceNode, edgeColorMap);
									connectFace(faces, prevWidthNode, widthNode, nextConnectedFaceNode, faceColorMap);
									connectFace(faces, widthNode, connectedFaceNode, nextConnectedFaceNode, faceColorMap);
								}
							} else {
								connectFace(faces, prevWidthNode, widthNode, nextConnectedFaceNode, faceColorMap);
								if (cww < v + zero) {
									connectFace(faces, widthNode, rightNode, prevConnectedFaceNode, faceColorMap);
								}
							}
						} else if (cww < v + zero) {
							bcInter[ind] = widthNodeName;
						}
					}

					prevWidthNodeName = widthNodeName;
				}
				prevDepthNodeName = depthNodeName;
			}
			// update interFace connections
			if (!interFaceConnections.has(abEdgeKey)) interFaceConnections.set(abEdgeKey, abInter);
			if (!interFaceConnections.has(acEdgeKey)) interFaceConnections.set(acEdgeKey, acInter);
			if (!interFaceConnections.has(bcEdgeKey)) interFaceConnections.set(bcEdgeKey, bcInter);
		});
	}
	console.log(`~~~~~~~~ LAYER Class III: {${mInitial}, ${nInitial}} ${v}v ~~~~~~~~`);
	console.log('total node count: ', nodes.far.size + nodes.near.size);
	console.log('total unique edges: ', edgeColorMap.size - 1);
	console.log('total unique faces: ', faceColorMap.size);
	return { nodes, edges, faces, maxEdgeLength: edgeColorMap.get('maxEdgeLength') };
}

export default {
	"classI": classILayer,
	"classII": classIILayer,
	"classIII": classIIILayer,
};
