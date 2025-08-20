export var frequencyData = array(32);
var flash = 0;
var t;

export function beforeRender(delta) {
  var vol = 0;
  for (var i = 0; i < 32; i++) vol += frequencyData[i];
  flash = max(flash - delta / 400, vol);
  t = time(0.02);
}

export function render3D(index, x, y, z) {
  var angle = (atan2(y, x) + PI) / (2 * PI);
  hsv(angle + t, 1, min(1, flash));
}
