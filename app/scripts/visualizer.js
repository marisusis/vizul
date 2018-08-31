//  (function(window) {
var barCount = 127; //127
var barSpacing = 5; //6
var barWidth = 2; //1
var spectrumDimensionScalar = 4.5;
var spectrumMaxExponent = 5;
var spectrumMinExponent = 3;
var spectrumExponentScale = 2;

var spectrumMax = 300;

var smoothingPasses = 3;
var smoothingPoints = 100;

var playing = false;

var frequencyMin = 4;
var frequencyMax = 1200;
var SpectrumLogScale = 2.55;
var resRatio = (window.innerWidth / window.innerHeight);

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
canvas.height = spectrumHeight + 60;

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

//The offset is 0.3sec
delayNode.delayTime.value = 0.3;

//Configure analyser node
analyserNode.fftSize = 16384;

//get length of buffer
var bufferLength = analyserNode.frequencyBinCount;

//Create processor node
var processorNode = audioCtx.createScriptProcessor(1024, 1, 1);


var panner = audioCtx.createStereoPanner();

//Set gain
gainNode.gain.value = 1;

//Connect the nodes
source.connect(scaleNode);
scaleNode.connect(analyserNode);
analyserNode.connect(processorNode);
processorNode.connect(gainNode);
source.connect(panner);

panner.connect(delayNode);
delayNode.connect(audioCtx.destination);
gainNode.connect(audioCtx.destination);


//Create data array
var dataArray = new Uint8Array(bufferLength);

//When the audio is loaded
audio.onloadeddata = function(event) {

  console.info("Audio loaded.");

  //Play the audio
  audio.play();

};

//When the audio is played
audio.onplay = function(event) {
  console.info("Playing audio...");

  //Set playing to true
  playing = true;

  //start draw sequence
  window.requestAnimationFrame(draw);
};

//When the audio is paused
audio.onpause = function(event) {
  console.info("Audio paused.");

  //Audio is not playing
  playing = false;


};

//When the audio's time is updated
audio.ontimeupdate = function(event) {
  var percent = audio.currentTime / audio.duration * 100;
  
  $(".line").css({
    "width": percent + "%"
  })
  
  $(".time").text(moment().minutes(0).seconds(audio.currentTime).format("mm:ss"));
  
}

var color__ = window.COLOR;

//Rendering function

function draw() {

  //Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Get the frequency data
  analyserNode.getByteFrequencyData(dataArray);

  //Apply algorithms
  var array = GetVisualBins(dataArray);
  array = normalizeAmplitude(array);
  array = averageTransform(array);
  array = exponentialTransform(array);
  array = powTransform(array);
  array = normalizeAmplitude(array);
  array = experimentalTransform(array, 3);

  //Set the default fill style
  ctx.fillStyle = "#fff";

  //Get the color scale function
  var _color = chroma.scale(window.COLOR).domain([0, math.max(array)]).mode("lch");
  
  var bass = array.slice(0,20);
  
  var modifier = normalize(math.mean(bass),0,spectrumMax,1,5);

  //Iterate over the frequencies
  for(var i = 0; i < array.length; i++) {
    const val = array[i];
    
    

    //Draw the bars
    ctx.fillStyle = _color(Math.floor(val)).css();
    ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 - val / 2, barWidth, val);
  }

  //Cancel the rendering if the song isn't playing
  if(playing) {
    window.requestAnimationFrame(draw);
  }
};

/* code taken from visualizer by TheNexusAvenger on github */
function normalizeAmplitude(array) {
  var values = [];
  for(var i = 0; i < barCount; i++) {
    values[i] = array[i] / 255 * spectrumHeight;
  }
  return values;
}

