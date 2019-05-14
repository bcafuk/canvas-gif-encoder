'use strict';

const CanvasGifEncoder = require('../index.js');
const {createCanvas} = require('canvas');
const fs = require('fs');

let tests = [
	function(filename) { // 5-frame animation
		const canvas = createCanvas(64, 64);
		const ctx = canvas.getContext('2d');

		const encoder = new CanvasGifEncoder(64, 64);

		const stream = fs.createWriteStream(filename);
		encoder.createReadStream().pipe(stream);

		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, 64, 64);

		encoder.begin();

		encoder.addFrame(ctx, 250);

		ctx.fillStyle = 'black';

		ctx.fillRect(0, 0, 32, 32);
		encoder.addFrame(ctx, 250);

		ctx.fillRect(32, 0, 32, 32);
		encoder.addFrame(ctx, 250);

		ctx.fillRect(32, 32, 32, 32);
		encoder.addFrame(ctx, 250);

		ctx.fillRect(0, 32, 32, 32);
		encoder.addFrame(ctx, 250);

		encoder.end();
	},
	function(filename) { // Single frame image with multiple blocks
		const canvas = createCanvas(128, 128);
		const ctx = canvas.getContext('2d');

		const encoder = new CanvasGifEncoder(128, 128);

		const stream = fs.createWriteStream(filename);
		encoder.createReadStream().pipe(stream);

		for (let i = 0; i < 128; ++i) {
			ctx.fillStyle = 'rgb(255,' + i * 2 + ',' + i * 2 + ')';
			ctx.fillRect(0, i, 128, 1);
		}

		encoder.begin();

		encoder.addFrame(ctx, 250);

		encoder.end();
	},
	function(filename) { // Transparency test
		const canvas = createCanvas(64, 64);
		const ctx = canvas.getContext('2d');

		const encoder = new CanvasGifEncoder(64, 64);

		const stream = fs.createWriteStream(filename);
		encoder.createReadStream().pipe(stream);

		encoder.begin();

		ctx.fillStyle = 'orange';
		for (let i = 0; i < 16; ++i) {
			ctx.clearRect(0, 0, 64, 64);
			ctx.beginPath();
			ctx.arc(16 + i * 2, 16 + i * 2, 15.5, 0, 2 * Math.PI);
			ctx.fill();
			encoder.addFrame(ctx, 62.5);
		}

		encoder.end();
	},
];

for (let i = 0; i < tests.length; ++i) {
	console.log('Running test ' + (i + 1) + '...');
	tests[i]('gifs/gifTest' + (i + 1) + '.gif');
}
