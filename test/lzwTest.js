'use strict';

const compress = require('../lzw.js');

const testCases = [
	{
		minCodeSize: 8,
		inputData: Uint8Array.of(
			 40, 255, 255,
			255,  40, 255,
			255, 255, 255,
			255, 255, 255,
			255, 255, 255
		),
		expectedData: Uint8Array.of(11, 0, 81, 252, 27, 40, 112, 160, 193, 131, 1, 1, 0)
	},
];

let arraysEqual = function(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}
	for (let i = 0; i < arr1.length; ++i) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}
	return true;
};

for (let i = 0; i < testCases.length; ++i) {
	let outputData = compress(testCases[i].minCodeSize, testCases[i].inputData);
	if (arraysEqual(outputData, testCases[i].expectedData)) {
		console.log('Passed test ' + (i + 1));
	} else {
		console.error('FAILED TEST ' + (i + 1));
	}
}
