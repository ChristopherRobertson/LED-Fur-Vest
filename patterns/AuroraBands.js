export var frequencyData = array(32);
const MAX_Z = 22.966;
const NUM_COLS = 36;
var t, bass, mid, treble;

export function beforeRender(delta) {
  bass = 0;
  for (var b = 0; b < 3; b++) bass = max(bass, frequencyData[b]);
  mid = 0;
  for (var m = 8; m < 20; m++) mid = max(mid, frequencyData[m]);
  treble = 0;
  for (var tband = 20; tband < 32; tband++) treble = max(treble, frequencyData[tband]);

  t = time(0.02 + treble * 0.02);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var column = floor(angle * NUM_COLS);
  var colNorm = column / NUM_COLS;
  var height = z / MAX_Z;
  var band = sin((height * 3 - t * 2) * PI) * 0.5 + 0.5;
  var hue = colNorm + t + bass;
  var v = band * min(1, mid * 1.5);

  hsv(hue, 1, v);
}
