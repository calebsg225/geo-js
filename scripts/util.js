
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

export { calc3dDistance, calcTriangleArea };
