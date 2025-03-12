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

	const ab = [bx - ax, by - ay, b.z - a.z];
	const ac = [cx - ax, cy - ay, c.z - a.z];

	// calculate coordinates of normal vertex
	const nx = ab[1] * ac[2] - ab[2] * ac[1];
	const ny = ab[2] * ac[0] - ab[0] * ac[2];
	const nz = ab[0] * ac[1] - ab[1] * ac[0];

	// find the angle between a and the normal vector
	const theta = Math.acos((ax * nx + ay * ny + a.z * nz) / (Math.sqrt(ax ** 2 + ay ** 2 + a.z ** 2) * Math.sqrt(nx ** 2 + ny ** 2 + nz ** 2)));

	// swap if needed
	if (theta > Math.PI / 2) return { coords: [nx * -1, ny * -1, nz * -1], flipped: true };
	return { coords: [nx, ny, nz], flipped: false };
}

/**
 * determines whether a face is near or far based on its normal vector
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
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} x2
 * @param {number} y2
 * @param {number} z2
 * @param {number} x3
 * @param {number} y3
 * @param {number} z3
 * @returns {number}
 */
const calcTriangleArea = (
	x1,
	y1,
	z1,
	x2,
	y2,
	z2,
	x3,
	y3,
	z3
) => {
	// vector from 1 to 2
	const v12x = x2 - x1;
	const v12y = y2 - y1;
	const v12z = z2 - z1;

	// vector from 1 to 3
	const v13x = x3 - x1;
	const v13y = y3 - y1;
	const v13z = z3 - z1;

	// orthogonal vector from v12 and v13
	const ovx = v12y * v13z - v13y * v12z;
	const ovy = v12x * v13z - v13x * v12z;
	const ovz = v12x * v13y - v13x * v12y;

	// return area
	return Math.sqrt(ovx ** 2 + ovy ** 2 + ovz ** 2) / 2;
}

/**
 * given a nodes coordinates, rotate that node around the x or y
 * plane based on multiplyers
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} mX: how far to rotate around x axis
 * @param {number} mY: how far to rotate around y axis
 * @param {number} rad: how far to rotate per m_
 * @returns {number[]} an array containing the new coordinates
 */
const rotateNode = (
	x,
	y,
	z,
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
	const nX = (x * cX) - (y * sX * sY) - (z * sX * cY);
	const nY = (y * cY) - (z * sY);
	const nZ = (x * sX) + (y * cX * sY) + (z * cX * cY);

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
 * @param {string} nn1 face name of first node
 * @param {string} nn2 face name of second node
 * @param {string} nn3 face name of third node
 * @returns {string}
 */
const generateFaceKey = (nn1, nn2, nn3) => {
	return [nn1, nn2, nn3].sort().join('-');
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
	faceNormal,
	isFaceNear,
	rotateNode,
	calcMidNodeCoords,
	normalizeNode,
	pp,
};
