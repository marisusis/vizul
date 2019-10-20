//  (function(window) {
var barCount = 63; //127 // 63
var barSpacing = 2; //6 // 20
var barWidth = 10; //1 // 8
var spectrumDimensionScalar = 4.5;
var spectrumMaxExponent = 3;
var spectrumMinExponent = 2;
var spectrumExponentScale = 2;

var spectrumMax = 300;

var smoothingPasses = 2;
var smoothingPoints = 100;

var playing = false;

var frequencyMin = 4;
var frequencyMax = 1200;
var SpectrumLogScale = 2.55;
var resRatio = (window.innerWidth / window.innerHeight);

const resolution = 4096;

var spectrumHeight = 300; //300

function SpectrumEase(Value) {
	return Math.pow(Value, SpectrumLogScale);
}

//Get audio element
const audio = document.getElementById("audio");

//Get canvas
var canvas = document.getElementById("canvas");

//Set canvas width and height
canvas.width = (barCount * (barWidth + barSpacing));
canvas.height = spectrumHeight + 200; // 60

//Get context
var ctx = canvas.getContext("2d");

//Create audio context
const audioCtx = new AudioContext();

//Load audio source from element
var source = audioCtx.createMediaElementSource(audio);

//Create gain node
var gainNode = audioCtx.createGain();

//Create analyser node
var analyserNode = audioCtx.createAnalyser();

//Create an audio node to increase the gain of the audio fed to the visualizer
var scaleNode = audioCtx.createGain();

//Create a delay to keep the audio in sync with the visualizer
var delayNode = audioCtx.createDelay();

var visDelayNode = audioCtx.createDelay();

//The offset is 0.3sec
delayNode.delayTime.value = 0.3;

//Configure analyser node
analyserNode.fftSize = 16384;

//get length of buffer
var bufferLength = analyserNode.frequencyBinCount;

//Create processor node
var processorNode = audioCtx.createScriptProcessor(2048, 1, 1);


var panner = audioCtx.createStereoPanner();

//Set gain
gainNode.gain.value = 1;


function drawMeter(ctx, array, segments, segmentWidth, segmentHeight, segmentXSpacing, segmentYSpacing) {
	ctx.fillStyle = "#f00";

	// Resize array to fit number of bins
	let bins = largestTriangleThreeBuckets(array, segments);

	for (let i = 0; i < bins.length; i++) {
		let bin = bins[i];
		// ctx.fillRect((segmentWidth + segmentXSpacing) * i, y)
	}
}

function initNodes(source) {
	//Connect the nodes
	source.connect(scaleNode);
	scaleNode.connect(visDelayNode)
	visDelayNode.connect(analyserNode);
	analyserNode.connect(processorNode);
	processorNode.connect(gainNode);
	source.connect(panner);

	panner.connect(delayNode);
	delayNode.connect(audioCtx.destination);
	gainNode.connect(audioCtx.destination);
}


//Create data array
var dataArray = new Uint8Array(bufferLength);

//When the audio is loaded
audio.onloadeddata = function (event) {

	console.info("Audio loaded.");

	//Play the audio
	audio.play();

};

//When the audio is played
audio.onplay = function (event) {
	console.info("Playing audio...");

	//Set playing to true
	playing = true;

	//start draw sequence
	window.requestAnimationFrame(draw);
};

//When the audio is paused
audio.onpause = function (event) {
	console.info("Audio paused.");

	//Audio is not playing
	playing = false;


};

//When the audio's time is updated
audio.ontimeupdate = function (event) {
	var percent = audio.currentTime / audio.duration * 100;

	$(".line").css({
		"width": percent + "%"
	});

	$(".time").text(moment().minutes(0).seconds(audio.currentTime).format("mm:ss"));

}

var color__ = window.COLOR;

function process(data, dt) {
	let smallerData = largestTriangleThreeBuckets(data, 2048);
	let array = superAlgorithm(smallerData, dt);
// 	let superData = superAlgorithm(smallerData);

	//Apply algorithms
	array = GetVisualBins(smallerData);
	array = normalizeAmplitude(array);

	array = averageTransform(array);
	array = exponentialTransform(array);


	try {
		array = superAlgorithm(array, dt);
	} catch (e) {
		console.error(e);
		array = array;
	}
	// array = powTransform(array);
// array = exponentialTransform(array);
	// array = normalizeAmplitude(array);


// 	array = savitskyGolaySmooth(array);
	// array = experimentalTransform(array, 2);
	handlePad(array);
	return array;
}


let currentTime = window.performance.now();
let last = window.performance.now();
let dt = 0;

//Rendering function

