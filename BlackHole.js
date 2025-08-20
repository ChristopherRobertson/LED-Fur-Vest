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
 * Black Hole (DEBUGGING VERSION)
 *
 * This pattern renders a simple, stationary white circle to debug
 * the 3D coordinate mapping and rendering.
 */

// --- UI Controls ---
export var radius = 0.25;
export function sliderRadius(v) {
    radius = v; // Control radius from 0 to 1 in normalized units
}

// --- State Variables ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);
var centerX, centerY, centerZ;

export function beforeRender(delta) {
  // All logic is in render3D for this simple pattern.
}

export function render3D(index, x, y, z) {
    // --- One-time Map Capture & Epicenter Calculation ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            // --- Center Epicenter (between cols 27 & 28) ---
            var p1_idx = columnStartIndices[27] + floor(columnLengths[27] / 2);
            var p2_idx = columnStartIndices[28] + floor(columnLengths[28] / 2);
            centerX = (allX[p1_idx] + allX[p2_idx]) / 2;
            centerY = (allY[p1_idx] + allY[p2_idx]) / 2;
            centerZ = (allZ[p1_idx] + allZ[p2_idx]) / 2;
            isMapInitialized = true;
        }
        return;
    }

    // --- Distance Calculation ---
    var dx = x - centerX;
    var dy = y - centerY;
    var dz = z - centerZ;
    var distance = hypot3(dx, dy, dz);

    // --- Rendering Logic ---
    if (distance < radius) {
        rgb(1, 1, 1); // Simple white circle
    } else {
        rgb(0, 0, 0); // Off
    }
}
