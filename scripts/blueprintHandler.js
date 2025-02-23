import * as Types from "./types.js";
import * as geo from "./geodesic.js";

class BlueprintHandler {
	constructor() {
		/** @type {Types.Blueprint} */
		this.blueprint = this.getDefaultBlueprint();

		this.blueprintMap = {
			"tetrahedron": geo.generateBaseTetrahedron,
			"octahedron": geo.generateBaseOctahedron,
			"icosahedron": geo.generateBaseIcosahedron,
			"classI": geo.classILayer,
			"classII": geo.classIILayer,
		};

	}

	getDefaultBlueprint = () => {
		/** @type {Types.Blueprint} */
		const defaultBlueprint = {
			baseShape: "icosahedron",
			layers: [],
		};
		this.addLayer(defaultBlueprint.layers, "classII", 2);
		this.addLayer(defaultBlueprint.layers, "classI", 3);
		this.addLayer(defaultBlueprint.layers, "classI", 2);

		return defaultBlueprint;
	}

	/**
	 * adds a layer to the blueprint
	 * @param {Types.SubdivisionLayer[]} layers
	 * @param {string} subClass
	 * @param {number} frequency
	 */
	addLayer = (layers, subClass, frequency) => {
		layers.push({
			class: subClass,
			frequency: frequency
		});
	}

	/**
	 * updates the blueprint by replacing the previous base shape with the new base shape
	 * @param {string} newBaseShape
	 */
	updateBaseShape = (newBaseShape) => {
		this.blueprint.baseShape = newBaseShape;
	}

	/**
	 * updates the class of a layer
	 * @param {number} layerIndex
	 * @param {string} newSubClass
	 */
	updateClassOfLayer = (layerIndex, newSubClass) => {
		this.blueprint.layers[layerIndex].class = newSubClass;
	}

	/**
	 * updates the frequency of a layer
	 * @param {number} layerIndex
	 * @param {number} newFrequency
	 */
	updateFrequencyOfLayer = (layerIndex, newFrequency) => {
		this.blueprint.layers[layerIndex].frequency = newFrequency;
	}

	/**
	 * takes in a Blueprint and returns a Structure
	 * @param {Types.BuildOptions} options build options
	 * @return {Types.Structure}
	 */
	buildStructure = (options) => {
		/** @type {Types.Structure} */
		const structure = {
			layers: [],
		}

		structure.layers.push(this.blueprintMap[this.blueprint.baseShape](options));

		// subdivide one layer at a time
		for (let i = 0; i < this.blueprint.layers.length; i++) {
			const previousLayer = structure.layers[structure.layers.length - 1];
			const subdivideFunction = this.blueprintMap[this.blueprint.layers[i].class];
			const newLayer = subdivideFunction(previousLayer, options, this.blueprint.layers[i].frequency);
			structure.layers.push(newLayer);
		}

		return structure;
	}

}
export {
	BlueprintHandler,
};
