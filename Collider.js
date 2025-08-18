
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
 * Collider Explosion
 *
 * This pattern combines two animations:
 * 1. Spirals: Two spiraling particles with fading tails move towards each other.
 * 2. Explosion: When the particles collide or meet at the back, a fiery 3D
 * explosion emanates from the point of impact.
 * The entire sequence then resets and starts over.
 */

var numBodyColumns = bodyColumns.length;

// --- Fixed Animation Parameters ---
var spiralPitch = 5.25;
var spiralSpeed = 0.1;
var explosionDuration = 1.5;
var explosionThickness = 0.1;
var tailDecayRate = 0.85; // UPDATED: Controls how fast the spiral tails fade.

// --- Animation State Machine ---
var STATE_SPIRALING = 0;
var STATE_EXPLODING = 1;
var currentState = STATE_SPIRALING;

// --- Timers and State Variables ---
var spiralAccumulator = 0;
var explosionAccumulator = 0;
var pixelsState = array(pixelCount); // For spiral trails

// --- Explosion-specific variables ---
var epicenterIndex = 570; // Default epicenter, will be updated on collision
var explosionRadius = 0;
var isMapInitialized = false;
var allX = array(pixelCount);
var allY = array(pixelCount);
var allZ = array(pixelCount);
var cx, cy, cz; // Epicenter coordinates

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    // One-time setup to get epicenter coords after map is initialized
    if (isMapInitialized && (cx == null)) {
        cx = allX[epicenterIndex];
        cy = allY[epicenterIndex];
        cz = allZ[epicenterIndex];
    }

    if (currentState == STATE_SPIRALING) {
        runSpirals(delta);
    } else if (currentState == STATE_EXPLODING) {
        runExplosion(delta);
    }
}

export function render3D(index, x, y, z) {
    // One-time capture of the 3D map on the first render pass.
    if (!isMapInitialized) {
        allX[index] = x;
        allY[index] = y;
        allZ[index] = z;
        if (index == pixelCount - 1) isMapInitialized = true;
        return; // Don't render anything until the map is fully captured.
    }

    if (currentState == STATE_SPIRALING) {
        renderSpirals(index);
    } else if (currentState == STATE_EXPLODING) {
        renderExplosion(index, x, y, z);
    }
}


// =================================================================
//                  HELPER FUNCTIONS FOR EACH STATE
// =================================================================

/**
 * Runs the logic for the SPIRALING state.
 */
function runSpirals(delta) {
    // UPDATED: Decay all existing tail pixels first.
    for (var i = 0; i < pixelCount; i++) {
        pixelsState[i] *= tailDecayRate;
        if (abs(pixelsState[i]) < 0.01) pixelsState[i] = 0;
    }

    var totalAnimationSteps = 60 * spiralPitch;
    var basePeriod = 0.2 * spiralPitch;
    var finalPeriod = basePeriod / spiralSpeed;

    spiralAccumulator += delta / 1000;

    if (spiralAccumulator >= finalPeriod) {
        spiralAccumulator = 0;
    }

    var progress = spiralAccumulator / finalPeriod;
    var step = floor(progress * totalAnimationSteps);
    var horizontalStep = step % numBodyColumns;
    var masterVerticalStep = floor(step / spiralPitch);

    // --- Spiral 1 ---
    var columnNumber1 = bodyColumns[horizontalStep];
    var startIndex1 = columnStartIndices[columnNumber1];
    var len1 = columnLengths[columnNumber1];
    var litPixel1 = -1;
    if (masterVerticalStep < len1) {
        litPixel1 = isReversed[columnNumber1] ? (startIndex1 + len1 - 1) - masterVerticalStep : startIndex1 + masterVerticalStep;
    }

    // --- Spiral 2 ---
    var columnNumber2 = bodyColumnsReversed[horizontalStep];
    var startIndex2 = columnStartIndices[columnNumber2];
    var len2 = columnLengths[columnNumber2];
    var blueVerticalOffset = (60 - 1) - masterVerticalStep;
    var litPixel2 = -1;
    if (blueVerticalOffset >= 0 && blueVerticalOffset < len2) {
        litPixel2 = isReversed[columnNumber2] ? (startIndex2 + len2 - 1) - blueVerticalOffset : startIndex2 + blueVerticalOffset;
    }

    // UPDATED: Set lead pixel to full brightness. Positive for spiral 1, negative for 2.
    if (litPixel1 != -1) pixelsState[litPixel1] = 1;
    if (litPixel2 != -1) pixelsState[litPixel2] = -1;

    // --- Collision Detection ---
    var collision = false;
    if (litPixel1 != -1 && litPixel1 == litPixel2) {
        epicenterIndex = litPixel1;
        collision = true;
    } else if (((columnNumber1 == 12 && columnNumber2 == 13) || (columnNumber1 == 13 && columnNumber2 == 12)) && masterVerticalStep >= 29 && masterVerticalStep <= 30) {
        epicenterIndex = 570;
        collision = true;
    }

    if (collision) {
        currentState = STATE_EXPLODING;
        explosionAccumulator = 0;
        cx = allX[epicenterIndex];
        cy = allY[epicenterIndex];
        cz = allZ[epicenterIndex];
    }
}

/**
 * Renders the pixels for the SPIRALING state.
 */
function renderSpirals(index) {
    // UPDATED: Logic to render fading tails based on pixelState value.
    var state = pixelsState[index];
    if (state > 0) { // Spiral 1's tail (positive values)
        hsv(0.8, 1, state);
    } else if (state < 0) { // Spiral 2's tail (negative values)
        hsv(0.75, 1, -state);
    } else {
        hsv(0, 0, 0); // Off
    }
}


/**
 * Runs the logic for the EXPLODING state.
 */
function runExplosion(delta) {
    explosionAccumulator += delta / 1000;
    explosionRadius = explosionAccumulator / explosionDuration;

    if (explosionAccumulator >= explosionDuration) {
        currentState = STATE_SPIRALING;
        spiralAccumulator = 0;
        // FIXED: Clear the spiral trails as soon as the explosion ends to prevent a flash.
        for (var i = 0; i < pixelCount; i++) pixelsState[i] = 0;
    }
}

/**
 * Renders the pixels for the EXPLODING state.
 */
function renderExplosion(index, x, y, z) {
    var dx = x - cx;
    var dy = y - cy;
    var dz = z - cz;
    var distance = sqrt(dx * dx + dy * dy + dz * dz);

    var wavePosition = abs(distance - explosionRadius);

    if (wavePosition < explosionThickness) {
        var relativePos = wavePosition / explosionThickness;
        var h = 0.16 - (relativePos * 0.2);
        var s = 1;
        var v = 1 - relativePos;
        v *= (1 - explosionRadius);
        hsv(h, s, v * v);
    } else {
        rgb(0, 0, 0);
    }
}