function GetVisualBins(Array) {
  var SamplePoints = []
  var NewArray = []
  var LastSpot = 0
  for(var i = 0; i < barCount; i++) {
    var Bin = Math.round(SpectrumEase(i / barCount) * (frequencyMax - frequencyMin) + frequencyMin)
    if(Bin <= LastSpot) {
      Bin = LastSpot + 1
    }
    LastSpot = Bin
    SamplePoints[i] = Bin
  }

  var MaxSamplePoints = []
  for(var i = 0; i < barCount; i++) {
    var CurSpot = SamplePoints[i]
    var NextSpot = SamplePoints[i + 1]
    if(NextSpot == null) {
      NextSpot = frequencyMax
    }

    var CurMax = Array[CurSpot]
    var MaxSpot = CurSpot
    var Dif = NextSpot - CurSpot
    for(var j = 1; j < Dif; j++) {
      var NewSpot = CurSpot + j
      if(Array[NewSpot] > CurMax) {
        CurMax = Array[NewSpot]
        MaxSpot = NewSpot
      }
    }
    MaxSamplePoints[i] = MaxSpot
  }

  for(var i = 0; i < barCount; i++) {
    var CurSpot = SamplePoints[i]
    var NextMaxSpot = MaxSamplePoints[i]
    var LastMaxSpot = MaxSamplePoints[i - 1]
    if(LastMaxSpot == null) {
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

  for(var i = 0; i < length; i++) {
    var value = 0;
    if(i == 0) {
      value = array[i];
    } else if(i == length - 1) {
      value = (array[i - 1] + array[i]) / 2;
    } else {
      var prevValue = array[i - 1];
      var curValue = array[i];
      var nextValue = array[i + 1];

      if(curValue >= prevValue && curValue >= nextValue) {
        value = curValue;
      } else {
        value = (curValue + Math.max(nextValue, prevValue)) / 2;
      }
    }
    value = Math.min(value + 1, spectrumHeight);

    values[i] = value;
  }

  var newValues = [];
  for(var i = 0; i < length; i++) {
    var value = 0;
    if(i == 0) {
      value = values[i];
    } else if(i == length - 1) {
      value = (values[i - 1] + values[i]) / 2;
    } else {
      var prevValue = values[i - 1];
      var curValue = values[i];
      var nextValue = values[i + 1];

      if(curValue >= prevValue && curValue >= nextValue) {
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
  return(dmax - dmin) / (max - min) * (value - max) + dmax
}

function exponentialTransform(array) {
  var newArr = [];
  for(var i = 0; i < array.length; i++) {
    var exp = (spectrumMaxExponent - spectrumMinExponent) * (1 - Math.pow(i / barCount, spectrumExponentScale)) + spectrumMinExponent;
    newArr[i] = Math.max(Math.pow(array[i] / spectrumHeight, exp) * spectrumHeight, 1);
  }
  return newArr;
}

// top secret bleeding-edge shit in here

function experimentalTransform(array, r) {
  var resistance = r || 3; // magic constant
  var newArr = [];
  for(var i = 0; i < array.length; i++) {
    var sum = 0;
    var divisor = 0;
    for(var j = 0; j < array.length; j++) {
      var dist = Math.abs(i - j);
      var weight = 1 / Math.pow(2, dist);
      if(weight == 1) weight = resistance;
      sum += array[j] * weight;
      divisor += weight;
    }
    newArr[i] = sum / divisor;
  }
  return newArr;
}

function savitskyGolaySmooth(array) {
  var lastArray = array;
  for(var pass = 0; pass < smoothingPasses; pass++) {
    var sidePoints = Math.floor(smoothingPoints / 2); // our window is centered so this is both nL and nR
    var cn = 1 / (2 * sidePoints + 1); // constant
    var newArr = [];
    for(var i = 0; i < sidePoints; i++) {
      newArr[i] = lastArray[i];
      newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
    }
    for(var i = sidePoints; i < lastArray.length - sidePoints; i++) {
      var sum = 0;
      for(var n = -sidePoints; n <= sidePoints; n++) {
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

  for(var i = 0; i < array.length; i++) {

    var section = [];

    var sectLen = math.floor(array.length / 3);

    if(0 <= i && i <= sectLen) {
      section = array.slice(0, sectLen + 2) // 0 21
    } else if(sectLen + 1 <= i && i <= 2 * sectLen) {
      section = array.slice(sectLen - 2, 2 * sectLen + 2) // 22 42
    } else if(2 * sectLen + 1 <= i && i <= array.length) {
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
      if(isNaN(powerFactor)) {
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
  if(math.max(newArr) > spectrumMax) {
    newArr = newArr.map(function(v) {
      return normalize(v, math.max(newArr), math.min(newArr), spectrumMax, 0)
    });
  }

  //Keep values above 0
  if(math.min(newArr) < 0) {
    newArr = newArr.map(function(v) {
      return normalize(v, +math.max(newArr), math.min(newArr), spectrumMax, 1)
    });
  }

  //Return the new array
  return newArr;
}