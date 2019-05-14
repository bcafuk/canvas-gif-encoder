'use strict';

const {Readable} = require('stream');
const compress = require('./lzw.js');

let findClosestInColorTable = function(color, map) {
	let closestIndex = -1;
	let closestDistance = Infinity;

	for (let colorPair of map) {
		let mapColor = colorPair[0].split(',');
		let distance = Math.hypot(
			color.r - Number(mapColor[0]),
			color.g - Number(mapColor[1]),
			color.b - Number(mapColor[2])
		);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestIndex = colorPair[1];
		}
	}
	return closestIndex;
};

class CanvasGifEncoder {
	constructor(width, height, options = {}) {
		if (typeof width !== 'number' || width <= 0 || width >= 65536) {
			throw 'The GIF width needs to be a number between 1 and 65535';
		}
		if (typeof height !== 'number' || height <= 0 || height >= 65536) {
			throw 'The GIF height needs to be a number between 1 and 65535';
		}

		this.width = Math.trunc(width);
		this.height = Math.trunc(height);

		this.readStreams = [];
	}

	begin() {
		let header = Uint8Array.of(
			0x47, 0x49, 0x46, 0x38, 0x39, 0x61,                               // GIF89a
			this.width & 0xFF, (this.width >> 8) & 0xFF,                      // Logical screen width in pixels (little-endian)
			this.height & 0xFF, (this.height >> 8) & 0xFF,                    // Logical screen height in pixels (little-endian)
			0x70,	                                                            // Depth = 8 bits, no global color table
			0x00,                                                             // Transparent color: 0
			0x00,                                                             // Default pixel aspect ratio
			0x21, 0xFF, 0x0B,                                                 // Application Extension block (11 bytes for app name and code)
			0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // NETSCAPE2.0
			0x03,                                                             // 3 bytes of data
			0x01,	                                                            // Sub-block index
			0x00, 0x00,                                                       // Repeat inifinitely
			0x00                                                              // End of block
		);

		for (let stream of this.readStreams) {
			stream.push(header, 'binary');
		}
	}

	addFrame(context, delay) {
		if (typeof delay !== 'number') {
			throw 'The delay length needs to be a number';
		}
		delay = Math.round(delay / 10); // Argument is in milliseconds, GIF uses centiseconds
		if (delay < 0 || delay >= 65536) {
			throw 'The delay length needs to be between 0 and 655350 milliseconds';
		}

		let graphicControlExtension = Uint8Array.of(
			0x21, 0xF9, 0x04,                  // Graphic Control Extension (4 bytes)
			0x09,                              // Restore to BG color, do not expect user input, transparent index exists
			delay & 0xFF, (delay >> 8) & 0xFF, // Delay in centiseconds (little-endian)
			0x00,                              // Color 0 is transparent
			0x00                               // End of block
		);

		let colorTableMap = new Map();
		let colorTableSize = 1;

		let canvasPixels = context.getImageData(0, 0, this.width, this.height);
		let pixelData = new Uint8Array(canvasPixels.width * canvasPixels.height);

		for (let i = 0; i < canvasPixels.data.length; i += 4) {
			let colorIndex;
			if (canvasPixels.data[i + 3] === 0) {	// Transparent
				colorIndex = 0;
			} else {
				let color = canvasPixels.data[i + 0] + ',' + canvasPixels.data[i + 1] + ',' + canvasPixels.data[i + 2];
				if (colorTableMap.has(color)) { // Color exists in table
					colorIndex = colorTableMap.get(color);
				} else if (colorTableSize < 256) { // Color does not exist in table, but table is not full
					colorIndex = colorTableSize;
					colorTableMap.set(color, colorTableSize);
					++colorTableSize;
				} else { // Color does not exist in table and the table is full
					colorIndex = findClosestInColorTable(
						{
							r: canvasPixels.data[i + 0],
							g: canvasPixels.data[i + 1],
							b: canvasPixels.data[i + 2]
						},
						colorTableMap
					);
				}
			}
			pixelData[i / 4] = colorIndex;
		}
		let colorTableBits = Math.max(2, Math.ceil(Math.log2(colorTableSize)));

		let colorTableData = new Uint8Array((1 << colorTableBits) * 3);
		for (let colorPair of colorTableMap) {
			let rgb = colorPair[0].split(',');

			colorTableData[colorPair[1] * 3 + 0] = Number(rgb[0]);
			colorTableData[colorPair[1] * 3 + 1] = Number(rgb[1]);
			colorTableData[colorPair[1] * 3 + 2] = Number(rgb[2]);
		}
		let imageDescriptor = Uint8Array.of(
			0x2C,                                          // Image descriptor
			0x00, 0x00,                                    // Left X coordinate of image in pixels (little-endian)
			0x00, 0x00,                                    // Top Y coordinate of image in pixels (little-endian)
			this.width & 0xFF, (this.width >> 8) & 0xFF,   // Image width in pixels (little-endian)
			this.height & 0xFF, (this.height >> 8) & 0xFF, // Image height in pixels (little-endian)
			0x80 | (colorTableBits - 1) & 0x07             // Use a local color table, do not interlace, table is not sorted, the table indices are colorTableBits bits long
		);

		let compressedPixelData = compress(colorTableBits, pixelData);

		for (let stream of this.readStreams) {
			stream.push(graphicControlExtension, 'binary');
			stream.push(imageDescriptor, 'binary');
			stream.push(colorTableData, 'binary');
			stream.push(Uint8Array.of(colorTableBits), 'binary');
			stream.push(compressedPixelData, 'binary');
		}
	}

	end() {
		for (let stream of this.readStreams) {
			stream.push(Uint8Array.of(0x3B), 'binary'); // File end
			stream.push(null);
		}
	}

	createReadStream() {
		let stream = new Readable();
		this.readStreams.push(stream);
		return stream;
	}
}

module.exports = CanvasGifEncoder;
