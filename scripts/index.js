import { BlueprintHandler } from "./blueprintHandler.js";
import Renderer from "./render.js";
import { buildOptions, renderOptions, defaultOptions } from "./defaultOptions.js";

const body = document.querySelector('body');
body.innerHTML = `
	<div id="main" >
		<canvas id="geo-canvas"></canvas>
			<div id="interface"> <section id="build-interface-container">
					<div class="dropdown">
						<button id="build-interface-toggle">/\\ Build</button>
					</div>
					<form id="build-form" style="display: inline;">
						<label for="select-base-shape">Base Shape</label>
						<select name="baseShapes" id="select-base-shape">
							<optgroup label="Traditional">
								<option value="tetrahedron">Tetrahedron</option>
								<option value="octahedron">Octahedron</option>
								<option value="icosahedron">Icosahedron</option>
							</optgroup>
							<optgroup label="Geometric"></optgroup>
							<optgroup label="Other"></optgroup>
						</select>
						<label for="layers-interface">Layers</label>
						<div id="layers-interface">
							<div id="layers-container">
							</div>
							<button id="add-layer-button" class="button">+</button>
						</div>
						<input id="build" class="button" type="submit" value="Build"/>
					</form>
				</section>
				<section id="render-interface-container">
					<div class="dropdown">
						<button id="render-interface-toggle">\\/ Render</button>
					</div>
					<form id="render-form" style="display: none;">
						<div id="node-render-options">
							<h3>Nodes</h3>
							<div class="select-div select-dist">
								<label for="select-node-dist">show</label>
								<select id="select-node-dist"></select>
							</div>
							<div class="select-div select-color">
								<label for="select-node-color">color</label>
								<select id="select-node-color"></select>
							</div>
							<div class="select-div select-size">
								<label for="select-node-size">radius</label>
								<select id="select-node-size"></select>
							</div>
						</div>
						<div id="edge-render-options">
							<h3>Edges</h3>
							<div class="select-div select-dist">
								<label for="select-edge-dist">show</label>
								<select id="select-edge-dist"></select>
							</div>
							<div class="select-div select-color">
								<label for="select-edge-color">color</label>
								<select id="select-edge-color"></select>
							</div>
							<div class="select-div select-size">
								<label for="select-edge-size">width</label>
								<select id="select-edge-size"></select>
							</div>
						</div>
						<div id="face-render-options">
							<h3>Faces</h3>
							<div class="select-div select-dist">
								<label for="select-face-dist">show</label>
								<select id="select-face-dist"></select>
							</div>
							<div class="select-div select-color">
								<label for="select-face-color">color</label>
								<select id="select-face-color"></select>
							</div>
						</div>
					</form>
				</section>
		</div>
	</div>
`;

/**
 * builds the options for a select element
 * @param {string[]} options an array of options to put in the select
 * @param {string} defaultOption the option to select by default
 * @returns {string}
 */
const optionsBuilder = (options, defaultOption) => {
	const ops = [];
	options.forEach((v) => {
		const uppercaseV = v.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
		ops.push(`
			<option value="${v}" ${defaultOption === v ? "selected" : ""}>${uppercaseV}</option>
		`);
	});
	return ops.join('\n');
};

/** @type HTMLDivElement */
const layersContainer = document.querySelector('#layers-container');

const blueprintHandler = new BlueprintHandler(layersContainer);

