export var frequencyData = array(32);
var flash = 0;
var t, bass, treble;

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  treble = 0;
  for (var i = 20; i < 32; i++) treble += frequencyData[i];
  treble /= 12;
  flash = max(flash - delta / 400, bass);
  t = time(0.02 + treble * 0.05);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  var hue = angle + t + treble;
  hsv(hue, 1, flash);
}