function draw() {
	app.stats.begin();
	currentTime = window.performance.now();
	dt = ( currentTime - last ) / 1000;
	last = currentTime;
	

	//Clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//Get the frequency data
	analyserNode.getByteFrequencyData(dataArray);


	let array = process(dataArray, dt);

	//Set the default fill style
	ctx.fillStyle = "#fff";

	//Get the color scale function
	// var _color = chroma.scale(window.COLOR).domain([0, math.max(array)]).mode("lch");

	var bass = array.slice(0, 20);

	var modifier = normalize(math.mean(bass), 0, spectrumMax, 1, 5);

	//Iterate over the frequencies
	for (var i = 0; i < array.length; i++) {
		const val = array[i];
		const dz = params.dz[i] * 10;
		const az = params.az[i] * 10;
		const jz = params.jz[i] * 10;

		

		//Draw the bars
		// ctx.fillStyle = _color(Math.floor(val)).css();
		ctx.fillStyle = "rgba(255,255,255,1)";
		// ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 - val / 2, barWidth, val);
		ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2, barWidth, -val);
		ctx.fillStyle = "rgba(255,0,0,1)";
		// ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 , barWidth, -dz);
		ctx.fillStyle = "rgba(0,255,0,1)";
		// ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 , barWidth, -az);
		ctx.fillStyle = "rgba(0,0,255,1)";
		// ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 , barWidth, -jz);
	}

	drawMeter(ctx, array, 10, 10, 5, 4, 6);

	//Cancel the rendering if the song isn't playing
	if (playing) {
		window.requestAnimationFrame(draw);
	}

	app.stats.end();
};

let resolution2 = barCount;
params = {
	// changes
	dz: new Array(resolution2).fill(0),
	az: new Array(resolution2).fill(0),
	jz: new Array(resolution2).fill(0),
	dq: new Array(resolution2).fill(0),
	// last changes
	zLast: new Array(resolution2).fill(0),
	dzLast: new Array(resolution2).fill(0),
	azLast: new Array(resolution2).fill(0),
	jzLast: new Array(resolution2).fill(0),
	qLast: new Array(resolution2).fill(0),

	// extra
	maxddz: new Array(resolution2).fill(0),

	// constants
	regionSize: 5,
	k: 1,
	avgMax: []
}


function qalc(ddx, a = 0.1, b = 2.8) {
	return math.pow(b, (-a * ddx));
}

function extractRegion(array, regionSize, index) {
	const len = array.length;
	let offset = math.floor(regionSize / 2);

	let left = index - offset;
	let right = index + offset;

	if (left < 0) left = 0;
	if (right > len - 1) right = len - 1;

	return array.slice(left, right);
}

// function superAlgorithm(bins) {
// 	let data = Array.from(bins);

// 	for (let i = 0; i < data.length; i++) {
// 		// Timestep forward
// 		params.dz[i] = data[i] - params.zLast[i];
// 		params.az[i] = params.dz[i] - params.dzLast[i];
// 		params.jz[i] = params.az[i] - params.azLast[i];
// 	}

// 	// Calculate helpful stuff
// 	let max = math.max(data);
// 	let mean = math.mean(data);
// 	let meanDz = math.mean(_.map(params.dz, x => math.abs(x)));
// 	let meanAz = math.mean(_.map(params.az, x => math.abs(x)));
// 	let meanJz = math.mean(_.map(params.jz, x => math.abs(x)));

// 	let ret = data.map((z, i) => {
// 		let lastInc = params.lastInc[i];
// 		let lastZ = params.lastBins[i];
// 		let dz = params.dz[i];
// 		let adz = math.abs(dz);
// 		let ddz = params.ddz[i];
// 		let addz = math.abs(ddz);
// 		let lastAddz = math.abs(params.lastddz[i]);
// 		let dddz = params.dddz[i];
// 		let adddz = math.abs(dddz);
// 		let inc = 0;
// 		let zRatio = z / math.pow(lastZ,1.2);
// 		if ( zRatio > 1 ) zRatio = lastZ / math.pow(z,1.2);

// 		if (ddz > 0)  inc = math.pow(adz,1.7);
// 		else inc = lastInc*zRatio;
// 		if (inc < 0) inc = 0;
// 		params.lastInc[i] = inc;
// 		return z + inc;
// 	}).map(x => {
// 		if (x < 1) return 1;
// 		return x;
// 	}).map((x,i) => {
// 		return x;
//     });

// params.lastBins = _.clone(data);
// 	params.lastdz = _.clone(params.dz);
// 	params.lastddz = _.clone(params.ddz);
// 	params.lastdddz = _.clone(params.dddz);

// 	return ret;
// }

