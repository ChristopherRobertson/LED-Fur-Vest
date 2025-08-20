export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var bass = frequencyData[0] + frequencyData[1] + frequencyData[2];
  var dist = abs(fract(angle - t) - 0.5) * 2;
  var v = max(0, 1 - dist * 4) * min(1, bass);
  hsv(angle, 1, v);
}
