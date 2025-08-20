export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.03);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var mid = frequencyData[5] + frequencyData[6] + frequencyData[7] + frequencyData[8];
  var hue = angle * 2 + z / 16 - t;
  var v = min(1, mid * 1.5);
  hsv(hue, 1, v);
}
