export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  t = time(0.1);
}

export function render3D(index, x, y, z) {
  var treble = 0;
  for (var i = 20; i < 32; i++) treble += frequencyData[i];
  var v = random(1) < treble * 0.05 ? 1 : 0;
  hsv(t + index / pixelCount, 1, v);
}
