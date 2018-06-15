function p(p) {
  return p;
}
function c(p) {
  return (p << 16) >> 3;
}

/**
 * Write byte and return new Buffer
 * @param {Buffer} buffer
 * @param {Number} byte
 */
function byte(buffer, byte) {
  var b = new Buffer(1);
  b.writeInt8(byte);
  return Buffer.concat([buffer, b]);
}

/**
 * Write short and return new Buffer
 * @param {Buffer} buffer
 * @param {Number} short
 */
function short(buffer, short) {
  var b = new Buffer(2);
  b.writeInt16BE(short);
  return Buffer.concat([buffer, b]);
}

/**
 * Write int and return new Buffer
 * @param {Buffer} buffer
 * @param {Number} int
 */
function int(buffer, int) {
  var b = new Buffer(4);
  b.writeInt32BE(int);
  return Buffer.concat([buffer, b]);
}

/**
 * Write string and return new Buffer
 * @param {Buffer} buffer
 * @param {String} s
 */
function str(buffer, s) {
  return new Buffer(buffer + s);
}

async function buffer(levels) {
  var difficultyHeaders = [];
  var trackHeaders = [[], [], []];
  var tracksBuffers = [[], [], []];

  for (var dIndex = 0; dIndex < levels.length; dIndex++) {
    var difficulty = levels[dIndex];
    var df = new Buffer(0);
    df = int(df, difficulty.length);

    for (var tIndex = 0; tIndex < difficulty.length; tIndex++) {
      var track = difficulty[tIndex];
      var trackHeader = new Buffer(0);
      df = int(df, 0);
      df = str(df, track.title);
      df = byte(df, 0x00);

      trackHeader = int(trackHeader, 0);
      trackHeader = str(trackHeader, track.title);
      trackHeader = byte(trackHeader, 0x00);
      trackHeaders[dIndex].push(trackHeader);

      var tb = new Buffer(0);
      tb = byte(tb, 0x33);
      tb = int(tb, c(track.start.x));
      tb = int(tb, c(track.start.y));
      tb = int(tb, c(track.finish.x));
      tb = int(tb, c(track.finish.y));
      tb = short(tb, track.points.length);
      var lastPoint = track.points[0];
      tb = int(tb, p(lastPoint.x));
      tb = int(tb, p(lastPoint.y));
      for (var pIndex = 1; pIndex < track.points.length; pIndex++) {
        var point = track.points[pIndex];
        if (
          point.x - lastPoint.x > 127 ||
          Math.abs(point.y - lastPoint.y) > 127
        ) {
          tb = byte(tb, -1);
          tb = int(tb, p(point.x));
          tb = int(tb, p(point.y));
        } else {
          tb = byte(tb, point.x - lastPoint.x);
          tb = byte(tb, point.y - lastPoint.y);
        }
        lastPoint = point;
      }
      tracksBuffers[dIndex].push(new Buffer(tb));
    }

    difficultyHeaders.push(df);
  }

  // difficulty define 3 integers (4 bytes) to set amount of tracks in difficulty

  var trackHeaderOffset = difficultyHeaders
    .map(b => new Buffer(b).byteLength)
    .reduce((p, c) => p + c, 0);
  for (var dIndex = 0; dIndex < levels.length; dIndex++) {
    var difficulty = levels[dIndex];
    for (var tIndex = 0; tIndex < difficulty.length; tIndex++) {
      var track = difficulty[tIndex];

      var trackHeader = trackHeaders[dIndex][tIndex];
      trackHeaders[dIndex][tIndex] = Buffer.concat([
        int(new Buffer(0), trackHeaderOffset),
        new Buffer(trackHeader).slice(4)
      ]);
      if (trackHeader.byteLength !== trackHeaders[dIndex][tIndex].byteLength) {
        console.log("WAWOW", dIndex, tIndex);
      }
      trackHeaderOffset += new Buffer(tracksBuffers[dIndex][tIndex]).byteLength;
    }
  }
  const finalHeaders = trackHeaders.reduce((p, c) => {
    return [...p, new Buffer(int(new Buffer(0), c.length)), ...c];
  }, []);
  const finalTracks = tracksBuffers.reduce((p, c) => {
    return [...p, ...c];
  }, []);
  return Buffer.concat([...finalHeaders, ...finalTracks]);
}

async function write(fileName, levels) {
  var error = await require("fs").writeFile(fileName, await buffer(levels));
  if (error) {
    throw error;
  }
  return null;
}

module.exports = write;
module.exports.buffer = buffer;
