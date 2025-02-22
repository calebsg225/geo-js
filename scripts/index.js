import { BlueprintHandler } from "./blueprintHandler.js";
import Renderer from "./render.js";
import { buildOptions, renderOptions } from "./defaultOptions.js";

const blueprintHandler = new BlueprintHandler();

const body = document.querySelectorAll('body')[0];

body.innerHTML = `
	<div id="main" >
		<canvas id="geo-canvas"></canvas>
		<div id="interface">
			<form>
				<label for="baseShapes">Base Shape</label>
				<select name="baseShapes" id="selectBaseShape">
					<optgroup label="Traditional">
						<option value="tetrahedron">Tetrahedron</option>
						<option value="octahedron">Octahedron</option>
						<option value="icosahedron">Icosahedron</option>
					</optgroup>
					<optgroup label="Geometric"></optgroup>
					<optgroup label="Unusual"></optgroup>
				</select>
				<input id="generate" type="submit" value="Generate"/>
			</form>
		</div>
	</div>
`;

// set the default base shape to match the options
const selectedBaseShape = blueprintHandler.blueprint.baseShape;
const selectedBaseShapeOption = document.querySelector(`select#selectBaseShape option[value=${selectedBaseShape}]`);
selectedBaseShapeOption.selected = "selected";

let width = body.clientWidth;
let height = body.clientHeight;

const geoCanvas = document.querySelector('#geo-canvas');
geoCanvas.width = width;
geoCanvas.height = height;

buildOptions.sizeConstraint = Math.min(width, height);

const renderer = new Renderer(
	geoCanvas,
	renderOptions,
	blueprintHandler.buildStructure(buildOptions),
);

const geoInterface = document.querySelector('#interface');
let mouseIsDown = false;

let prevTouchX = 0;
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

// generates structure from the current blueprint
document.querySelector('#generate').addEventListener('click', (e) => {
	// stop from reloading
	e.preventDefault();

	// generate new structure from blueprint and render
	const newStructure = blueprintHandler.buildStructure(buildOptions);
	renderer.setStructure(newStructure);
	renderer.render();
});

// update the base shape in the blueprint
document.querySelector('#selectBaseShape').addEventListener('change', (e) => {
	blueprintHandler.setBaseShape(e.target.value);
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
