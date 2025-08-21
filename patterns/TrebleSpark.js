export var frequencyData = array(32);
var t, bass, treble;

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  treble = 0;
  for (var i = 20; i < 32; i++) treble += frequencyData[i];
  treble /= 12;
  t = time(0.1 + treble * 0.05);
}

export function render3D(index, x, y, z) {
  var v = random(1) < treble * 0.1 ? 1 : 0;
  hsv(t + index / pixelCount + bass, 1, v);
}
