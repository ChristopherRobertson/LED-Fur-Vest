export var frequencyData = array(32);
const NUM_COLS = 36;

var t, bass, mid;

function fract(x) {
  return x - floor(x);
}

export function beforeRender(delta) {
  bass = 0;
  for (var b = 0; b < 3; b++) bass = max(bass, frequencyData[b]);
  mid = 0;
  for (var i = 8; i < 20; i++) mid = max(mid, frequencyData[i]);

  t = time(0.05 + bass * 0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var column = floor(angle * NUM_COLS);
  var dist = abs(fract(column / NUM_COLS * 3 - t) - 0.5) * 2;
  var hue = column / NUM_COLS + mid;

  var v = max(0, 1 - dist * 4) * bass;
  hsv(hue, 1, v);
}
