export var frequencyData = array(32);
var t, bass, treble;

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  treble = 0;
  for (var i = 20; i < 32; i++) treble += frequencyData[i];
  treble /= 12;
  t = time(0.04 + treble * 0.04);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var height = z / 16;
  var hue = angle + height - t + treble;
  var v = min(1, bass * 2);
  hsv(hue, 1, v);
}
