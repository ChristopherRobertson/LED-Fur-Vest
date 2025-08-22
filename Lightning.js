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
 * Sound-Responsive Lightning/Plasma Arcs
 *
 * Creates electric lightning arcs that respond to audio input.
 * Bass triggers large arcs, mids create branching, treble adds sparkle.
 * Arcs jump between random points with realistic electric blue colors.
 */

// --- Audio Input ---
export var frequencyData = array(32);

// --- Lightning Parameters ---
var maxArcs = 6; // Maximum number of simultaneous arcs
var arcDecayRate = 0.92; // How fast arcs fade
var sparkleThreshold = 0.3; // Treble level needed for sparkles
var branchProbability = 0.15; // Chance of arc branching

// --- Lightning State ---
var arcPixels = array(pixelCount); // Pre-calculated arc intensities for each pixel
var backgroundGlow = array(pixelCount); // Persistent glow effect
var time = 0;
var activeArcs = array(maxArcs * 5); // startCol, startPos, endCol, endPos, intensity

// Audio analysis
var bassEnergy = 0;
var midEnergy = 0;
var trebleEnergy = 0;

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    time += delta / 1000;

    // Analyze audio frequencies
    bassEnergy = (frequencyData[0] + frequencyData[1] + frequencyData[2] + frequencyData[3]) / 4;
    midEnergy = (frequencyData[8] + frequencyData[12] + frequencyData[16] + frequencyData[20]) / 4;
    trebleEnergy = (frequencyData[24] + frequencyData[28] + frequencyData[31]) / 3;

    // Fallback: create arcs automatically if no audio
    if (bassEnergy + midEnergy + trebleEnergy < 0.01) {
        bassEnergy = (sin(time * 2) + 1) / 2 * 0.5;
    }

    // Clear previous arc calculations
    for (var i = 0; i < pixelCount; i++) {
        arcPixels[i] = 0;
        backgroundGlow[i] *= 0.95;
    }

    // Update existing arcs
    for (var arcIndex = 0; arcIndex < maxArcs; arcIndex++) {
        var baseIdx = arcIndex * 5;
        var intensity = activeArcs[baseIdx + 4];

        if (intensity > 0) {
            intensity *= arcDecayRate;
            activeArcs[baseIdx + 4] = intensity;

            if (intensity < 0.05) {
                activeArcs[baseIdx + 4] = 0;
            } else {
                // Pre-calculate this arc's pixels
                calculateArcPixels(activeArcs[baseIdx], activeArcs[baseIdx + 1],
                    activeArcs[baseIdx + 2], activeArcs[baseIdx + 3], intensity);
            }
        }
    }

    // Create new arcs
    if (bassEnergy > 0.1 && random(1) < 0.2) {
        createNewArc(max(bassEnergy, 0.5));
    }

    if (sin(time * 1.5) > 0.9) {
        createNewArc(0.8);
    }
}

export function render(index) {
    var col = pixelToColumn[index];

    if (!col) {
        rgb(0, 0, 0);
        return;
    }

    // Simple lookup - all heavy calculation done in beforeRender
    var intensity = max(arcPixels[index], backgroundGlow[index]);

    // Add treble sparkles
    if (trebleEnergy > 0.3 && random(1) < 0.005) {
        intensity += trebleEnergy * 0.5;
    }

    if (intensity > 0) {
        // Simple color mapping
        if (intensity > 0.7) {
            hsv(0.55, 0.2, min(1, intensity)); // White/pale blue
        } else if (intensity > 0.3) {
            hsv(0.58, 0.8, intensity); // Electric blue
        } else {
            hsv(0.65, 1.0, intensity); // Deep blue
        }
    } else {
        rgb(0, 0, 0);
    }
}

// =================================================================
//                        HELPER FUNCTIONS
// =================================================================

function createNewArc(energy) {
    // Find an empty arc slot
    for (var arcIndex = 0; arcIndex < maxArcs; arcIndex++) {
        var baseIdx = arcIndex * 5;
        if (activeArcs[baseIdx + 4] <= 0) {
            // Create new arc between random points
            var startCol = floor(random(numColumns)) + 1;
            var endCol = floor(random(numColumns)) + 1;
            var startPos = random(1);
            var endPos = random(1);

            // Prefer longer arcs for higher energy
            var distance = abs(endCol - startCol);
            if (distance < 8) {
                endCol = startCol + (random(1) > 0.5 ? 1 : -1) * floor(5 + random(10));
                if (endCol > numColumns) endCol = numColumns;
                if (endCol < 1) endCol = 1;
            }

            activeArcs[baseIdx] = startCol;
            activeArcs[baseIdx + 1] = startPos;
            activeArcs[baseIdx + 2] = endCol;
            activeArcs[baseIdx + 3] = endPos;
            activeArcs[baseIdx + 4] = energy * 1.2;
            break;
        }
    }
}

function calculateArcPixels(startCol, startPos, endCol, endPos, intensity) {
    // Simple straight line between start and end points
    var steps = abs(endCol - startCol) + abs(endPos - startPos) * 20;
    steps = max(1, floor(steps));

    for (var step = 0; step <= steps; step++) {
        var t = step / steps;
        var currentCol = floor(startCol + t * (endCol - startCol) + 0.5);
        var currentPos = startPos + t * (endPos - startPos);

        if (currentCol >= 1 && currentCol <= numColumns && currentPos >= 0 && currentPos <= 1) {
            // Light the main arc pixel
            lightArcPixel(currentCol, currentPos, intensity);

            // Light adjacent pixels to make the arc thicker
            lightArcPixel(currentCol, currentPos - 0.05, intensity * 0.7); // Above
            lightArcPixel(currentCol, currentPos + 0.05, intensity * 0.7); // Below
        }
    }
}

function lightArcPixel(col, pos, intensity) {
    if (col >= 1 && col <= numColumns && pos >= 0 && pos <= 1) {
        var len = columnLengths[col];
        var pixelIdx = floor(pos * (len - 1));

        if (pixelIdx >= 0 && pixelIdx < len) {
            var startIndex = columnStartIndices[col];
            var actualPixelIdx = isReversed[col] ?
                (startIndex + len - 1) - pixelIdx : startIndex + pixelIdx;

            if (actualPixelIdx >= 0 && actualPixelIdx < pixelCount) {
                arcPixels[actualPixelIdx] = max(arcPixels[actualPixelIdx], intensity);
                backgroundGlow[actualPixelIdx] = max(backgroundGlow[actualPixelIdx], intensity * 0.2);
            }
        }
    }
}