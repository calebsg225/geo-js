import { buildIcosahedronAtFrequency } from "./geodesic.js";
import Renderer from "./render.js";
import defaultOptions from "./defaultOptions.js";

const body = document.querySelectorAll('body')[0];

body.innerHTML = `
	<div id="main" >
		<canvas id="geo-canvas"></canvas>
		<div id="interface"></div>
	</div>
`;

let width = body.clientWidth;
let height = body.clientHeight;

const geoCanvas = document.querySelector('#geo-canvas');
geoCanvas.width = width;
geoCanvas.height = height;

const renderer = new Renderer(geoCanvas, defaultOptions);

// update canvas width and height to match client window size
window.addEventListener('resize', () => {
	width = body.clientWidth;
	height = body.clientHeight;
	geoCanvas.width = width;
	geoCanvas.height = height;
	renderer.render();
});
renderer.render();

console.log(buildIcosahedronAtFrequency(5));
