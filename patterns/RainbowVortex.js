export var frequencyData = array(32);
var t, bass, treble;

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  treble = 0;
  for (var i = 20; i < 32; i++) treble += frequencyData[i];
  treble /= 12;
  t = time(0.05 + bass * 0.04);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var hue = angle * 4 - z / 16 - t + treble;
  var v = bass;
  hsv(hue, 1, v);
}
