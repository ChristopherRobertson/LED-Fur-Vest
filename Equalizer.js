
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