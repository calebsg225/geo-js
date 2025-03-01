import * as Types from "./types.js";
import * as geo from "./geodesic.js";

class BlueprintHandler {

	/*
	 * @constructor
	 * @param {HTMLElement} parentElement
	 */
	constructor(parentElement) {
		/** @type {Types.Blueprint} */
		this.blueprint = {};
		this.parentElement = parentElement;
		this.buildDefaultBlueprint();

		this.blueprintMap = {
			"tetrahedron": geo.generateBaseTetrahedron,
			"octahedron": geo.generateBaseOctahedron,
			"icosahedron": geo.generateBaseIcosahedron,
			"classI": geo.classILayer,
			"classII": geo.classIILayer,
		};

	}

	/**
	 * this function builds a default blueprint
	 */
	buildDefaultBlueprint = () => {
		this.blueprint = {
			baseShape: "icosahedron",
			layers: [],
		};
		this.addLayerToInterface([2, 0]);
		this.addLayerToInterface([3, 3]);
		this.addLayerToInterface([2, 0]);
	}

	/**
	 * given 2 numbers representing the frequency of a layer, return the class type of that layer
	 * @param {number} n1 first frequency number
	 * @param {number} n2 second frequency number
	 * @returns {string} class type
	 */
	getClassType = (n1, n2) => {
		if (n1 === n2) return "II";
		if (n1 && n2) return "III";
		return "I";
	}

	/**
	 * given 2 numbers representing the frequency of a layer, return the name of that layer
	 * @param {number} n1 first frequency number
	 * @param {number} n2 second frequency number
	 * @returns {string} class name
	 */
	getLayerName = (n1, n2) => {
		return "Class " + this.getClassType(n1, n2) + " {" + n1 + ", " + n2 + "} " + (n1 + n2) + "v";
	}

	/**
	 * updates the blueprint by replacing the previous base shape with the new base shape
	 * @param {string} newBaseShape
	 */
	updateBaseShape = (newBaseShape) => {
		this.blueprint.baseShape = newBaseShape;
	}

	generateBlueprintLayerInterface = () => {
		for (const layer of this.blueprint.layers) {
			this.addLayerToInterface(this.parentElement, layer.frequency);
		}
	}

	/**
	 * @param {HTMLElement} parentElement
	 * @param {number[]} frequency
	 */
	addLayerToInterface = (frequency) => {
		const layer = {
			frequency: frequency,
			subClass: 'class' + this.getClassType(...frequency),
		}
		this.blueprint.layers.push(layer);
		const index = this.blueprint.layers.length - 1;

		/** @type HTMLDivElement */
		const blueprintLayerDiv = document.createElement('div');
		blueprintLayerDiv.className = "blueprint-layer";

		blueprintLayerDiv.innerHTML = `
			<div class="layer-info">
				<h3 class="layer-name">${this.getLayerName(...frequency)}</h3>
				<input
					class="sub-freq freq1"
					type="number"
					min="1"
					value="${frequency[0]}"
				/>
				<input 
					class="sub-freq freq2"
					type="number"
					min="0"
					value="${frequency[1]}"
				/>
				<button class="remove-layer-button button" >remove this layer</button>
			</div>
		`;

		for (let i = 0; i <= 1; i++) {
			blueprintLayerDiv.querySelector(`.freq${i + 1}`).addEventListener("change", (e) => {
				const layer = this.blueprint.layers[index];
				layer.frequency[i] = +e.target.value;
				layer.subClass = 'class' + this.getClassType(...layer.frequency);
				blueprintLayerDiv.querySelector('h3.layer-name').innerText = this.getLayerName(...layer.frequency);
			});
		}

		blueprintLayerDiv.querySelector('button.remove-layer-button').addEventListener("click", (e) => {
			e.preventDefault();
			this.blueprint.layers[index] = null;
			blueprintLayerDiv.parentElement.removeChild(blueprintLayerDiv);
		});

		this.parentElement.appendChild(blueprintLayerDiv);
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
			if (!this.blueprint.layers[i]) continue;
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
