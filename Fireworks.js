
// === VEST GEOMETRY (36 columns, 1200 LEDs) ===
// 1-based indexing for compatibility with your original patterns
var columnLengths = [0,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25];
var numColumns = columnLengths.length - 1;

// Compute start indices (1-based)
var columnStartIndices = array(numColumns + 1);
var acc = 0;
columnStartIndices[0] = 0;
for (var col = 1; col <= numColumns; col++) {
  columnStartIndices[col] = acc;
  acc += columnLengths[col];
}

// Serpentine wiring: odd columns bottom->top, even columns top->bottom
var isReversed = array(numColumns + 1);
for (var col = 1; col <= numColumns; col++) {
  isReversed[col] = (col % 2 == 0);
}

// All columns are body columns on the vest
var bodyColumns = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36];
var bodyColumnsReversed = array(bodyColumns.length);
for (var i = 0; i < bodyColumns.length; i++) {
  bodyColumnsReversed[i] = bodyColumns[bodyColumns.length - 1 - i];
}

// pixelCount comes from Pixelblaze; do not override it here.

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
    var rocketHead = floor(rocketProgress);

    // Check if this pixel is in the launch column
    if (index >= launchColumnStart && index < launchColumnStart + launchColumnLength) {
        var pixelOffset = index - launchColumnStart;
        if (launchColumnReversed) {
            pixelOffset = (launchColumnLength - 1) - pixelOffset;
        }

        // Light up just the "head" of the rocket
        if (pixelOffset == rocketHead) {
            hsv(burstHue, 0.5, 1); // Use the upcoming burst's color, but desaturated
        } else {
            hsv(0, 0, 0);
        }
    } else {
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