function logistic(x, x0, L, k) {
	return L / (1 + math.pow(math.E, (-k * (x - x0))));
}

function superAlgorithm(bins) {	
	const data = Array.from(bins);
	const fps = 1/dt;

	for (let i = 0; i < data.length; i++) {
		// Timestep forward
		params.dz[i] = (data[i] - params.zLast[i]);
		params.az[i] = (params.dz[i] - params.dzLast[i]);
		params.jz[i] = (params.az[i] - params.azLast[i] );
	}

	// Calculate helpful stuff
	const max = math.max(data);
	const mean = math.mean(data);
	const median = math.median(data);
	// const meanDz = math.mean(_.map(params.dz, x => math.abs(x)));
	// const meanAz = math.mean(_.map(params.az, x => math.abs(x)));
	// const meanJz = math.mean(_.map(params.jz, x => math.abs(x)));


// 	let q = new Array(data.length);
	let result = new Array(data.length);

	for (let i = 0; i < data.length; i++ ) {
		const z = data[i];
		const dz = params.dz[i];
		const az = params.az[i];
		const jz = params.jz[i];


		let A = az;
		result[i] = A;
    }



	params.zLast = _.clone(data);
	params.dzLast = _.clone(params.dz);
	params.azLast = _.clone(params.az);
	params.jzLast = _.clone(params.jz);

	return result;
}
// function superAlgorithm(bins) {
// 	let data = Array.from(bins);

// 	for (let i = 0; i < data.length; i++) {
// 		// Timestep forward
// 		params.dz[i] = data[i] - params.zLast[i];
// 		params.az[i] = params.dz[i] - params.dzLast[i];
// 		params.jz[i] = params.az[i] - params.azLast[i];
// 	}

// 	// Calculate helpful stuff
// 	let max = math.max(data);
// 	let mean = math.mean(data);
// 	let median = math.median(data);
// 	let meanDz = math.mean(_.map(params.dz, x => math.abs(x)));
// 	let meanAz = math.mean(_.map(params.az, x => math.abs(x)));
// 	let meanJz = math.mean(_.map(params.jz, x => math.abs(x)));



// 	let ret = data.map(z => {
// 		if (z < 0) return 0;
// 		return z;
// 	}).map((z, i) => {
// 		let region = extractRegion(data, 8, i);
// 		let power = logistic(params.dz[i] * math.mean(region) / z, 0, 1.1, 0.3);
// 		const A = math.pow(z, power);
// 		let region2= extractRegion(params.zLast, 16, i);

// 		let B = z * (logistic(params.zLast[i] - math.mean(region2) ,0,2,0.7) - 1)  + A;
// 		return B;
// 	}).map(x => {
// 		if (x < 1) return 1;
// 		return x;
// 	}).map((x, i) => {
// 		return x;
// 	});

// 	params.zLast = _.clone(data);
// 	params.dzLast = _.clone(params.dz);
// 	params.azLast = _.clone(params.az);
// 	params.jzLast = _.clone(params.jz);

// 	return ret;
// }

// function superAlgorithm(bins) {
// 	let data = Array.from(bins);

// 	for (let i = 0; i < data.length; i++) {
// 		// Timestep forward
// 		params.dz[i] = data[i] - params.zLast[i];
// 		params.az[i] = params.dz[i] - params.dzLast[i];
// 		params.jz[i] = params.az[i] - params.azLast[i];
// 	}

// 	// Calculate helpful stuff
// 	let max = math.max(data);
// 	let mean = math.mean(data);
// 	let median = math.median(data);
// 	let meanDz = math.mean(_.map(params.dz, x => math.abs(x)));
// 	let meanAz = math.mean(_.map(params.az, x => math.abs(x)));
// 	let meanJz = math.mean(_.map(params.jz, x => math.abs(x)));



// 	let ret = data.map(z => {
// 		if (z < 0) return 0;
// 		return z;
// 	}).map((z, i) => {
// 		let region = extractRegion(data, 16, i);
// 		let power = logistic(params.dz[i] * math.mean(region) / z, 0, 1.2, 0.2);
// 		const A = math.pow(z, power);
// 		let region2= extractRegion(params.zLast, 32, i);

// 		let B = z * (logistic(params.zLast[i] - math.mean(region2) ,0,2,0.3) - 1)  + A;
// 		return B;
// 	}).map(x => {
// 		if (x < 1) return 1;
// 		return x;
// 	}).map((x, i) => {
// 		return x;
// 	});

// 	params.zLast = _.clone(data);
// 	params.dzLast = _.clone(params.dz);
// 	params.azLast = _.clone(params.az);
// 	params.jzLast = _.clone(params.jz);

