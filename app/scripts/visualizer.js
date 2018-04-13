(function(root) {
  var barCount = 127;
  var barSpacing = 6;
  var barWidth = 1;
  var spectrumDimensionScalar = 4.5;
  var spectrumMaxExponent = 5;
  var spectrumMinExponent = 3;
  var spectrumExponentScale = 2;

  var smoothingPasses = 3;
  var smoothingPoints = 100;

  var frequencyMin = 4;
  var frequencyMax = 1200;
  var SpectrumLogScale = 2.55;
  var resRatio = (window.innerWidth / window.innerHeight);

  var spectrumHeight = 300;

  function SpectrumEase(Value) {
    return Math.pow(Value, SpectrumLogScale);
  }

  //Get audio element
  const audio = document.getElementById("audio");

  //Get canvas
  var canvas = document.getElementById("canvas");

  canvas.width = (barCount * (barWidth + barSpacing));
  canvas.height = spectrumHeight;
  //   canvas.clientHeight = canvas.height;
  //   canvas.clientWidth = canvas.width;

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

  var delayNode = audioCtx.createDelay();

  delayNode.delayTime.value = 0.3;

  root.delayNode = delayNode;

  //Configure analyser node
  analyserNode.fftSize = 16384;

  //get length of buffer
  var bufferLength = analyserNode.frequencyBinCount;

  //Create processor node
  var processorNode = audioCtx.createScriptProcessor(1024, 1, 1);


  //Set gain
  gainNode.gain.value = 1;

  //Connect the nodes
  source.connect(analyserNode);

  analyserNode.connect(processorNode);

  processorNode.connect(gainNode);

  source.connect(delayNode);

  delayNode.connect(audioCtx.destination);

  gainNode.connect(audioCtx.destination);


  //Create data array
  var dataArray = new Uint8Array(bufferLength);

  audio.onloadeddata = function(event) {

    console.info("Audio loaded.");

    //Play the audio
    audio.play();

  };

  processorNode.onaudioprocess = function(event) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    analyserNode.getByteFrequencyData(dataArray);

    var array = GetVisualBins(dataArray);
    array = normalizeAmplitude(array);
    array = averageTransform(array);
//     array = savitskyGolaySmooth(array);
    array = exponentialTransform(array);
    array = powTransform(array);
    array = normalizeAmplitude(array);
    array = experimentalTransform(array);

    ctx.fillStyle = "#fff";

    for(var i = 0; i < array.length; i++) {
      //       ctx.fillStyle = chroma([100,0,0]).css();

      var val = array[i];

      ctx.fillRect(i * (barWidth + barSpacing), canvas.height / 2 - val / 2, barWidth, array[i]);
    }



  };


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

  function powTransformWhole(array) {
    var newArr = [];
    for(var i = 0; i < array.length; i++) {

      var v = array[i];
      var dv = v / 255
      var powerFactor = normalize(v, math.max(array), math.min(array), 2, 1.5);
      var pdv = normalize(v, math.max(array), 0, 1, 0);
      var r = math.pow(dv, (1 - (dv * pdv)) * powerFactor) * 255

      var dr = r / 255
      var powerFactor2 = normalize(v, math.max(array), math.min(array), 1, 1.5);
      var r2 = math.pow(dr, (1 - (dr * pdv)) * powerFactor2) * 255
      newArr[i] = r2;
      // 		newArr[i] = section[i%21]||0
    };
    if(math.max(newArr) >= 255) {
      newArr = newArr.map(function(v) {
        return normalize(v, math.max(newArr), math.min(newArr), 255, 0)
      });
    }
    if(math.min(newArr) <= 0) {
      newArr = newArr.map(function(v) {
        return normalize(v, math.max(newArr), math.min(newArr), 255, 1)
      });
    }
    for(var i = 0; i < array.length; i++) {
      // newArr[i] = normalize(newArr[i],0,255,255,0)
    }


    return newArr;
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

  function powTransform(array) {
    
    var newArr = [];
    
    for(var i = 0; i < array.length; i++) {
      var section = [];
      
      var sectLen = math.floor(array.length/3);
      
      var arr = array;
      
      if(0 <= i && i <= sectLen) {
        section = array.slice(0, sectLen + 2) // 0 21
      } else if(sectLen+1 <= i && i <= 2*sectLen) {
        section = array.slice(sectLen - 2 , 2*sectLen + 2) // 22 42
      } else if(2*sectLen+1 <= i && i <= array.length) {
        section = array.slice(2*sectLen-2, array.length) // 43 63
        arr = array.map(x => x*3);
      }

      
      
      var v = array[i];
      var dv = v / 255
      var powerFactor = normalize(v, math.max(section), math.min(section), 2, 1.6);
      var pdv = normalize(v, math.max(section), 0, 1, 0);
      var r = Math.pow(dv, (1 - (dv * pdv)) * powerFactor) * 255

      var dr = r / 255
      var powerFactor2 = normalize(v, math.max(section), math.min(section), 1, 1.5);
      var r2 = Math.pow(dr, (1 - (dr * pdv)) * powerFactor) * 255
      newArr[i] = r2;
      // 		newArr[i] = section[i%21]||0
    };
    if(math.max(newArr) >= 255) {
      newArr = newArr.map(function(v) {
        return normalize(v, math.max(newArr), math.min(newArr), 255, 0)
      });
    }
    if(math.min(newArr) <= 0) {
      newArr = newArr.map(function(v) {
        return normalize(v, math.max(newArr), math.min(newArr), 255, 1)
      });
    }
    for(var i = 0; i < array.length; i++) {
      // newArr[i] = normalize(newArr[i],0,255,255,0)
    }


    return newArr;
  }


})(window);