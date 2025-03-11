// This file contains jsdoc typedefs.
import { Node, Edge, Face } from "./structures.js";

// TODO: sort types into namespaces?
// TODO: deal with Node, Edge, and Face types as separate from the class?

// NOTE: The following types are for structure data.

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
 * @typedef {Object} StructureLayer
 * @property {Nodes} nodes
 * @property {Edges} edges
 * @property {Faces} faces
 * @property {number} maxEdgeLength
 */

/**
 * geodesic structure data
 * @typedef {Object} Structure
 * @property {StructureLayer[]} layers
 * @property {number} maxEdgeLength
 */

// NOTE: The following types are for options data

/**
 * @typedef {Object} BuildOptions
 * @property {number} sizeConstraint
 * @property {number} fillPercentage
 */

/**
 * @typedef {Object} NodesOptions
 * @property {boolean} show
 * @property {string} color
 * @property {number} size
 */

/**
 * @typedef {Object} EdgesOptions
 * @property {boolean} show
 * @property {boolean} colorLength
 * @property {string} color
 * @property {number} size
 */

/**
 * @typedef {Object} FacesOptions
 * @property {boolean} show
 * @property {boolean} colorArea
 * @property {string} color
 */

/**
 * @typedef {Object} NodeDistOptions
 * @property {NodesOptions} near
 * @property {NodesOptions} far
 */

/**
 * @typedef {Object} EdgeDistOptions
 * @property {EdgesOptions} near
 * @property {EdgesOptions} far
 */

/**
 * @typedef {Object} FaceDistOptions
 * @property {FacesOptions} near
 * @property {FacesOptions} far
 */

/**
 * @typedef {Object} RenderOptions
 * @property {string} backgroundColor
 * @property {string} farStructureOpacity
 * @property {string} nearStructureOpacity
 * @property {number} rotationStep
 * @property {string[]} defaultColors
 * @property {NodeDistOptions} nodes
 * @property {EdgeDistOptions} edges
 * @property {FaceDistOptions} faces
 */

// NOTE: The following types are for blueprint data

/**
 * @typedef {Object} SubdivisionLayer
 * @property {string} subClass
 * @property {number[]} frequency
 */

/**
 * @typedef {Object} Blueprint
 * @property {string} baseShape
 * @property {SubdivisionLayer[]} layers
 */

export { };
