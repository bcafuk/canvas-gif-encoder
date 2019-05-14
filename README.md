# canvas-gif-encoder

[![npm version](https://badge.fury.io/js/canvas-gif-encoder.svg)](https://www.npmjs.com/package/canvas-gif-encoder)

A package to encode animated GIFs. Input frames are provided through a canvas, and the output is provided through a `ReadStream`.

## Example

```js
const CanvasGifEncoder = require('canvas-gif-encoder');
const {createCanvas} = require('canvas');
const fs = require('fs');

const canvas = createCanvas(120, 120);
const ctx = canvas.getContext('2d');
const encoder = new CanvasGifEncoder(120, 120);

let stream = fs.createWriteStream('output.gif');
encoder.createReadStream().pipe(stream);

encoder.begin();

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, 120, 120);
encoder.addFrame(ctx, 250);

let colors = ['white', 'yellow', 'cyan', 'lime', 'magenta', 'red', 'blue'];

for (let i = 0; i < colors.length; ++i) {
	ctx.fillStyle = colors[i];
	ctx.fillRect(i / colors.length * 120, 0, 120 / colors.length, 120);
	encoder.addFrame(ctx, 250);
}

encoder.end();
```

## Documentation

In order to write a valid GIF file, the workflow is as follows:

1. Construct an encoder using the `new` keyword
2. Open a read stream using `createReadStream`
3. Begin a file with `begin`
4. Draw the desired frame on a canvas
5. Create a frame from the canvas with `addFrame`
6. Repeat steps 4 and 5 until you have all the frames you want
7. End the file using `end`

### constructor(width, height, options)

* width: The width of the GIF in pixels, in the range [1, 65535].
* height: The height of the GIF in pixels, in the range [1, 65535].
* options: _(optional)_ Currently unused.

Creates an encoder of the specified width and height.

### begin()

Initializes the file by writing the header.

### addFrame(context, delay)

* context: The canvas context from which the frame is constructed.
* delay: The length of the frame being added in milliseconds, in the range [0, 655350].

Writes a frame to the file.

### end()

Finalizes the file by writing the trailer.

### createReadStream()

Returns a read stream to which the other methods write.
