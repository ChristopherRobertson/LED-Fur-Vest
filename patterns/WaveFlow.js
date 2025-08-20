export var frequencyData = array(32);
var t;

export function beforeRender(delta) {
  var vol = 0;
  for (var i = 0; i < 32; i++) vol += frequencyData[i];
  t = time(0.02 + vol * 0.05);
}

export function render3D(index, x, y, z) {
  var height = z / 16;
  hsv(fract(height - t), 1, 1);
}
