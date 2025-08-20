export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.05);
}

export function render3D(index, x, y, z) {
  var bass = frequencyData[0] + frequencyData[1] + frequencyData[2];
  var height = z / 16;
  var wave = abs(fract(height * 4 - t * bass) - 0.5) * 2;
  var v = (1 - wave) * min(1, bass);
  hsv(height, 1, v);
}
