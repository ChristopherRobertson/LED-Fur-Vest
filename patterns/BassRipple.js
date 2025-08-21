export var frequencyData = array(32);
const MAX_Z = 22.966;
const NUM_COLS = 36;

var t, bass, mid, treble;

function fract(x) {
  return x - floor(x);
}

export function beforeRender(delta) {
  bass = 0;
  for (var b = 0; b < 3; b++) bass = max(bass, frequencyData[b]);
  mid = 0;
  for (var m = 8; m < 20; m++) mid = max(mid, frequencyData[m]);
  treble = 0;
  for (var tband = 20; tband < 32; tband++) treble = max(treble, frequencyData[tband]);

  t = time(0.05 + bass * 0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var column = floor(angle * NUM_COLS);
  var height = z / MAX_Z;
  var wave = abs(fract(height * (2 + treble * 4) - t) - 0.5) * 2;
  var v = (1 - wave) * bass;
  var hue = column / NUM_COLS + mid;

  hsv(hue, 1, min(1, v));
}
