export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.02);
}

export function render3D(index, x, y, z) {
  var height = z / 16;
  var band = floor(height * 6);
  var value = frequencyData[band] * 2;
  var hue = band / 6 + t;
  hsv(hue, 1, min(1, value));
}
