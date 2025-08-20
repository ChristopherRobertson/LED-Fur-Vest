export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.02);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var hue = angle * 3 + t;
  var mid = 0;
  for (var i = 8; i < 20; i++) mid += frequencyData[i];
  var v = min(1, mid);
  hsv(hue, 1, v);
}