// create UI distance options
document.querySelector('#select-node-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.nodes.show);
document.querySelector('#select-edge-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.edges.show);
document.querySelector('#select-face-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.faces.show);

/** @type {string[]} */
const colors = 'red-orange-yellow-green-blue-indigo-violet-black-white'.split('-');

// create UI color options
document.querySelector('#select-node-color').innerHTML = optionsBuilder([...colors], defaultOptions.nodes.color);
document.querySelector('#select-edge-color').innerHTML = optionsBuilder(['by length', ...colors], defaultOptions.edges.color);
document.querySelector('#select-face-color').innerHTML = optionsBuilder(['by area', ...colors], defaultOptions.faces.color);

/** @type {string[]} */
const numRange = new Array(16).fill(0).map((_, i) => (i + 1) + '');

// create UI size options
document.querySelector('#select-node-size').innerHTML = optionsBuilder(numRange, defaultOptions.nodes.size + '');
document.querySelector('#select-edge-size').innerHTML = optionsBuilder(numRange, defaultOptions.edges.size + '');

// set the default base shape to match the options
const selectedBaseShape = blueprintHandler.blueprint.baseShape;
const selectedBaseShapeOption = document.querySelector(`select#select-base-shape option[value=${selectedBaseShape}]`);
selectedBaseShapeOption.selected = "selected";

let width = body.clientWidth;
let height = body.clientHeight;

/** @type {HTMLCanvasElement} */
const geoCanvas = document.querySelector('#geo-canvas');

geoCanvas.width = width;
geoCanvas.height = height;

buildOptions.sizeConstraint = Math.min(width, height);

const renderer = new Renderer(
	geoCanvas,
	renderOptions,
);

/** @type {HTMLCanvasElement} */
const geoInterface = document.querySelector('#interface');

/** @type {boolean} */
let mouseIsDown = false;

/** @type {number} */
let prevTouchX = 0;
/** @type {number} */
let prevTouchY = 0;

geoInterface.addEventListener("click", (e) => {
	// dont allow structure rotation when mouse is over interface
	e.stopPropagation();
});

geoCanvas.addEventListener('mousedown', () => {
	mouseIsDown = true;
});

geoCanvas.addEventListener('mouseup', () => {
	mouseIsDown = false;
});

geoCanvas.addEventListener('mouseleave', () => {
	mouseIsDown = false;
});

geoCanvas.addEventListener('mousemove', (e) => {
	if (!mouseIsDown) return;
	renderer.rotate(e.movementX, e.movementY);
});

// touch screen controls
geoCanvas.addEventListener('touchstart', (e) => {
	prevTouchX = e.targetTouches[0].screenX;
	prevTouchY = e.targetTouches[0].screenY;
});

geoCanvas.addEventListener('touchmove', (e) => {
	e.preventDefault();
	const touchX = e.targetTouches[0].screenX;
	const touchY = e.targetTouches[0].screenY;

	const deltaX = touchX - prevTouchX;
	const deltaY = touchY - prevTouchY;

	prevTouchX = touchX;
	prevTouchY = touchY;

	renderer.rotate(deltaX, deltaY);
});

// events for interface elements

// hide/show build interface
document.querySelector('#build-interface-toggle').addEventListener('click', (e) => {
	const form = document.querySelector('#build-form');
	if (form.style.display !== "inline") {
		form.style.display = "inline";
		e.target.innerHTML = "/\\ Build";
	} else {
		form.style.display = "none";
		e.target.innerHTML = "\\/ Build";
	}
});

document.querySelector('#render-interface-toggle').addEventListener('click', (e) => {
	const form = document.querySelector('#render-form');
	if (form.style.display !== "inline") {
		form.style.display = "inline";
		e.target.innerHTML = "/\\ Render";
	} else {
		form.style.display = "none";
		e.target.innerHTML = "\\/ Render";
	}
});

// builds structure from the current blueprint
document.querySelector('#build').addEventListener('click', (e) => {
	// stop from reloading
	e.preventDefault();

	// build new structure from blueprint and render
	const newStructure = blueprintHandler.buildStructure(buildOptions);
	renderer.setStructure(newStructure);
	renderer.render();
});

// UPDATE DISTANCES

// update node distance
document.querySelector('#select-node-dist').addEventListener('change', (e) => {
	renderer.updateDistOptions("nodes", e.target.value);
	renderer.render();
});

// update edge distance
document.querySelector('#select-edge-dist').addEventListener('change', (e) => {
	renderer.updateDistOptions("edges", e.target.value);
	renderer.render();
});

// update face distance
document.querySelector('#select-face-dist').addEventListener('change', (e) => {
	renderer.updateDistOptions("faces", e.target.value);
	renderer.render();
});

// UPDATE COLORS

// update node color
document.querySelector('#select-node-color').addEventListener('change', (e) => {
	renderer.updateColorOptions("nodes", e.target.value);
	renderer.render();
});

// update edge color
document.querySelector('#select-edge-color').addEventListener('change', (e) => {
	renderer.updateColorOptions("edges", e.target.value);
	renderer.render();
});

// update face color
document.querySelector('#select-face-color').addEventListener('change', (e) => {
	renderer.updateColorOptions("faces", e.target.value);
	renderer.render();
});

// UPDATE SIZES

// update node size
document.querySelector('#select-node-size').addEventListener('change', (e) => {
	renderer.updateSizeOptions("nodes", e.target.value);
	renderer.render();
});

document.querySelector('#select-edge-size').addEventListener('change', (e) => {
	renderer.updateSizeOptions("edges", e.target.value);
	renderer.render();
});

// update the base shape in the blueprint
document.querySelector('#select-base-shape').addEventListener('change', (e) => {
	blueprintHandler.updateBaseShape(e.target.value);
});

// add a new blueprint layer
document.querySelector('#add-layer-button').addEventListener('click', (e) => {
	e.preventDefault();
	blueprintHandler.addLayerToInterface([1, 0]);
});
// update canvas width and height to match client window size
window.addEventListener('resize', () => {
	width = body.clientWidth;
	height = body.clientHeight;
	geoCanvas.width = width;
	geoCanvas.height = height;
	buildOptions.sizeConstraint = Math.min(width, height);
	renderer.updateCenter(width, height);
	renderer.render();
});

// build and default structure
renderer.setStructure(blueprintHandler.buildStructure(buildOptions));
renderer.render();
