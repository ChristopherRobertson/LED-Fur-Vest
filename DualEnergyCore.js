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
 * Dual Energy Core
 *
 * This pattern generates two "energy cores" on the front and back of the
 * coat that swell on a beat and wobble during sustained bass.
 */

// --- UI Controls ---
export var sensitivity = 0.6;
export var wobbleSpeed = 0.5;
export var hue = 0.66;

export function sliderSensitivity(v) { sensitivity = v; }
export function sliderWobbleSpeed(v) { wobbleSpeed = 0.2 + v * 2; }
export function sliderHue(v) { hue = v; }

// --- Sensor Board Data ---
export var frequencyData = array(32);

// --- State Machine ---
var IDLE = 0, EXPANDING = 1, WOBBLING = 2, CONTRACTING = 3;
var state = IDLE;
var stateTimer = 0;
var coreRadius = 0;

// --- Beat Detection ---
var avgBass = 0;
var sustainedBassTimer = 0;

// --- 3D Map & Epicenter Storage ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);
var frontX, frontY, frontZ, backX, backY, backZ;


export function beforeRender(delta) {
    if (!isMapInitialized) return;

    stateTimer += delta;

    // --- Beat & Sustain Detection ---
    var rawBass = frequencyData[0] + frequencyData[1] + frequencyData[2];
    avgBass = avgBass * 0.9 + rawBass * 0.1;
    var threshold = 1.2 + (1 - sensitivity) * 3;
    var sustainThreshold = 1.1 + (1 - sensitivity) * 2;
    var isSustained = (rawBass > avgBass * sustainThreshold);
    var isBeat = (rawBass > avgBass * threshold);

    if (isSustained) sustainedBassTimer += delta; else sustainedBassTimer = 0;

    // --- State Machine Logic ---
    if (state == IDLE && isBeat) {
        state = EXPANDING;
        stateTimer = 0;
    } else if (state == EXPANDING) {
        coreRadius = stateTimer / 100; // Expand over 100ms
        if (stateTimer > 100) {
            state = WOBBLING;
            stateTimer = 0;
        }
    } else if (state == WOBBLING) {
        var wobble = 1 + sin(time(wobbleSpeed * 0.2)) * 0.2;
        coreRadius = wobble;
        if (!isSustained) {
            state = CONTRACTING;
            stateTimer = 0;
        }
    } else if (state == CONTRACTING) {
        coreRadius = 1 - stateTimer / 500; // Contract over 500ms
        if (coreRadius <= 0) {
            state = IDLE;
            coreRadius = 0;
        }
    }
}

export function render3D(index, x, y, z) {
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            // --- Front Epicenter (between cols 9 & 10) ---
            var p1_idx = columnStartIndices[9] + floor(columnLengths[9] / 2);
            var p2_idx = columnStartIndices[10] + floor(columnLengths[10] / 2);
            frontX = (allX[p1_idx] + allX[p2_idx]) / 2;
            frontY = (allY[p1_idx] + allY[p2_idx]) / 2;
            frontZ = (allZ[p1_idx] + allZ[p2_idx]) / 2;

            // --- Back Epicenter (between cols 27 & 28) ---
            var p3_idx = columnStartIndices[27] + floor(columnLengths[27] / 2);
            var p4_idx = columnStartIndices[28] + floor(columnLengths[28] / 2);
            backX = (allX[p3_idx] + allX[p4_idx]) / 2;
            backY = (allY[p3_idx] + allY[p4_idx]) / 2;
            backZ = (allZ[p3_idx] + allZ[p4_idx]) / 2;

            isMapInitialized = true;
        }
        return;
    }

    var v = 0;
    if (coreRadius > 0) {
        var dfSq = (x-frontX)*(x-frontX) + (y-frontY)*(y-frontY) + (z-frontZ)*(z-frontZ);
        var dbSq = (x-backX)*(x-backX) + (y-backY)*(y-backY) + (z-backZ)*(z-backZ);
        var minDist = sqrt(min(dfSq, dbSq));

        var maxRadius = coreRadius * 4; // Arbitrary scaling for visual size

        if (minDist < maxRadius) {
            v = 1 - (minDist / maxRadius);
            v = v * v;
        }
    }

    hsv(hue, 1, v);
}
