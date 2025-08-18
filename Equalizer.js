
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
// FIXED: Create a dedicated list for the 32 columns that will display the EQ
var equalizerColumns = [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34];
var isEqColumn = array(numColumns + 1);
var balancedData = array(equalizerColumns.length);

function initialize() {
    for (var i = 0; i < equalizerColumns.length; i++) {
        isEqColumn[equalizerColumns[i]] = true;
    }

    for (var col = 1; col <= numColumns; col++) {
        var start = columnStartIndices[col];
        var len = columnLengths[col];
        for (var i = 0; i < len; i++) {
            var pixelIndex = start + i;
            pixelToColumn[pixelIndex] = col;
            var pos = i / (len - 1);
            pixelToColumnPos[pixelIndex] = isReversed[col] ? 1 - pos : pos;
        }
    }
    isInitialized = true;
}

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isInitialized) initialize();

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

    if (pos < barHeight) {
        h = 0.333 - (pos / barHeight) * 0.333;
        v = 1;
    }

    if (abs(pos - peakHeight) < 0.02) {
        h = 0; // Red
        v = 1;
    }

    hsv(h, s, v);
}