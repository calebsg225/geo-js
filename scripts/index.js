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
const ctx = geoCanvas.getContext('2d');

window.addEventListener('resize', () => {
	width = body.clientWidth;
	height = body.clientHeight;
	geoCanvas.width = width;
	geoCanvas.height = height;
	render();
});

const render = () => {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "red";
	ctx.font = "2rem serif";
	ctx.fillText(`${width}, ${height}`, 10, 30);
}
render();
