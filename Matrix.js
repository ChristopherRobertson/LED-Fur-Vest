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
 * Matrix
 *
 * This pattern emulates the "digital rain" effect from The Matrix.
 * Green streams of characters with bright leading edges fall down each
 * column of the coat at random speeds and intervals.
 */

// --- UI Controls ---
var speed = 0.5;
var tailLength = 0.5;

export function sliderSpeed(v) {
    // Speed slider controls the base speed of the drops
    speed = 0.1 + v * v * 2;
}
export function sliderTailLength(v) {
    // Tail Length slider controls the max length of the trails
    tailLength = 1 + v * 30;
}


// --- Animation State ---
var dropPosition = array(numColumns + 1);
var dropSpeed = array(numColumns + 1);
var dropLength = array(numColumns + 1);
var isInitialized = false;

// --- Initialization ---
// This runs only once, before the first frame is rendered.
function initializeDrops() {
    // Initialize each column's drop to a random state
    for (var col = 1; col <= numColumns; col++) {
        resetDrop(col);
        // Start them at random positions so they don't all start at once
        dropPosition[col] = random(columnLengths[col] * 2);
    }
    isInitialized = true;
}

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isInitialized) initializeDrops();

    // Update the position of each drop
    for (var col = 1; col <= numColumns; col++) {
        dropPosition[col] += delta / 1000 * dropSpeed[col];

        // If a drop has fallen off the bottom, reset it
        if (dropPosition[col] > columnLengths[col] + dropLength[col]) {
            resetDrop(col);
        }
    }
}

export function render(index) {
    var col = pixelToColumn[index];
    if (!col) { // If a pixel isn't mapped to a column, turn it off
        rgb(0, 0, 0);
        return;
    }

    var start = columnStartIndices[col];
    var len = columnLengths[col];

    // FIXED: Calculate this pixel's position from the TOP of its column
    // to make the rain fall downwards.
    var pixelPosInColumn = index - start;
    if (!isReversed[col]) { // If a column is NOT reversed, it's wired bottom-to-top.
        pixelPosInColumn = (len - 1) - pixelPosInColumn; // We need to flip it.
    }
    // If a column IS reversed, its wiring is already top-to-bottom, which is correct.

    // Calculate distance from this pixel to the head of its column's drop
    var dist = dropPosition[col] - pixelPosInColumn;

    var h = 0.333; // Matrix Green
    var s = 1;
    var v = 0;

    // Is this pixel part of the drop's trail?
    if (dist >= 0 && dist < dropLength[col]) {
        if (dist < 1) {
            // The leading pixel is bright white
            s = 0;
            v = 1;
        } else {
            // The tail fades out
            v = 1 - (dist / dropLength[col]);
            v = v * v; // Square for a steeper fade-off
        }
    } else {
        // Dimly light other pixels for background effect
        v = 0.05;
    }

    hsv(h, s, v);
}

// =================================================================
//                  HELPER FUNCTIONS
// =================================================================

function resetDrop(col) {
    // Give the drop a new random speed and length
    dropSpeed[col] = (5 + random(20)) * speed;
    dropLength[col] = 2 + random(tailLength);

    // Reset its position to the top
    // A negative start position creates a random delay before it appears on screen
    dropPosition[col] = -random(200);
}
