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
			baseShape: "octahedron",
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
