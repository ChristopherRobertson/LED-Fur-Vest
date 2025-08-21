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
//                        THREE SPIRAL STREAMS
// =================================================================

var gain = 0.25;
export var currentGain = 0.25; // Export the actual slider gain value

export function sliderGain(v) {
    gain = pow(100, v);
    currentGain = gain; // Update the exported value
}

export var frequencyData = array(32);

// Three streams
var streamHeight1 = 0;
var streamHeight2 = 0;
var streamHeight3 = 0;
var spiralPhase = 0;
var maxLoudness = 0.1;
export var currentLoudness = 0.1; // Export so we can see what it's tracking
export var currentAvg = 0; // Export the normalized average for display
export var rawAverage = 0; // Export the raw average for debugging
export var targetEnvironmentGain = 999; // Start with obvious different value
export var environmentGain = 1.0; // Export so you can see it in vars watch
export var effectiveGain = 0.25; // Export the final calculated gain
export var frameCounter = 0; // Check if beforeRender is running
export var gainDifference = 0; // Export the difference being added each frame
export var deltaValue = 0; // Export delta to see if it's 0
export var calculatedDiff = 0; // Export the raw difference before multiplication

export function beforeRender(delta) {
    frameCounter++; // Increment frame counter

    // Three frequency bands
    var bassEnergy = (frequencyData[0] + frequencyData[2] + frequencyData[4]) / 3;
    var midEnergy = (frequencyData[10] + frequencyData[14] + frequencyData[18]) / 3;
    var trebleEnergy = (frequencyData[24] + frequencyData[28] + frequencyData[31]) / 3;

    // Calculate RAW average for environment detection (before normalization)
    rawAverage = (bassEnergy + midEnergy + trebleEnergy) / 3;

    // Track current average level for environment detection using RAW data
    currentLoudness += (rawAverage - currentLoudness) * delta / 1000 * 4; // Fast tracking

    // Track both peaks and current levels for NORMALIZATION
    var currentMax = max(max(bassEnergy, midEnergy), trebleEnergy);

    // Keep the old AGC for normalization
    if (currentMax > maxLoudness) {
        maxLoudness = currentMax;
    } else {
        maxLoudness -= delta / 1000 * 0.5;
        maxLoudness = max(maxLoudness, 0.01);
    }

    // Normalized average (just for display/debugging)
    currentAvg = rawAverage / maxLoudness;

    // Use current loudness (RAW, not normalized) for environment adjustment
    targetEnvironmentGain = 1.0; // Default value
    if (currentLoudness < 0.0005) {
        targetEnvironmentGain = 1.8; // Boost for quiet (reduced sensitivity and boost)
    } else if (currentLoudness > 0.015) {
        targetEnvironmentGain = 0.5; // Reduce for loud
    } else if (currentLoudness > 0.008) {
        targetEnvironmentGain = 0.75; // Moderate reduction
    }

    // Store the calculated difference for debugging
    calculatedDiff = targetEnvironmentGain - environmentGain;
    gainDifference = calculatedDiff * delta / 1000 * 1.0;
    deltaValue = delta; // Store delta for debugging

    // Faster adjustment to environment changes
    environmentGain += gainDifference;

    // Use environment gain with your manual gain setting
    effectiveGain = gain * environmentGain; // Update the exported variable

    // Stream heights with effective gain (using normalized values)
    var targetHeight1 = (bassEnergy / maxLoudness) * effectiveGain;
    var targetHeight2 = (midEnergy / maxLoudness) * effectiveGain;
    var targetHeight3 = (trebleEnergy / maxLoudness) * effectiveGain;

    streamHeight1 += (targetHeight1 - streamHeight1) * delta / 1000 * 6;
    streamHeight2 += (targetHeight2 - streamHeight2) * delta / 1000 * 6;
    streamHeight3 += (targetHeight3 - streamHeight3) * delta / 1000 * 6;

    // Spiral rotation
    spiralPhase += delta / 1000 * 0.3;
}

export function render(index) {
    var col = pixelToColumn[index];
    if (!col) {
        rgb(0, 0, 0);
        return;
    }

    var pos = pixelToColumnPos[index];
    var columnAngle = (col - 1) / numColumns * PI2;

    // Three spiral streams starting 120 degrees apart
    var stream1Angle = (columnAngle - pos * 0.5 + spiralPhase) % PI2;
    var stream2Angle = (columnAngle - pos * 0.5 + spiralPhase + PI2 / 3) % PI2;
    var stream3Angle = (columnAngle - pos * 0.5 + spiralPhase + PI2 * 2 / 3) % PI2;

    var intensity = 0;
    var hue = 0;
    var saturation = 0;

    // Check stream 1 (bass - red)
    if (sin(stream1Angle * 6) > 0.5 && pos < streamHeight1) {
        intensity = streamHeight1 * (1 - pos);
        hue = 0.02; // Red
        saturation = 0.8 + streamHeight1 * 0.2; // High saturation range (0.8-1.0)
    }
    // Check stream 2 (mid - green)  
    else if (sin(stream2Angle * 6) > 0.5 && pos < streamHeight2) {
        intensity = streamHeight2 * (1 - pos);
        hue = 0.33; // Green
        saturation = 0.8 + streamHeight2 * 0.2; // High saturation range (0.8-1.0)
    }
    // Check stream 3 (treble - blue)
    else if (sin(stream3Angle * 6) > 0.5 && pos < streamHeight3) {
        intensity = streamHeight3 * (1 - pos);
        hue = 0.66; // Blue
        saturation = 0.8 + streamHeight3 * 0.2; // High saturation range (0.8-1.0)
    }

    hsv(hue, saturation, intensity);
}