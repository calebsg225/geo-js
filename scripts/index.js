import { BlueprintHandler } from "./blueprintHandler.js";
import Renderer from "./render.js";
import { buildOptions, renderOptions } from "./defaultOptions.js";

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
						<input id="render" class="button" type="submit" value="Render"/>
					</form>
				</section>
		</div>
	</div>
`;


/** @type HTMLDivElement */

const layersContainer = document.querySelector('#layers-container');

const blueprintHandler = new BlueprintHandler(layersContainer);

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

// renders from render options
document.querySelector('#render').addEventListener('click', (e) => {
	// stop from reloading
	e.preventDefault();
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
