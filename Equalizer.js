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
var bodyColumns = [];
for (var i = 1; i <= numColumns; i++) {
    bodyColumns.push(i);
}

// A reversed copy of the body columns, useful for symmetrical patterns
var bodyColumnsReversed = array(bodyColumns.length);
for (var i = 0; i < bodyColumns.length; i++) {
  bodyColumnsReversed[i] = bodyColumns[bodyColumns.length - 1 - i];
}

/**
 * Equalizer (Sound-Reactive with Pre-Emphasis and AGC)
 *
 * This pattern uses a Sensor Expansion Board to create a sound-reactive
 * graphic equalizer. It features a rewritten, robust audio processing
 * pipeline with pre-emphasis EQ and Automatic Gain Control (AGC) to
 * create a balanced and dynamic full-range display.
 */

// --- UI Controls ---
var gain = 0.25;
var eqBalance = 0.75;

export function sliderGain(v) {
    // A powerful final amplifier for the visual effect.
    gain = pow(100, v);
}

export function sliderEqBalance(v) {
    // Controls the "tilt" of the EQ, balancing lows against highs.
    eqBalance = v * 2;
}

// --- Sensor Board Input ---
export var frequencyData = array(32);


// --- Animation State ---
var barValues = array(numColumns + 1);
var peakValues = array(numColumns + 1);
var peakFallSpeed = 0.25;

// --- AGC State ---
var maxLoudness = 0.1
// --- Pre-computation ---
var pixelToColumn = array(pixelCount);
var pixelToColumnPos = array(pixelCount);
var isInitialized = false;
// FIXED: Programmatically select the central 32 columns for the EQ display
var numEqBands = 32;
var eqColumnsToTrim = numColumns - numEqBands;
var equalizerColumns = bodyColumns.slice(eqColumnsToTrim / 2, numColumns - (eqColumnsToTrim / 2));

var isEqColumn = array(numColumns + 1);
var balancedData = array(equalizerColumns.length);

// Initialize the isEqColumn lookup table once.
for (var i = 0; i < equalizerColumns.length; i++) {
    isEqColumn[equalizerColumns[i]] = true;
}


// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    // --- Stage 1: Pre-Emphasis EQ ---
    // Boost higher frequencies to make them visually competitive with the bass.
    for (var i = 0; i < equalizerColumns.length; i++) {
        var boost = 1 + (i / equalizerColumns.length) * eqBalance;
        balancedData[i] = frequencyData[i] * boost;
    }

    // --- Stage 2: Automatic Gain Control (AGC) ---
    // Find the loudest frequency band in the *balanced* data.
    var currentMax = 0;
    for (var i = 0; i < equalizerColumns.length; i++) {
        currentMax = max(currentMax, balancedData[i]);
    }

    // If the current loudest sound is greater than our tracked max, update it.
    if (currentMax > maxLoudness) {
        maxLoudness = currentMax;
    } else {
        // Otherwise, slowly decay the max loudness over time.
        maxLoudness -= delta / 1000 * 0.1;
        maxLoudness = max(maxLoudness, 0.01); // Don't decay to zero
    }

    // --- Stage 3: Update Bar Heights ---
    for (var i = 0; i < equalizerColumns.length; i++) {
        var col = equalizerColumns[i];

        // Normalize the balanced data by the dynamic max loudness to get a 0-1 value
        var normalizedValue = balancedData[i] / maxLoudness;

        // Apply the final gain
        var barValue = normalizedValue * gain;

        barValues[col] = barValue;

        // Update Peak Indicators
        peakValues[col] -= delta / 1000 * peakFallSpeed;
        if (barValue >= peakValues[col]) {
            peakValues[col] = barValue;
        }
    }
}

export function render(index) {
    var col = pixelToColumn[index];
    // This is the most robust way to guarantee sleeves are dark.
    if (!col || !isEqColumn[col]) {
        rgb(0, 0, 0);
        return;
    }

    var pos = pixelToColumnPos[index];
    var barHeight = barValues[col];
    var peakHeight = peakValues[col];

    var h, s = 1, v = 0;

    if (pos > 1 - barHeight) {
        h = 0.333 - pos * 0.333; // Color shifts from green at bottom to yellow at top
        v = 1;
    }

    if (abs(pos - peakHeight) < 0.02) {
        h = 0; // Red
        v = 1;
    }

    hsv(h, s, v);
}
