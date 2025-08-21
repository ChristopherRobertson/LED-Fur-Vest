export var frequencyData = array(32);
var t, bass, mid, treble;

function fract(x) {
  return x - floor(x);
}

export function beforeRender(delta) {
  bass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;
  mid = 0;
  for (var i = 8; i < 20; i++) mid += frequencyData[i];
  mid /= 12;
  treble = 0;
  for (var j = 20; j < 32; j++) treble += frequencyData[j];
  treble /= 12;
  var vol = bass + mid + treble;
  t = time(0.02 + vol * 0.05);
}

export function render3D(index, x, y, z) {
  var height = z / 16;
  var hue = fract(height - t * (1 + bass));
  var v = min(1, mid + treble);
  hsv(hue, 1, v);
}
