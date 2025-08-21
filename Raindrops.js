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
//                        RAIN RIPPLES PATTERN
// =================================================================

var gain = 0.25;
var rippleSpeed = 1.0;

export function sliderGain(v) {
    gain = pow(100, v);
}

export function sliderRippleSpeed(v) {
    rippleSpeed = 0.5 + v * 1.5; // 0.5x to 2.0x speed
}

export var frequencyData = array(32);

// Ripple state - up to 5 ripples at once
var maxRipples = 5;
var rippleCenterCol = array(maxRipples);
var rippleCenterHeight = array(maxRipples);
var rippleRadius = array(maxRipples);
var rippleIntensity = array(maxRipples);
var rippleAge = array(maxRipples);
var rippleHue = array(maxRipples); // Each ripple gets its own color

var maxLoudness = 0.1;
var dropTimer = 0;

export function beforeRender(delta) {
    // Bass hits create new raindrops
    var bassEnergy = (frequencyData[0] + frequencyData[1] + frequencyData[2]) / 3;

    // AGC
    if (bassEnergy > maxLoudness) {
        maxLoudness = bassEnergy;
    } else {
        maxLoudness -= delta / 1000 * 0.1;
        maxLoudness = max(maxLoudness, 0.01);
    }

    var normalizedBass = bassEnergy / maxLoudness * gain;

    // Create new raindrop when bass hits above threshold
    var bassThreshold = 0.3;
    if (normalizedBass > bassThreshold) {
        // Find an unused ripple slot
        for (var i = 0; i < maxRipples; i++) {
            if (rippleIntensity[i] <= 0) {
                // Create new ripple at random location with random color
                rippleCenterCol[i] = 1 + random(numColumns);
                rippleCenterHeight[i] = random(20); // Random height 0-20 inches
                rippleRadius[i] = 0;
                rippleIntensity[i] = 0.5 + normalizedBass * 0.5; // Bass intensity affects brightness
                rippleAge[i] = 0;
                rippleHue[i] = random(1); // Random color for each raindrop
                break;
            }
        }
    }

    // Update existing ripples
    for (var i = 0; i < maxRipples; i++) {
        if (rippleIntensity[i] > 0) {
            rippleAge[i] += delta / 1000 * rippleSpeed;
            rippleRadius[i] = rippleAge[i] * 8; // Expand at 8 inches per second
            rippleIntensity[i] = max(0, (1 - rippleAge[i] / 3)); // Fade over 3 seconds
        }
    }
}

export function render(index) {
    var col = pixelToColumn[index];
    if (!col) {
        rgb(0, 0, 0);
        return;
    }

    var pos = pixelToColumnPos[index];
    var height = pos * columnLengths[col] * 0.656; // Height in inches

    var totalIntensity = 0;
    var finalHue = 0;
    var weightedHueSum = 0;
    var totalWeight = 0;

    // Check all active ripples
    for (var i = 0; i < maxRipples; i++) {
        if (rippleIntensity[i] > 0) {
            // Calculate distance from this pixel to ripple center
            var colDist = abs(col - rippleCenterCol[i]);
            var heightDist = abs(height - rippleCenterHeight[i]);
            var distance = sqrt(colDist * colDist * 4 + heightDist * heightDist); // Scale column distance

            // Create ripple ring effect
            var ringDistance = abs(distance - rippleRadius[i]);
            var ringWidth = 2.0; // Width of the ripple ring

            if (ringDistance < ringWidth) {
                var ringIntensity = (1 - ringDistance / ringWidth) * rippleIntensity[i];
                totalIntensity += ringIntensity;

                // Weight the color by the intensity of this ripple
                weightedHueSum += rippleHue[i] * ringIntensity;
                totalWeight += ringIntensity;
            }
        }
    }

    // Calculate final color based on weighted average of overlapping ripples
    if (totalWeight > 0) {
        finalHue = weightedHueSum / totalWeight;
    }

    // Clamp intensity
    totalIntensity = min(totalIntensity, 1.0);

    hsv(finalHue, 0.8, totalIntensity);
}