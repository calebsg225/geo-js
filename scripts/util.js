/**
 * calculates the distance between two Nodes
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} dx
 * @param {number} dy
 * @param {number} dz
 * @return {number}
 */
const calc3dDistance = (x, y, z, dx, dy, dz) => {
	return Math.sqrt((dx - x) ** 2 + (dy - y) ** 2 + (dz - z) ** 2);
}

/**
 * returns true if averageZ is negative
 * @param {number[]} zs array of z values to average
 * @returns {boolean}
 */
const isNear = (zs) => {
	let sum = 0;
	for (let z = 0; z < zs.length; z++) {
		sum += zs[z];
	}
	return sum / zs.length <= 0;
}

/**
 * orders face nodes around its normal vector
 * @param {Node[]} faceNodes array of face nodes
 * @param {boolean} reverseOrder swapped m and n
 * @returns {orderedNodes: Node[], swapped: boolean}
 */
const orderFaceNodesByNormal = (faceNodes, reverseOrder = false) => {
	// order with normal vector
	// if normal vector points to origin: swap b and c
	const [a, bInitial, cInitial] = faceNodes;

	// keep track of whether a and b were swapped
	const swapped = faceNormal(a, bInitial, cInitial).flipped ^ reverseOrder;

	// if either flipped or reverse order, flip b and c
	const [b, c] = swapped ? [cInitial, bInitial] : [bInitial, cInitial];
	return { orderedNodes: [a, b, c], swapped: swapped };
}

/**
 * calculate the resultant vector of 2 vectors
 * @param {number[]} v1
 * @param {number[]} v2
 * @returns {number[]}
 */