// 	return ret;
// }

// function superAlgorithm(bins) {
// 	let data = Array.from(bins);

// 	for (let i = 0; i < data.length; i++) {
// 		// Timestep forward
// 		params.dz[i] = data[i] - params.zLast[i];
// 		params.az[i] = params.dz[i] - params.dzLast[i];
// 		params.jz[i] = params.az[i] - params.azLast[i];
// 	}

// 	// Calculate helpful stuff
// 	let max = math.max(data);
// 	let mean = math.mean(data);
// 	let median = math.median(data);
// 	let meanDz = math.mean(_.map(params.dz, x => math.abs(x)));
// 	let meanAz = math.mean(_.map(params.az, x => math.abs(x)));
// 	let meanJz = math.mean(_.map(params.jz, x => math.abs(x)));



// 	let ret = data.map(z => {
// 		if (z < 0) return 0;
// 		return z;
// 	}).map((z, i) => {
// 		let region = extractRegion(params.dz, 16, i);
// 		let power = logistic(params.dz[i] * mean / z, 0, 1.2, 0.2);
// 		const A = math.pow(z, power);
// 		let region2= extractRegion(params.zLast, 32, i);

// 		let B = z * logistic(params.zLast[i] - math.mean(region2) ,0,1,0.4) + A;
// 		return B;
// 	}).map(x => {
// 		if (x < 1) return 1;
// 		return x;
// 	}).map((x, i) => {
// 		return x;
// 	});

// 	params.zLast = _.clone(data);
// 	params.dzLast = _.clone(params.dz);
// 	params.azLast = _.clone(params.az);
// 	params.jzLast = _.clone(params.jz);

// 	return ret;
// }

function diff(a, b) {
	return math.abs(a - b) / ((a + b) / 2);
}

function squeeze(y, p = 8.3, k = 31) {
	return (math.pow(y, math.log(math.square(p) + 10)) + k) / (math.cosh(1 / y) + k)
}

function squeeze2(y, p = 5.5, a = 4, b = 2) {
	return math.pow(y, p) / (math.pow(y, p - a) + b);
}

function ease(x, a, b) {
	return x + math.pow(b, x) - (a / x);
}

/* code taken from visualizer by TheNexusAvenger on github */
function normalizeAmplitude(array) {
	var values = [];
	for (var i = 0; i < barCount; i++) {
		values[i] = array[i] / 255 * spectrumHeight;
	}
	return values;
}



function GetVisualBins(Array) {
	var SamplePoints = []
	var NewArray = []
	var LastSpot = 0
	for (var i = 0; i < barCount; i++) {
		var Bin = Math.round(SpectrumEase(i / barCount) * (frequencyMax - frequencyMin) + frequencyMin)
		if (Bin <= LastSpot) {
			Bin = LastSpot + 1
		}
		LastSpot = Bin
		SamplePoints[i] = Bin
	}

	var MaxSamplePoints = []
	for (var i = 0; i < barCount; i++) {
		var CurSpot = SamplePoints[i]
		var NextSpot = SamplePoints[i + 1]
		if (NextSpot == null) {
			NextSpot = frequencyMax
		}

		var CurMax = Array[CurSpot]
		var MaxSpot = CurSpot
		var Dif = NextSpot - CurSpot
		for (var j = 1; j < Dif; j++) {
			var NewSpot = CurSpot + j
			if (Array[NewSpot] > CurMax) {
				CurMax = Array[NewSpot]
				MaxSpot = NewSpot
			}
		}
		MaxSamplePoints[i] = MaxSpot
	}

	for (var i = 0; i < barCount; i++) {
		var CurSpot = SamplePoints[i]
		var NextMaxSpot = MaxSamplePoints[i]
		var LastMaxSpot = MaxSamplePoints[i - 1]
		if (LastMaxSpot == null) {
			LastMaxSpot = frequencyMin
		}
		var LastMax = Array[LastMaxSpot]
		var NextMax = Array[NextMaxSpot]

		NewArray[i] = (LastMax + NextMax) / 2
	}

	//     UpdateParticleAttributes(NewArray)
	return NewArray
}

