export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var bass = frequencyData[0] + frequencyData[1] + frequencyData[2];
  var hue = angle * 4 - z / 16 - t;
  var v = min(1, bass);
  hsv(hue, 1, v);
}
