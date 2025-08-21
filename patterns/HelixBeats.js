export var frequencyData = array(32);
const MAX_Z = 22.966;
const NUM_COLS = 36;
var t, bass, mid, treble;

export function beforeRender(delta) {
  bass = 0;
  for (var b = 0; b < 3; b++) bass = max(bass, frequencyData[b]);
  mid = 0;
  for (var m = 5; m <= 8; m++) mid = max(mid, frequencyData[m]);
  treble = 0;
  for (var i = 20; i < 32; i++) treble = max(treble, frequencyData[i]);
  t = time(0.03 + bass * 0.04);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var column = floor(angle * NUM_COLS);
  var height = z / MAX_Z;
  var hue = column / NUM_COLS * 2 + height - t + treble;
  var v = min(1, mid * 1.5);
  hsv(hue, 1, v);
}