function averageTransform(array) {
	var values = [];
	var length = array.length;

	for (var i = 0; i < length; i++) {
		var value = 0;
		if (i == 0) {
			value = array[i];
		} else if (i == length - 1) {
			value = (array[i - 1] + array[i]) / 2;
		} else {
			var prevValue = array[i - 1];
			var curValue = array[i];
			var nextValue = array[i + 1];

			if (curValue >= prevValue && curValue >= nextValue) {
				value = curValue;
			} else {
				value = (curValue + Math.max(nextValue, prevValue)) / 2;
			}
		}
		value = Math.min(value + 1, spectrumHeight);

		values[i] = value;
	}

	var newValues = [];
	for (var i = 0; i < length; i++) {
		var value = 0;
		if (i == 0) {
			value = values[i];
		} else if (i == length - 1) {
			value = (values[i - 1] + values[i]) / 2;
		} else {
			var prevValue = values[i - 1];
			var curValue = values[i];
			var nextValue = values[i + 1];

			if (curValue >= prevValue && curValue >= nextValue) {
				value = curValue;
			} else {
				value = ((curValue / 2) + (Math.max(nextValue, prevValue) / 3) + (Math.min(nextValue, prevValue) / 6));
			}
		}
		value = Math.min(value + 1, spectrumHeight);

		newValues[i] = value;
	}
	return newValues;
}

function normalize(value, max, min, dmax, dmin) {
	return (dmax - dmin) / (max - min) * (value - max) + dmax
}

function exponentialTransform(array) {
	var newArr = [];
	for (var i = 0; i < array.length; i++) {
		var exp = (spectrumMaxExponent - spectrumMinExponent) * (1 - Math.pow(i / barCount, spectrumExponentScale)) + spectrumMinExponent;
		newArr[i] = Math.max(Math.pow(array[i] / spectrumHeight, exp) * spectrumHeight, 1);
	}
	return newArr;
}

// top secret bleeding-edge shit in here

function experimentalTransform(array, r) {
	var resistance = r || 3; // magic constant
	var newArr = [];
	for (var i = 0; i < array.length; i++) {
		var sum = 0;
		var divisor = 0;
		for (var j = 0; j < array.length; j++) {
			var dist = Math.abs(i - j);
			var weight = 1 / Math.pow(2, dist);
			if (weight == 1) weight = resistance;
			sum += array[j] * weight;
			divisor += weight;
		}
		newArr[i] = sum / divisor;
	}
	return newArr;
}

function savitskyGolaySmooth(array) {
	var lastArray = array;
	for (var pass = 0; pass < smoothingPasses; pass++) {
		var sidePoints = Math.floor(smoothingPoints / 2); // our window is centered so this is both nL and nR
		var cn = 1 / (2 * sidePoints + 1); // constant
		var newArr = [];
		for (var i = 0; i < sidePoints; i++) {
			newArr[i] = lastArray[i];
			newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
		}
		for (var i = sidePoints; i < lastArray.length - sidePoints; i++) {
			var sum = 0;
			for (var n = -sidePoints; n <= sidePoints; n++) {
				sum += cn * lastArray[i + n] + n;
			}
			newArr[i] = sum;
		}
		lastArray = newArr;
	}
	return newArr;
}
/* ^^ code by TheNexusAvenger */
var factors = [];

function powTransform(arr) {

	const array = arr;

	var newArr = [];

	for (var i = 0; i < array.length; i++) {

		var section = [];

		var sectLen = math.floor(array.length / 3);

		if (0 <= i && i <= sectLen) {
			section = array.slice(0, sectLen + 2) // 0 21
		} else if (sectLen + 1 <= i && i <= 2 * sectLen) {
			section = array.slice(sectLen - 2, 2 * sectLen + 2) // 22 42
		} else if (2 * sectLen + 1 <= i && i <= array.length) {
			section = array.slice(2 * sectLen - 2, array.length) // 43 63
		}

		//Get the value from the array
		var v = array[i];

		//Apply the algorithm
		var first = pass(v, 1, 4);


		//The algorithm
		function pass(val, a, b) {

			//Convert to 0-1
			var dv = val / spectrumMax;

			//Calculate the power factor
			var powerFactor = normalize(v, math.max(section), math.min(section), a, b);

			//The powerfactor must be a number
			if (isNaN(powerFactor)) {
				powerFactor = 1;
			}

			//Another variable
			var pdv = normalize(v, math.max(section), 0, 1, 0);

			//Calculate final value
			var r = math.pow(dv, (1 - (dv * pdv)) * powerFactor) * spectrumMax;
			return r;
		}

		//Add to the array
		newArr[i] = first;
	};

	//Keep values below the max
	if (math.max(newArr) > spectrumMax) {
		newArr = newArr.map(function (v) {
			return normalize(v, math.max(newArr), math.min(newArr), spectrumMax, 0)
		});
	}

	//Keep values above 0
	if (math.min(newArr) < 0) {
		newArr = newArr.map(function (v) {
			return normalize(v, +math.max(newArr), math.min(newArr), spectrumMax, 1)
		});
	}

	//Return the new array
	return newArr;
}
