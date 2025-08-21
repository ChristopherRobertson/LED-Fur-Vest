// =================================================================
//
//                        GEOMETRY DEFINITION
//
// This file contains the master definition for the coat's geometry
// and provides pre-computed lookup tables for use by the patterns.
// It should be included before any pattern files.
//
// =================================================================


// --- Master Geometry Definition ---
// This is the single source of truth for the coat's physical layout.
// The first '0' is a spacer for 1-based indexing.
var columnLengths = [0,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25];


// --- Pre-computed Variables ---
var numColumns = columnLengths.length - 1;

// Calculate the maximum number of LEDs in any single column
var maxColumnLength = 0;
for (var i = 1; i <= numColumns; i++) {
    if (columnLengths[i] > maxColumnLength) {
        maxColumnLength = columnLengths[i];
    }
}

// Compute the starting pixel index for each column (1-based)
var columnStartIndices = array(numColumns + 1);
var acc = 0;
columnStartIndices[0] = 0;
for (var col = 1; col <= numColumns; col++) {
  columnStartIndices[col] = acc;
  acc += columnLengths[col];
}

// Create a lookup table for serpentine wiring (true if column is top-to-bottom)
var isReversed = array(numColumns + 1);
for (var col = 1; col <= numColumns; col++) {
  isReversed[col] = (col % 2 == 0);
}

// Create a lookup table to quickly find which column a pixel belongs to
var pixelToColumn = array(pixelCount);
// Create a lookup table for a pixel's normalized (0-1) position within its column
var pixelToColumnPos = array(pixelCount);

for (var col = 1; col <= numColumns; col++) {
    var start = columnStartIndices[col];
    var len = columnLengths[col];
    for (var i = 0; i < len; i++) {
        var pixelIndex = start + i;
        pixelToColumn[pixelIndex] = col;
        // Calculate normalized position (0.0 at bottom, 1.0 at top)
        var pos = (len > 1) ? (i / (len - 1)) : 0;
        pixelToColumnPos[pixelIndex] = isReversed[col] ? pos : (1 - pos);
    }
}


// --- Column Groupings ---
// An array of all columns that are part of the main body
var bodyColumns = array(numColumns);
for (var i = 0; i < numColumns; i++) {
    bodyColumns[i] = i + 1;
}

// A reversed copy of the body columns, useful for symmetrical patterns
var bodyColumnsReversed = array(bodyColumns.length);
for (var i = 0; i < bodyColumns.length; i++) {
  bodyColumnsReversed[i] = bodyColumns[bodyColumns.length - 1 - i];
}

/**
 * BassEnergy (Pulse from Back)
 *
 * This pattern generates waves of energy that pulse outwards from the
 * bottom-center of the back. It features a beat detector that speeds
 * up the pulse rate during sustained bass notes.
 */

// --- UI Controls ---
export var sensitivity = 0.8;
export var speed = 0.5;

export function sliderSensitivity(v) { sensitivity = v; }
export function sliderSpeed(v) { speed = v; }


// --- Sensor Board Data ---
export var frequencyData = array(32);

// --- Beat Detection & Pulse State ---
// Each pulse is an array: [startTime, x, y, z, hue]
var START_TIME = 0, X_COORD = 1, Y_COORD = 2, Z_COORD = 3, HUE = 4;

var MAX_PULSES = 20;
var pulses = array(MAX_PULSES);
for (var i = 0; i < MAX_PULSES; i++) {
  pulses[i] = array(5);
  pulses[i][START_TIME] = -1;
  pulses[i][HUE] = random(1); // Initialize with a random hue

}
var pulsePointer = 0;
var avgBass = 0;
var sustainedBassTimer = 0;
var timeSinceLastPulse = 9999;


// --- 3D Map & Epicenter Storage ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);


