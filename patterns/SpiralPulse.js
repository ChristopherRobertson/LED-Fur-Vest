export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.04);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var height = z / 16;
  var bass = frequencyData[0] + frequencyData[1] + frequencyData[2];
  var hue = angle + height - t;
  var v = min(1, bass * 2);
  hsv(hue, 1, v);
}
