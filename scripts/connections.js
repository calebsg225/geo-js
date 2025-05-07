import * as Types from "./types.js";
import { Edge, Face } from "./structures.js";
import * as util from "./util.js";

/**
 * given 2 existing nodes, add a connected edge between them
 * @param {Types.Edges} edges
 * @param {Types.Nodes} node1
 * @param {Types.Nodes} node2
 * @param {Map<number, number>} edgeColorMap
 */
const connectEdge = (edges, node1, node2, edgeColorMap) => {
	// generate name of new edge
	const edgeKey = util.generateEdgeKey(node1.name, node2.name);

	// connect edge to nodes
	node1.addEdge(edgeKey);
	node2.addEdge(edgeKey);

	// create new edge
	const newEdge = new Edge(node1, node2);

	// update color map
	const edgeColorKey = parseFloat(newEdge.length.toPrecision(10));
	if (edgeColorMap.has(edgeColorKey)) {
		newEdge.colorCode = edgeColorMap.get(edgeColorKey);
	} else {
		const edgeColorCode = edgeColorMap.size - 1;
		edgeColorMap.set(edgeColorKey, edgeColorCode);
		newEdge.colorCode = edgeColorCode;
	}

	// keep track of largest edge length
	if (newEdge.length > edgeColorMap.get('maxEdgeLength')) {
		edgeColorMap.set('maxEdgeLength', newEdge.length);
	}

	// find out view distance of edge
	const distType = util.isNear([node1.z, node2.z]) ? 'near' : 'far';

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
	const faceKey = util.generateFaceKey(node1.name, node2.name, node3.name);

	// connect face to nodes
	node1.addFace(faceKey);
	node2.addFace(faceKey);
	node3.addFace(faceKey);

	// create new face
	const newFace = new Face(node1, node2, node3);

	const { orderedNodes } = util.orderFaceNodesByNormal([node1, node2, node3]);
	const [n1, n2, n3] = orderedNodes;
	// calculate edge lengths of each
	const es = [
		+util.calc3dDistance(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z).toPrecision(8),
		+util.calc3dDistance(n3.x, n3.y, n3.z, n2.x, n2.y, n2.z).toPrecision(8),
		+util.calc3dDistance(n1.x, n1.y, n1.z, n3.x, n3.y, n3.z).toPrecision(8)
	];
	// find which one is largest
	let bgst = 0;
	if (es[1] > es[0]) bgst = 1;
	if (es[2] > es[bgst]) bgst = 2;
	// deal with isosceles triangles
	if (es[bgst] === es[(bgst + 1) % 3]) bgst = (bgst + 1) % 3;
	// use the clockwise edge
	let cwe = (bgst + 1) % 3;
	const sm = (es[cwe] - Math.trunc(es[cwe])).toPrecision(5).substring(2);

	const faceColorKey = parseFloat(newFace.area.toPrecision(8) + sm);
	if (faceColorMap.has(faceColorKey)) {
		newFace.colorCode = faceColorMap.get(faceColorKey);
	} else {
		const faceColorCode = faceColorMap.size;
		faceColorMap.set(faceColorKey, faceColorCode);
		newFace.colorCode = faceColorCode;
	}

	// find out view distance of face
	const distType = util.isNear([node1.z, node2.z, node3.z]) ? 'near' : 'far';

	// add face to structure
	faces[distType].set(faceKey, newFace);
}

export {
	connectEdge,
	connectFace,
}
