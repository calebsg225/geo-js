import * as Types from "./types.js";
import * as sdiv from "./subdivisions.js";
import * as bshape from "./baseShapes.js";

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
			"tetrahedron": bshape.generateBaseTetrahedron,
			"octahedron": bshape.generateBaseOctahedron,
			"icosahedron": bshape.generateBaseIcosahedron,
			"classI": sdiv.classILayer,
			"classII": sdiv.classIILayer,
			"classIII": sdiv.classIIILayer,
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
		const dLayerV = [
			[2, 1],
		];
		for (let i = 0; i < dLayerV.length; i++) {
			this.addLayerToInterface(dLayerV[i]);
		}
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
				<div class="drag-handle"></div>
				<div class="inputs-container">
					<h3 class="layer-name">${this.getLayerName(...frequency)}</h3>
					<div class="layer-inputs">
						<div class="layer-input-container">
							<button class="button minus-button minus1">-</button>
							<input
								class="sub-freq freq1"
								name="m"
								placeholder="m"
								type="text"
								value="${frequency[0]}"
							/>
							<button class="button plus-button plus1">+</button>
						</div>
						<div class="layer-input-container">
							<button class="button minus-button minus2">-</button>
							<input 
								class="sub-freq freq2"
								name="n"
								placeholder="n"
								type="text"
								value="${frequency[1]}"
							/>
							<button class="button plus-button plus2">+</button>
						</div>
					</div>
					<button class="remove-layer-button button" >X</button>
				</div>
			</div>
		`;

		for (let i = 0; i <= 1; i++) {
			const input = blueprintLayerDiv.querySelector(`.freq${i + 1}`);

			const updateDescription = (i, mn) => {
				const layer = this.blueprint.layers[index];
				layer.frequency[i] = mn;
				layer.subClass = 'class' + this.getClassType(...layer.frequency);
				blueprintLayerDiv.querySelector('h3.layer-name').innerText = this.getLayerName(...layer.frequency);
			}

			input.addEventListener("change", (e) => {
				const hasNonInteger = e.target.value.search(/[^0-9]/g) >= 0;
				if (!e.target.value.length) e.target.value = i ^ 1 + '';
				const mn = hasNonInteger ? i ^ 1 : +e.target.value;
				if (hasNonInteger) e.target.value = mn + '';
				updateDescription(i, mn);
			});

			blueprintLayerDiv.querySelector(`.plus${i + 1}`).addEventListener("click", (e) => {
				e.preventDefault();
				input.value = +input.value + 1 + '';
				updateDescription(i, +input.value);
			});

			blueprintLayerDiv.querySelector(`.minus${i + 1}`).addEventListener("click", (e) => {
				e.preventDefault();
				if (+input.value <= (i ^ 1)) return;
				input.value = +input.value - 1 + '';
				updateDescription(i, +input.value);
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
