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
var columnLengths = [0, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25];


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
// Radii are in normalized units, where the whole coat is ~0.4 units wide
var r1 = 0.1; // Radius of the black center
var r2 = 0.2; // Outer radius of the event horizon
var swirlSpeed = 0.2;
var wanderSpeed = 0.5; // Controls how fast it moves between points
var starDensity = 0.75;

export function sliderRadius1(v) {
    r1 = v * 0.5; // Slider range 0 to 0.5
    if (r2 < r1) r2 = r1;
}
export function sliderRadius2(v) {
    var newR2 = v; // Slider range 0 to 1.0
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
var currentTheta, currentZ, currentRadius;
var targetTheta, targetZ, targetRadius;
var moveTimer = 9999;
var moveDuration = 5000;


// --- State Variables ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);

// Helper for sign() which is not built-in
function sign(n) {
    return n > 0 ? 1 : (n < 0 ? -1 : 0);

}

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
    progress = progress * progress * (3 - 2 * progress); // Smoothstep

    // Interpolate Z, Theta, and Radius separately
    var dTheta = targetTheta - currentTheta;
    if (abs(dTheta) > PI) {
        dTheta = dTheta - sign(dTheta) * PI2;
    }

    var bhTheta = currentTheta + dTheta * progress;
    var bhZ = currentZ + (targetZ - currentZ) * progress;
    var bhRadius = currentRadius + (targetRadius - currentRadius) * progress;

    // Convert back to cartesian for rendering
    bhX = bhRadius * cos(bhTheta);
    bhY = bhRadius * sin(bhTheta);

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
            pickNewTarget();
            pickNewTarget(); // Set the first real target
            bhZ = currentZ;
            bhX = currentRadius * cos(currentTheta);
            bhY = currentRadius * sin(currentTheta);
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
        return;
    }


    // --- Distance Calculation ---
    var dx = x - centerX;
    var dy = y - centerY;
    var dz = z - centerZ;
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
        var hue = 0.1 + noise * 0.1 - (lensing * 0.1);

        hsv(hue, 1, brightness * 2.0);

    } else {
        rgb(0, 0, 0); // Off
    }
}

function pickNewTarget() {
    // The old target becomes the new starting point
    currentTheta = targetTheta;
    currentZ = targetZ;
    currentRadius = targetRadius;

    // Pick a new random pixel on the coat as the next destination
    var targetIndex = floor(random(pixelCount));
    var tx = allX[targetIndex];
    var ty = allY[targetIndex];
    targetZ = allZ[targetIndex];
    targetTheta = atan2(ty, tx);
    targetRadius = hypot(tx, ty);
}

