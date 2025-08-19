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
 * Black Hole (Finale - Moving)
 *
 * This pattern creates a moving black hole on the surface of the coat.
 * It features a swirling, multicolored event horizon with a gravitational
 * lensing effect, all set against a backdrop of twinkling stars.
 * The black hole moves along the surface from one random pixel to another.
 */

// --- UI Controls ---
var r1 = 0.1; // Radius of the black center
var r2 = 0.2; // Outer radius of the event horizon
var swirlSpeed = 0.2;
var wanderSpeed = 0.5; // Controls how fast it moves between points

// FIXED: Hardcoded star density. Change this value to adjust the number of stars.
var starDensity = 0.75;

export function sliderRadius1(v) {
    r1 = v * 0.5;
    if (r2 < r1) r2 = r1;
}
export function sliderRadius2(v) {
    var newR2 = v * 0.5;
    if (newR2 >= r1) r2 = newR2;
}
export function sliderSwirlSpeed(v) {
    swirlSpeed = 0.05 + v * 0.5;
}
export function sliderWanderSpeed(v) {
    wanderSpeed = 0.1 + v * 0.9;
}

// --- Animation State ---
var bhX, bhY, bhZ; // Black hole's current interpolated position
var PI2 = PI * 2;

// --- Movement State ---
var currentTheta, currentZ;
var targetTheta, targetZ;
var moveTimer = 9999;
var moveDuration = 5000;
var radius = 7.162; // Radius of the cylinder from Mapper.py

// --- Starfield State ---
var starHue = array(pixelCount);
var starPhase = array(pixelCount);
var isStarsInitialized = false;

// --- Map Initialization ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isMapInitialized) return;

    moveTimer += delta;

    while (moveTimer >= moveDuration) {
        moveTimer -= moveDuration;
        pickNewTarget();
        moveDuration = (2000 + random(4000)) / wanderSpeed;
    }

    var progress = moveTimer / moveDuration;
    if (moveDuration == 0) progress = 1;
    progress = progress * progress * (3 - 2 * progress);

    // Interpolate Z and Theta separately
    var dTheta = targetTheta - currentTheta;
    // If distance is > 1/2 circle, go the other way
    if (abs(dTheta) > PI) {
      dTheta = dTheta - sign(dTheta) * PI2;
    }

    var bhTheta = currentTheta + dTheta * progress;
    var bhZ = currentZ + (targetZ - currentZ) * progress;

    // Convert back to cartesian for rendering
    bhX = radius * cos(bhTheta);
    bhY = radius * sin(bhTheta);
}

export function render3D(index, x, y, z) {
    // --- One-time Map & Starfield Capture ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            isMapInitialized = true;
            // Initialize to a random point
            var targetIndex = floor(random(pixelCount));
            targetTheta = atan2(allY[targetIndex], allX[targetIndex]);
            targetZ = allZ[targetIndex];
            pickNewTarget(); // Set the first real target
            bhX = radius * cos(currentTheta);
            bhY = radius * sin(currentTheta);
            bhZ = currentZ;
        }
    }

    if (!isStarsInitialized) {
        if (random(1) < starDensity) {
            var r = random(1);
            if (r < 0.4) starHue[index] = 0.66; else if (r < 0.7) starHue[index] = 0.83; else if (r < 0.9) starHue[index] = 0; else starHue[index] = -1;
            starPhase[index] = random(1);
        } else {
            starHue[index] = -2;
        }
        if (index == pixelCount - 1) isStarsInitialized = true;
    }

    if (!isMapInitialized) return;

    // --- Distance Calculation ---
    var dx = x - bhX;
    var dy = y - bhY;
    var dz = z - bhZ;
    var distance = hypot3(dx, dy, dz);

    // --- Rendering Logic ---
    if (distance < r1) {
        rgb(0, 0, 0); // Singularity
    } else if (distance <= r2) {
        // Event Horizon
        var normalizedDist = (distance - r1) / (r2 - r1);
        var angle = atan2(dy, dx);
        var swirl = time(swirlSpeed * 0.1) * PI2;
        var lensing = 1 - normalizedDist;
        swirl -= lensing * lensing * 5;

        var noise = perlin(angle * 2, swirl, distance * 5, 1);
        noise = noise * noise;

        var brightness = (1 - normalizedDist) * noise;
        var hue = 0.6 + noise * 0.5 - (lensing * 0.2);

        hsv(hue, 1, brightness * 2.0);
    } else {
        // Starfield
        if (starHue[index] > -2) {
            var twinkle = wave(time(0.1) + starPhase[index]);
            var h = starHue[index];
            var s = 1, v = twinkle * twinkle * 0.5;
            if (h == -1) { s = 0; v *= 0.7; }
            hsv(h, s, v);
        } else {
            rgb(0, 0, 0); // Empty space
        }
    }
}

// =================================================================
//                  HELPER FUNCTIONS
// =================================================================

function pickNewTarget() {
    // The old target becomes the new starting point
    currentTheta = targetTheta;
    currentZ = targetZ;

    // Pick a new random pixel on the coat as the next destination
    var targetIndex = floor(random(pixelCount));
    targetTheta = atan2(allY[targetIndex], allX[targetIndex]);
    targetZ = allZ[targetIndex];
}
