export var frequencyData = array(32);
var t, bass, mid, treble;

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  mid = 0;
  for (var i = 8; i < 20; i++) mid += frequencyData[i];
  mid /= 12;
  treble = 0;
  for (var j = 20; j < 32; j++) treble += frequencyData[j];
  treble /= 12;
  t = time(0.02 + treble * 0.02);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var hue = angle * 3 + t + bass;
  var band = sin((z / 16 + t * 2) * PI * 2) * 0.5 + 0.5;
  var v = band * min(1, mid);
  hsv(hue, 1, v);
}
