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

/**
 * Hurricane Columns
 *
 * Creates a hurricane/vortex effect by making columns of light spiral around
 * the center back of the vest. Each column lights up in sequence, creating
 * rotating "arms" that work with the vest's natural column structure.
 */

// --- Hurricane Parameters ---
var centerCol = 27.5; // Center between columns 27 and 28 (back center)
var centerPos = 0.5;  // Middle height
var rotationSpeed = 2.0; // How fast the hurricane rotates
var numArms = 3; // Number of spiral arms
var colorCycleSpeed = 0.2; // How fast colors transition
var maxRadius = 18; // Maximum distance from center to affect (increased from 12)

// --- Animation State ---
var time = 0;

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    time += delta / 1000;
}

export function render(index) {
    var col = pixelToColumn[index];
    var pos = pixelToColumnPos[index];

    if (!col) {
        rgb(0, 0, 0);
        return;
    }

    // Calculate distance from hurricane center (accounting for wrap-around)
    var dx = col - centerCol;

    // Handle wrap-around: if we're more than half the vest away, 
    // calculate distance the other way around
    if (abs(dx) > numColumns / 2) {
        if (dx > 0) {
            dx = dx - numColumns;
        } else {
            dx = dx + numColumns;
        }
    }

    var dy = (pos - centerPos) * 20; // Scale vertical distance to match horizontal
    var distance = sqrt(dx * dx + dy * dy);

    // Only affect columns within hurricane radius
    if (distance > maxRadius) {
        rgb(0, 0, 0);
        return;
    }

    // Calculate angle from center (which column this is relative to center)
    var columnAngle = atan2(dy, dx);

    // Create rotating spiral arms
    var rotationPhase = -time * rotationSpeed; // Negative to reverse direction
    var spiralPhase = columnAngle + (distance * 0.3); // Spiral effect based on distance

    // Check if this column should be lit based on spiral arms
    var armPhase = (spiralPhase + rotationPhase) * numArms;
    var armIntensity = (sin(armPhase) + 1) / 2; // 0 to 1

    // Create sharp arm edges
    if (armIntensity < 0.7) {
        rgb(0, 0, 0);
        return;
    }

    // Distance-based intensity and height effect
    var distanceIntensity = 1 - (distance / maxRadius);
    distanceIntensity = pow(distanceIntensity, 0.5); // Smoother falloff

    // Height effect - brighter in center vertically
    var heightIntensity = 1 - abs(pos - centerPos) * 2;
    heightIntensity = max(0, heightIntensity);

    var totalIntensity = distanceIntensity * heightIntensity;

    if (totalIntensity < 0.1) {
        rgb(0, 0, 0);
        return;
    }

    // Color system: Dramatic hurricane colors
    // Center: pure white (eye of the storm)
    // Middle: deep blues and purples  
    // Outer edges: dark storm colors (deep blue/black)

    var distanceRatio = distance / maxRadius;

    var h, s, v;

    if (distanceRatio < 0.15) {
        // Eye of the storm: warm white (often renders better than pure white on RGB LEDs)
        var warmWhite = totalIntensity * 1.2;
        rgb(warmWhite, warmWhite * 0.9, warmWhite * 0.7); // Slightly warm/yellow tinted
        return;
    } else if (distanceRatio < 0.3) {
        // Transition from white to electric blue
        h = 0.55; // Electric blue
        s = (distanceRatio - 0.15) * 4; // Gradually add saturation from the white center
        v = totalIntensity * 1.1; // Still bright
    } else if (distanceRatio < 0.6) {
        // Inner storm: deep blues and purples
        h = 0.65 - (distanceRatio * 0.1); // Blue to purple gradient
        s = 0.8 + (distanceRatio * 0.2); // High saturation
        v = totalIntensity;
    } else {
        // Outer storm: dark, ominous storm colors
        h = 0.75; // Deep purple/magenta
        s = 1.0; // Full saturation
        v = totalIntensity * 0.7; // Dimmer outer edges
    }

    hsv(h, s, v);
}