const resultant = (v1, v2) => {
	return [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
}

/**
 * calculate the cross product given 2 vectors
 * @param {number[]} v1
 * @param {number[]} v2
 * @returns {number[]}
 */
const crossProd = (v1, v2) => {
	return [
		v1[1] * v2[2] - v2[1] * v1[2],
		v1[2] * v2[0] - v2[2] * v1[0],
		v1[0] * v2[1] - v2[0] * v1[1]
	];
}

/**
 * calulates the normal vector of a face (points away from origin)
 * @param {Node} a
 * @param {Node} b
 * @param {Node} c
 * @param {number} r radius used to adjust to perspective projection
 * @returns {{coords: number[], flipped: boolean}}
 */
const faceNormal = (a, b, c, r = 0) => {
	const ax = r ? pp(r, a.x, a.z) : a.x;
	const ay = r ? pp(r, a.y, a.z) : a.y;
	const bx = r ? pp(r, b.x, b.z) : b.x;
	const by = r ? pp(r, b.y, b.z) : b.y;
	const cx = r ? pp(r, c.x, c.z) : c.x;
	const cy = r ? pp(r, c.y, c.z) : c.y;

	const ab = resultant([ax, ay, a.z], [bx, by, b.z]);
	const ac = resultant([ax, ay, a.z], [cx, cy, c.z]);

	// calculate corss product
	const cp = crossProd(ab, ac);

	// find the angle between a and the cross product
	const theta = Math.acos((ax * cp[0] + ay * cp[1] + a.z * cp[2]) / (Math.sqrt(ax ** 2 + ay ** 2 + a.z ** 2) * Math.sqrt(cp[0] ** 2 + cp[1] ** 2 + cp[2] ** 2)));

	// swap if needed
	if (theta > Math.PI / 2) return { coords: cp.map(n => n * -1), flipped: true };
	return { coords: cp, flipped: false };
}

/**
 * determines whether a face is near or far based on its normal vector
 * only 3 nodes is required for any face: normal is calculated the same regardless
 * @param {Node} n1
 * @param {Node} n2
 * @param {Node} n3
 * @param {number} r used to adjust to perspective projection
 * @returns {boolean}
 */
const isFaceNear = (n1, n2, n3, r = 0) => {
	// deal with any stray inputs, less computation required for these
	if (n1.z > 0 && n2.z > 0 && n3.z > 0) return false;
	if (n1.z <= 0 && n2.z <= 0 && n3.z <= 0) return true;

	// get normal and determine distance
	const { coords: nv } = faceNormal(n1, n2, n3, r);
	if (nv[2] <= 0) return true;
	return false;
}

/**
 * calculates the area of a triangle given 3 node positions
 * @param {number[]} v1
 * @param {number[]} v2
 * @param {number[]} v3
 * @returns {number}
 */
const calcTriangleArea = (v1, v2, v3) => {
	const v12 = resultant(v1, v2);
	const v13 = resultant(v1, v3);

	// calculate cross product
	const cp = crossProd(v12, v13);
	return Math.sqrt(cp[0] ** 2 + cp[1] ** 2 + cp[2] ** 2) / 2;
}

/**
 * given a nodes coordinates, rotate that node around the x or y
 * plane based on multiplyers
 * @param {number[]} v
 * @param {number} mX: how far to rotate around x axis
 * @param {number} mY: how far to rotate around y axis
 * @param {number} rad: how far to rotate per m_
 * @returns {number[]} an array containing the new coordinates
 */
const rotateNode = (
	v,
	mX,
	mY,
	rad
) => {
	// changing signs causes rotation in different directions.
	// These signs align rotation with HTMLCanvas coords: positive y is 'down'
	// and with personal preference related to the z axis: positive z is 'far'

	// store sine and cosine values
	const sX = Math.sin(rad * mX);
	const cX = Math.cos(rad * mX);
	const sY = Math.sin(rad * mY);
	const cY = Math.cos(rad * mY);

	// calculate rotated coords
	const nX = (v[0] * cX) - (v[1] * sX * sY) - (v[2] * sX * cY);
	const nY = (v[1] * cY) - (v[2] * sY);
	const nZ = (v[0] * sX) + (v[1] * cX * sY) + (v[2] * cX * cY);

	return [nX, nY, nZ];
}

/**
 * given an integer, return a char. Chars are mapped so that 'a' is 0.
 * @param {number} num number to map to char
 * @returns {string} the char num maps to
 */
const numToChar = (num) => {
	return String.fromCharCode(num + 'a'.charCodeAt(0));
}

/**
 * given a char, return a number. Chars are mapped so that 'a' is 0.
 * @param {string} char char to map to number
 * @returns {number} the num char maps to
 */
const charToNum = (char) => {
	return char.charCodeAt(0) - 'a'.charCodeAt(0);
}

/**
 * generates a node key based on base nodes and node weights
 * node names are alphabetized
 * @param {string} nn1 node name of first base node
 * @param {string} nn2 node name of second base node
 * @param {string} nn3 node name of third base node
 * @param {number} w1 weight of first base node
 * @param {number} w2 weight of second base node
 * @param {number} w3 weight of third base node
 * @returns {string}
 */
const generateNodeKey = (nn1, nn2, nn3, w1, w2, w3) => {
	const v = Math.round(w1 + w2 + w3);

	// error tolerance
	const t = 0.0001;

	// rounding precision
	const p = 6;

	// round to precision
	// if within tolerance of 0, round to 0
	const sw1 = Math.abs(w1 - Math.round(w1)) < t ? Math.round(w1) : parseFloat(w1.toPrecision(p));
	const sw2 = Math.abs(w2 - Math.round(w2)) < t ? Math.round(w2) : parseFloat(w2.toPrecision(p));
	const sw3 = Math.abs(w3 - Math.round(w3)) < t ? Math.round(w3) : parseFloat(w3.toPrecision(p));

	let res = [];
	if (sw1) res.push(nn1 + (v - w1 < t ? '' : sw1));
	if (sw2) res.push(nn2 + (v - w2 < t ? '' : sw2));
	if (sw3) res.push(nn3 + (v - w3 < t ? '' : sw3));
	return res.sort().join('');
}

/**
 * generates an edge key based on connected nodes
 * edge names are alphabetized
 * @param {string} nn1 node name of first node
 * @param {string} nn2 node name of second node
 * @returns {string}
 */
const generateEdgeKey = (nn1, nn2) => {
	return [nn1, nn2].sort().join('-');
}

/**
 * generates a face key based on connected nodes
 * face names are alphabetized
 * @param {string[]} nns ordered face names
 * @returns {string}
 */
const generateFaceKey = (nns) => {
	return nns.sort().join('-');
}

/**
 * @param {Object} nodes
 * @param {string} key
 * @returns {{node: Node, distType: string}}
 */
const getNode = (nodes, key) => {
	for (const distType of Object.keys(nodes)) {
		const node = nodes[distType].get(key);

		if (node) {
			return ({ node, distType });
		}
	}
	// no node found
	return { node: undefined, distType: '' };
}

/**
 * @param {Object} edges
 * @param {string} key
 * @returns {{edge: Edge, distType: string}}
 */
const getEdge = (edges, key) => {
	for (const distType of Object.keys(edges)) {
		const edge = edges[distType].get(key);

		if (edge) {
			return ({ edge, distType });
		}
	}
	// no edge found
	return { edge: undefined, distType: '' };
}

/**
 * @param {Object} faces
 * @param {string} key
 * @returns {{face: Face, distType: string}}
 */
const getFace = (faces, key) => {
	for (const distType of Object.keys(faces)) {
		const face = faces[distType].get(key);

		if (face) {
			return ({ face, distType });
		}

	}
	// no face found
	return { face: undefined, distType: '' };
}

/**
 * finds the five connections of a given vertex of an icosahedron
 * @param {number} n vertex represented as an integer 0-11
 * @returns {number[]} array of 5 vertices represented as integers 0-11
 */
const getBaseIcosahedronConnections = (n) => {
	const gT = (n) => (n ^ 1) % 12;
	const gM = (n) => 4 * ((Math.floor(n / 4) + 1) % 3) + Math.floor(n / 2) % 2;
	const gB = (n) => 4 * ((Math.floor(n / 4) + 2) % 3) + 2 * (n % 2);

	// returns connections in a circular order for easy face generation
	return [gT(n), gM(n), gB(n), gB(n) + 1, gM(n) + 2];
}

/**
 * returns coordinates for the node in between the three weighted input nodes
 * @param {Node} node1
 * @param {Node} node2
 * @param {Node} node3
 * @param {number} w1
 * @param {number} w2
 * @param {number} w3
 * @returns {number[]} [x, y, z]
 */
const calcMidNodeCoords = (node1, node2, node3, w1, w2, w3) => {
	const v = w1 + w2 + w3;
	const nX = node1.x * (w1 / v) + node2.x * (w2 / v) + node3.x * (w3 / v);
	const nY = node1.y * (w1 / v) + node2.y * (w2 / v) + node3.y * (w3 / v);
	const nZ = node1.z * (w1 / v) + node2.z * (w2 / v) + node3.z * (w3 / v);
	return [nX, nY, nZ];
}

/**
 * returns node coordinates normalized (pushed) to the surface of a sphere
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} r radius of the sphere to push to
 * @returns {number[]}
 */
const normalizeNode = (x, y, z, r) => {
	const dist = calc3dDistance(0, 0, 0, x, y, z);
	const nX = x / dist * r;
	const nY = y / dist * r;
	const nZ = z / dist * r;
	return [nX, nY, nZ];
}

/**
 * calculates a coordinate for perspective projection
 * @param {number} r radius
 * @param {number} c coordinate
 * @param {number} z z-coordinate paired with coordinate
 * @returns {number} the new coordinate
 */
const pp = (r, c, z) => {
	return (1 - z / (r * 6)) * c;
}

export {
	calc3dDistance,
	calcTriangleArea,
	generateNodeKey,
	generateEdgeKey,
	generateFaceKey,
	getNode,
	getEdge,
	getFace,
	getBaseIcosahedronConnections,
	numToChar,
	charToNum,
	isNear,
	orderFaceNodesByNormal,
	faceNormal,
	isFaceNear,
	rotateNode,
	calcMidNodeCoords,
	normalizeNode,
	pp,
};
