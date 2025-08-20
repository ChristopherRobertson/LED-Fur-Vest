export var frequencyData = array(32);

export function render3D(index, x, y, z) {
  var height = z / 16;
  var band = floor(height * 6);
  var value = frequencyData[band] * 1.5;
  var hue = band / 6;
  hsv(hue, 1, min(1, value));
}
