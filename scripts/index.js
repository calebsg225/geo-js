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
					<form id="build-form" style="display: none;">
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
					<form id="render-form" style="display: inline;">
						<div id="node-render-options">
							<label for="select-node-dist">Show Nodes</label>
							<select id="select-node-dist"></select>
						</div>
						<div id="edge-render-options">
							<label for="select-edge-dist">Show Edges</label>
							<select id="select-edge-dist"></select>
						</div>
						<div id="face-render-options">
							<label for="select-face-dist">Show Faces</label>
							<select id="select-face-dist"></select>
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
		ops.push(`
			<option value="${v}" ${defaultOption === v ? "selected" : ""}>${v.charAt(0).toUpperCase() + v.slice(1)}</option>
		`);
	});
	return ops.join('\n');
};

/** @type HTMLDivElement */
const layersContainer = document.querySelector('#layers-container');

const blueprintHandler = new BlueprintHandler(layersContainer);

document.querySelector('#select-node-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.nodes.show);
document.querySelector('#select-edge-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.edges.show);
document.querySelector('#select-face-dist').innerHTML = optionsBuilder(['all', 'near', 'far', 'none'], defaultOptions.faces.show);

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
	blueprintHandler.buildStructure(buildOptions),
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

renderer.render();
