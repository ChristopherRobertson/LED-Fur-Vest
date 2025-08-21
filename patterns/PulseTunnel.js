export var frequencyData = array(32);
var t, bass, mid;

function fract(x) {
  return x - floor(x);
}

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  mid = 0;
  for (var i = 8; i < 20; i++) mid += frequencyData[i];
  mid /= 12;
  t = time(0.05 + bass * 0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var dist = abs(fract(angle * 3 - t) - 0.5) * 2;
  var hue = angle + mid;
  var v = max(0, 1 - dist * 4) * bass;
  hsv(hue, 1, v);
}
