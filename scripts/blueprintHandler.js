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
		this.addLayer(defaultBlueprint.layers, [2, 0]);
		this.addLayer(defaultBlueprint.layers, [3, 3]);
		this.addLayer(defaultBlueprint.layers, [2, 0]);

		return defaultBlueprint;
	}

	/**
	 * adds a layer to the blueprint
	 * @param {Types.SubdivisionLayer[]} layers
	 * @param {number[]} fs frequency
	 */
	addLayer = (layers, fs) => {
		const layer = {
			frequency: fs,
			subClass: 'classI',
		}
		console.log(fs);
		if (fs[0] && fs[1]) layer.subClass = "classIII";
		if (fs[0] === fs[1]) layer.subClass = "classII";
		console.log(layer);
		layers.push(layer);
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

	generateBlueprintLayerInterface = (parentElement) => {
		for (const layer of this.blueprint.layers) {
			this.appendBlueprintLayer(parentElement, layer.subClass, layer.frequency);
		}
	}

	/**
	 * @param {HTMLElement} parentElement
	 * @param {string} subClass
	 * @param {number} frequency
	 */
	appendBlueprintLayer = (parentElement, subClass, frequency) => {
		const index = parentElement.childElementCount;

		/** @type HTMLDivElement */
		const blueprintLayerDiv = document.createElement('div');
		blueprintLayerDiv.className = "blueprint-layer";

		blueprintLayerDiv.innerHTML = `
			<div>
				<select name="subClass" class="selectSubClass" >
					<option value="classI">Class I</option>
					<option value="classII">Class II</option>
					<option value="classIII">Class III</option>
				</select>
				<input class="subFrequency" type="number"/>
			</div>
		`;

		const inputSubFrequency = blueprintLayerDiv.querySelectorAll('input.subFrequency')[0];

		blueprintLayerDiv.querySelectorAll(`option[value=${subClass}]`)[0].selected = "selected";
		inputSubFrequency.value = frequency[0];


		// update the subdivision class of a layer in the blueprint
		blueprintLayerDiv.querySelectorAll('select.selectSubClass')[0].addEventListener('change', (e) => {
			this.updateClassOfLayer(index, e.target.value);
		});

		// update the frequency of a layer in the blueprint
		inputSubFrequency.addEventListener('change', (e) => {
			this.updateFrequencyOfLayer(index, +e.target.value);
		});

		parentElement.appendChild(blueprintLayerDiv);
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
			const { subClass, frequency } = this.blueprint.layers[i];
			const previousLayer = structure.layers[structure.layers.length - 1];
			const subdivideFunction = this.blueprintMap[subClass];
			const newLayer = subdivideFunction(previousLayer, options, frequency);
			structure.layers.push(newLayer);
		}

		return structure;
	}

}
export {
	BlueprintHandler,
};
