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
 * 3D Swirl
 *
 * This pattern creates a 3D swirling effect around the wearer.
 * The speed of the swirl increases towards the bottom of the coat.
 */

// --- UI Controls ---
export var speed = 0.5;
export var hue = 0;

export function sliderSpeed(v) { speed = 0.1 + v * 2; }
export function sliderHue(v) { hue = v; }


// --- Animation State ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);
var minZ = 999, maxZ = -999;


export function beforeRender(delta) {
  // This pattern is purely generative based on time and coordinates,
  // so no state updates are needed in beforeRender.
}

export function render3D(index, x, y, z) {
    // --- One-time Map Analysis ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        minZ = min(minZ, z);
        maxZ = max(maxZ, z);
        if (index == pixelCount - 1) isMapInitialized = true;
        return;
    }

    // --- Swirl Logic ---
    // Calculate the angle of the pixel around the center axis
    var angle = atan2(y, x);

    // Normalize Z position from 0 (bottom) to 1 (top)
    var zNorm = (z - minZ) / (maxZ - minZ);

    // The "twist" of the swirl. More twist at the bottom.
    var twist = (1 - zNorm) * 5;

    // The base speed of the swirl over time
    var time_component = time(0.1 * speed);

    // The speed of the swirl increases down the coat (lower zNorm)
    var speed_component = (1 - zNorm) * time(0.05 * speed) * 3;

    // Combine angle and time components to get the final value
    var v = angle / (PI * 2) + time_component + speed_component;

    // Add the twist
    v += zNorm * twist;

    // Use triangle wave to create pulsing bands
    hsv(hue, 1, triangle(v));
}
