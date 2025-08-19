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
 * Fireworks (Mark IV)
 *
 * This pattern simulates a firework display. A rocket launches up a
 * random column, bursts at a random height, and creates a thick,
 * expanding plume of multicolored sparks that fades out as it grows.
 */

// --- Fixed Animation Parameters ---
var launchSpeed = 50;  // Speed of the rocket ascent (pixels per second)
var speed = 0.5;      // How fast the burst expands
var burstPeriod = 3000; // How long the explosion lasts
var idlePeriod = 1000;  // Time between fireworks in ms


// --- Animation State Machine ---
var STATE_IDLE = 0;
var STATE_LAUNCHING = 1;
var STATE_EXPLODING = 2;
var currentState = STATE_IDLE;
var timer = 9999;

// --- Firework State Variables ---
var burstHue = 0;
var cx, cy, cz; // Epicenter coordinates
var launchColumn, launchColumnStart, launchColumnLength, launchColumnReversed;
var burstHeight, rocketProgress;

// --- Map Initialization ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    timer += delta;

    if (currentState == STATE_IDLE) {
        if (timer > idlePeriod) {
            startLaunch();
        }
    } else if (currentState == STATE_LAUNCHING) {
        rocketProgress += (delta / 1000) * launchSpeed; // Move rocket up
        if (rocketProgress >= burstHeight) {
            startExplosion(); // Transition to explosion
        }
    } else if (currentState == STATE_EXPLODING) {
        if (timer > burstPeriod) {
            currentState = STATE_IDLE; // End explosion, go to idle
            timer = 0;
        }
    }
}

export function render3D(index, x, y, z) {
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) isMapInitialized = true;
        return;
    }

    if (currentState == STATE_LAUNCHING) {
        renderLaunch(index);
    } else if (currentState == STATE_EXPLODING) {
        renderExplosion(index, x, y, z);
    } else {
        hsv(0, 0, 0); // Off during idle
    }
}

// =================================================================
//                  HELPER FUNCTIONS
// =================================================================

function startLaunch() {
    timer = 0;
    rocketProgress = 0;

    // 1. Pick a random non-sleeve column
    var randomBodyColumnIndex = floor(random(bodyColumns.length));
    var columnNum = bodyColumns[randomBodyColumnIndex];

    launchColumn = columnNum;
    launchColumnStart = columnStartIndices[columnNum];
    launchColumnLength = columnLengths[columnNum];
    launchColumnReversed = isReversed[columnNum];

    // 2. Pick a random height for the burst (20% to 90% of column length)
    burstHeight = launchColumnLength * (0.2 + random(0.7));

    // 3. Set a new random color for the upcoming burst
    burstHue = random(1);

    currentState = STATE_LAUNCHING;
}

function startExplosion() {
    // Find the exact pixel index for the burst
    var burstPixelOffset = floor(burstHeight);
    if (launchColumnReversed) {
        burstPixelOffset = (launchColumnLength - 1) - burstPixelOffset;
    }
    var epicenterIndex = launchColumnStart + burstPixelOffset;

    // Set the 3D coordinates for the explosion's center
    cx = allX[epicenterIndex];
    cy = allY[epicenterIndex];
    cz = allZ[epicenterIndex];

    timer = 0; // Reset timer for the explosion duration
    currentState = STATE_EXPLODING;
}

function renderLaunch(index) {
    var rocketHeadPos = floor(rocketProgress); // This is height from bottom (0-indexed)
    var rocketPixelIndex;

    if (launchColumnReversed) {
        // For a reversed column, the "bottom" pixel has the highest index.
        // We start at the bottom and move to lower indices as the rocket rises.
        var bottomPixelIndex = launchColumnStart + launchColumnLength - 1;
        rocketPixelIndex = bottomPixelIndex - rocketHeadPos;
    } else {
        // For a normal column, the "bottom" pixel has the lowest index.
        // We start at the bottom and move to higher indices.
        rocketPixelIndex = launchColumnStart + rocketHeadPos;
    }

    // Light up only the single pixel for the rocket's head.
    if (index == rocketPixelIndex) {
        hsv(burstHue, 0.5, 1);
    } else {
        // Turn all other pixels off.
        hsv(0, 0, 0);
    }
}

function renderExplosion(index, x, y, z) {
    var progress = timer / burstPeriod;
    var plumeRadius = progress * speed;

    var dx = x - cx;
    var dy = y - cy;
    var dz = z - cz;
    var distance = sqrt(dx * dx + dy * dy + dz * dz);

    var brightness = 0;

    if (distance < plumeRadius) {
        var brightnessFromCenter = 1 - (distance / plumeRadius);
        var overallFade = 1 - progress;
        brightness = brightnessFromCenter * overallFade;
    }

    hsv(burstHue, 1, brightness * brightness);
}
