// =================================================================
//                        GEOMETRY DEFINITION
// =================================================================

var columnLengths = [0, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25];
var numColumns = columnLengths.length - 1;

var pixelToColumn = array(pixelCount);
var pixelToColumnPos = array(pixelCount);

for (var col = 1; col <= numColumns; col++) {
    var acc = 0;
    for (var i = 1; i < col; i++) {
        acc += columnLengths[i];
    }
    var start = acc;
    var len = columnLengths[col];
    var isReversed = (col % 2 == 0);

    for (var i = 0; i < len; i++) {
        var pixelIndex = start + i;
        pixelToColumn[pixelIndex] = col;
        var pos = (len > 1) ? (i / (len - 1)) : 0;
        pixelToColumnPos[pixelIndex] = isReversed ? (1 - pos) : pos;
    }
}

// =================================================================
//                        EXPANDING BASS SPHERES
// =================================================================

var gain = 0.25;
export function sliderGain(v) {
    gain = pow(100, v);
}

export var frequencyData = array(32);

var sphereRadius = 0;
var colorPhase = 0;
var maxLoudness = 0.1;

export function beforeRender(delta) {
    // Bass controls sphere size
    var currentBass = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;

    if (currentBass > maxLoudness) {
        maxLoudness = currentBass;
    } else {
        maxLoudness -= delta / 1000 * 0.1;
        maxLoudness = max(maxLoudness, 0.01);
    }

    // Sphere size from bass
    var normalizedBass = currentBass / maxLoudness;
    var targetRadius = normalizedBass * gain * 15; // Max radius of 15 inches
    sphereRadius += (targetRadius - sphereRadius) * delta / 1000 * 8;

    // Smooth color rotation
    colorPhase += delta / 1000 * 0.3; // Adjust speed here (0.3 = slow, 1.0 = fast)
}

export function render(index) {
    var col = pixelToColumn[index];
    if (!col) {
        rgb(0, 0, 0);
        return;
    }

    var pos = pixelToColumnPos[index];
    var height = pos * columnLengths[col] * 0.656; // Height in inches

    // Front sphere center (columns 9-10)
    var frontCenterCol = 9.5;
    var frontCenterHeight = 12; // Middle height

    // Back sphere center (columns 27-28) 
    var backCenterCol = 27.5;
    var backCenterHeight = 12; // Middle height

    // Calculate distance from front sphere center
    var frontColDist = abs(col - frontCenterCol);
    var frontHeightDist = abs(height - frontCenterHeight);
    var frontDistance = sqrt(frontColDist * frontColDist * 4 + frontHeightDist * frontHeightDist); // Scale column distance

    // Calculate distance from back sphere center
    var backColDist = abs(col - backCenterCol);
    var backHeightDist = abs(height - backCenterHeight);
    var backDistance = sqrt(backColDist * backColDist * 4 + backHeightDist * backHeightDist); // Scale column distance

    var intensity = 0;
    var hue = 0;

    // Light up if within sphere radius from either center
    if (frontDistance <= sphereRadius) {
        intensity = 1 - (frontDistance / sphereRadius); // Fade from center
        hue = (colorPhase) % 1; // Front sphere cycles through all colors
    } else if (backDistance <= sphereRadius) {
        intensity = 1 - (backDistance / sphereRadius); // Fade from center
        hue = (colorPhase + 0.5) % 1; // Back sphere is opposite color (180 degrees offset)
    }

    hsv(hue, 0.8, intensity);
}