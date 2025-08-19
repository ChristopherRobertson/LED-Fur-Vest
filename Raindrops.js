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
        // Calculate normalized position (0.0 at top, 1.0 at bottom)
        var pos = (len > 1) ? (i / (len - 1)) : 0;
        pixelToColumnPos[pixelIndex] = isReversed[col] ? (1 - pos) : pos;
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
 * Raindrops
 *
 * This pattern simulates raindrops falling on a surface of water,
 * creating expanding circular ripples.
 */

// --- UI Controls ---
export var density = 0.3;
export var rippleSpeed = 0.5;
export var hue = 0.6;

export function sliderDensity(v) { density = v; }
export function sliderRippleSpeed(v) { rippleSpeed = v; }
export function sliderHue(v) { hue = v; }


// --- Animation State ---
var MAX_RIPPLES = 15;
var ripples = []; // Stores active ripples {x, y, birthTime}

// --- Map Initialization ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);


export function beforeRender(delta) {
    if (!isMapInitialized) return;

    // --- 1. Create new ripples ---
    if (ripples.length < MAX_RIPPLES && random(1) < density * delta / 1000 * 5) {
        // Pick a random pixel on the map for the ripple's origin
        var originIndex = floor(random(pixelCount));
        var newRipple = {
            x: allX[originIndex],
            y: allY[originIndex],
            birthTime: time(1) // Use a rolling timer for birth time
        };
        ripples.push(newRipple);
    }
    
    // --- 2. Prune old ripples ---
    // Ripples fade out over time, remove them when they are no longer visible.
    var currentTime = time(1);
    for (var i = ripples.length - 1; i >= 0; i--) {
        var age = currentTime - ripples[i].birthTime;
        if (age < 0) age += 1; // Wrap around timer

        // Ripples last for about 2 seconds at default speed
        if (age > 2 / (1 + rippleSpeed * 5)) {
            ripples.splice(i, 1);
        }
    }
}

export function render3D(index, x, y, z) {
    // --- One-time Map Capture ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) isMapInitialized = true;
        return;
    }

    var v = 0;
    var currentTime = time(1);

    // --- Render ripples ---
    for (var i = 0; i < ripples.length; i++) {
        var ripple = ripples[i];

        var dx = x - ripple.x;
        var dy = y - ripple.y;
        var dist = sqrt(dx*dx + dy*dy); // 2D distance on the unrolled map
        var age = currentTime - ripple.birthTime;
        if (age < 0) age += 1;

        var waveFront = age * (1 + rippleSpeed * 5);
        var distFromWave = abs(dist - waveFront * 0.2);

        // If the pixel is near the expanding wave front
        if (distFromWave < 0.05) {
            var waveValue = 1 - (distFromWave / 0.05);
            var fade = 1 - age * (0.5 * (1 + rippleSpeed * 5));
            v = max(v, waveValue * fade);
        }
    }
    hsv(hue, 1 - v, v * v); // Use saturation to make it look like water
}
