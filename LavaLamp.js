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
 * Lava Lamp
 *
 * Creates slow-moving organic blobs of warm colors that flow up and down
 * the vest like a classic lava lamp. Multiple layers of different colored
 * "wax" blobs move at different speeds, creating depth and organic movement.
 */

// --- Lava Parameters ---
var blobSpeed1 = 0.15; // Speed of first blob layer
var blobSpeed2 = 0.08; // Speed of second blob layer  
var blobSpeed3 = 0.12; // Speed of third blob layer
var blobSize = 8; // Base size of blobs
var temperatureShift = 0.3; // How much colors shift over time

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

    // Create multiple layers of flowing blobs using sine waves
    var x = col / numColumns; // 0 to 1 across vest
    var y = pos; // 0 to 1 up column

    // Layer 1: Primary orange/red blobs
    var blob1Y = sin(time * blobSpeed1 + x * 3.14) * 0.3 + 0.5;
    var blob1Distance = sqrt(pow(x - 0.3, 2) + pow(y - blob1Y, 2) * 4);
    var blob1Intensity = max(0, 1 - blob1Distance / (blobSize / numColumns));

    // Layer 2: Secondary yellow blobs
    var blob2Y = sin(time * blobSpeed2 + x * 6.28 + 2) * 0.4 + 0.6;
    var blob2Distance = sqrt(pow(x - 0.7, 2) + pow(y - blob2Y, 2) * 4);
    var blob2Intensity = max(0, 1 - blob2Distance / (blobSize / numColumns));

    // Layer 3: Tertiary red blobs
    var blob3Y = sin(time * blobSpeed3 + x * 4.71 + 4) * 0.35 + 0.4;
    var blob3Distance = sqrt(pow(x - 0.5, 2) + pow(y - blob3Y, 2) * 4);
    var blob3Intensity = max(0, 1 - blob3Distance / (blobSize / numColumns));

    // Additional smaller blobs for complexity
    var blob4Y = sin(time * blobSpeed1 * 0.7 + x * 2.5 + 1) * 0.25 + 0.3;
    var blob4Distance = sqrt(pow(x - 0.15, 2) + pow(y - blob4Y, 2) * 4);
    var blob4Intensity = max(0, 1 - blob4Distance / (blobSize * 0.6 / numColumns));

    var blob5Y = sin(time * blobSpeed2 * 1.3 + x * 5.5 + 3) * 0.3 + 0.7;
    var blob5Distance = sqrt(pow(x - 0.85, 2) + pow(y - blob5Y, 2) * 4);
    var blob5Intensity = max(0, 1 - blob5Distance / (blobSize * 0.8 / numColumns));

    // Combine all blob layers
    var totalIntensity = max(blob1Intensity, max(blob2Intensity, max(blob3Intensity, max(blob4Intensity, blob5Intensity))));

    // Add subtle background heat haze
    var backgroundHeat = (sin(y * 10 + time * 2) + 1) / 2 * 0.1;
    totalIntensity = max(totalIntensity, backgroundHeat);

    if (totalIntensity <= 0.05) {
        // Dark background like lava lamp base
        rgb(0.02, 0.01, 0.05); // Very dark purple
        return;
    }

    // Color based on dominant blob and temperature shift
    var h, s, v;
    var tempShift = sin(time * temperatureShift) * 0.1;

    if (blob1Intensity >= blob2Intensity && blob1Intensity >= blob3Intensity) {
        // Orange/red blob
        h = 0.08 + tempShift; // Orange with slight shift
        s = 0.9;
        v = totalIntensity;
    } else if (blob2Intensity >= blob3Intensity) {
        // Yellow blob  
        h = 0.15 + tempShift; // Yellow with slight shift
        s = 0.8;
        v = totalIntensity;
    } else {
        // Red blob
        h = 0.02 + tempShift; // Red with slight shift
        s = 1.0;
        v = totalIntensity;
    }

    // Add heat intensity effect - brighter areas get more white
    if (totalIntensity > 0.7) {
        s *= 0.6; // Less saturation = more white
        v = min(1, v * 1.2); // Brighter
    }

    hsv(h, s, v);
}