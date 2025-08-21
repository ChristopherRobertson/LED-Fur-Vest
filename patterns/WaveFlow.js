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
  for (var i = 8; i < 20; i++) mid = max(mid, frequencyData[i]);
  treble = 0;
  for (var j = 20; j < 32; j++) treble = max(treble, frequencyData[j]);
  var vol = bass + mid + treble;
  t = time(0.02 + vol * 0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var column = floor(angle * NUM_COLS);
  var height = z / MAX_Z;
  var hue = fract(height - t * (1 + bass)) + column / NUM_COLS;
  var v = min(1, mid + treble);
  hsv(hue, 1, v);
}