export function beforeRender(delta) {
    if (!isMapInitialized) return;

    timeSinceLastPulse += delta;

    // --- Beat Detection ---
    var rawBass = frequencyData[0] + frequencyData[1] + frequencyData[2];
    avgBass = avgBass * 0.9 + rawBass * 0.1; // Exponential moving average

    var threshold = 1.2 + (1 - sensitivity) * 2;
    var sustainThreshold = 1.1 + (1 - sensitivity) * 2;

    // Check for sustained bass
    if (rawBass > avgBass * sustainThreshold) {
        sustainedBassTimer += delta;
    } else {
        sustainedBassTimer = 0;
    }

    // Determine cooldown based on sustained bass
    var cooldown = 350 - (sustainedBassTimer / 1000) * 200;
    cooldown = max(80, cooldown); // Clamp to a minimum cooldown

    // Trigger a new pulse
    if (rawBass > avgBass * threshold && timeSinceLastPulse > cooldown) {
        var pulse = pulses[pulsePointer];
        pulse[START_TIME] = time(1);

        // Pick a random pixel for the epicenter
        var randomPixel = floor(random(pixelCount));
        pulse[X_COORD] = allX[randomPixel];
        pulse[Y_COORD] = allY[randomPixel];
        pulse[Z_COORD] = allZ[randomPixel];

        // Hue changes based on beat speed. Faster beats make larger hue shifts.
        var lastPulseHue = pulses[(pulsePointer + MAX_PULSES - 1) % MAX_PULSES][HUE];
        // The clamp function is not standard JS, but is available in the target environment
        var hueDelta = 0.1 + (1 - clamp(timeSinceLastPulse / 1000, 0, 1)) * 0.3;
        pulse[HUE] = (lastPulseHue + hueDelta) % 1;


        pulsePointer = (pulsePointer + 1) % MAX_PULSES;
        timeSinceLastPulse = 0;
    }

    // --- Prune old pulses ---
    var currentTime = time(1);
    for (var i = 0; i < MAX_PULSES; i++) {
        if (pulses[i][START_TIME] == -1) continue;

        var age = currentTime - pulses[i][START_TIME];
        if (age < 0) age += 1; // time() wraps around
        if (age > 2.5 / (1 + speed * 3)) {
            pulses[i][START_TIME] = -1; // Deactivate the pulse

        }
    }
}

export function render3D(index, x, y, z) {
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            isMapInitialized = true;
        }
        return;
    }

    var v = 0;
    var h = 0;
    var s = 1;
    var currentTime = time(1);

    for (var i = 0; i < MAX_PULSES; i++) {
        if (pulses[i][START_TIME] == -1) continue;

        var age = currentTime - pulses[i][START_TIME];
        if (age < 0) age += 1; // time() wraps around

        var waveFront = age * (1 + speed * 4);
        var center = waveFront * 2.5;
        var thickness = 0.2;

        var dx = x - pulses[i][X_COORD], dy = y - pulses[i][Y_COORD], dz = z - pulses[i][Z_COORD];
        var distSq = dx*dx + dy*dy + dz*dz;

        var outerEdge = center + thickness;
        var innerEdge = center - thickness;

        if (innerEdge < 0) innerEdge = 0;

        var innerEdgeSq = innerEdge * innerEdge;
        var outerEdgeSq = outerEdge * outerEdge;

        if (distSq > innerEdgeSq && distSq < outerEdgeSq) {
            // We are in the ring. Calculate brightness without sqrt.
            var centerSq = center * center;
            var denominator = outerEdgeSq - centerSq;
            if (denominator > 0) {
                // This creates a V-shaped brightness profile based on squared distance.
                var waveValue = 1 - abs(distSq - centerSq) / denominator;
                waveValue = max(0, waveValue);


                var fade = 1 - age * (0.4 * (1 + speed * 3));
                var newV = waveValue * fade;
                if (newV > v) {
                    v = newV;
                    h = pulses[i][HUE];
                }

            }
        }
    }

    hsv(h, s, v*v);
}
