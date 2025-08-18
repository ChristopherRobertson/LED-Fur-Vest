
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
 * Particle Collider
 *
 * This pattern features two spiraling trails, one red and one blue,
 * moving in opposite directions. When the two lead pixels collide,
 * or when they meet at the center back, the animation resets and
 * starts over from the beginning.
 *
 * The speed and pitch are hardcoded to fixed values.
 */


// The physical order of the 18 main body columns.
// A reversed copy for the second spiral
var numBodyColumns = bodyColumns.length;

// The starting pixel index for each column number (1-24).

// The number of LEDs in each column number (1-24).

// A boolean lookup to quickly check if a column is wired in reverse.

// --- Fixed Animation Parameters ---
var pitch = 5.25; // Hardcoded to 25% of the original slider's range
var speed = 0.1; // Hardcoded to 90% of the original slider's range

// --- Animation State ---
var pixelsState = array(pixelCount);
var litPixel1, litPixel2;
var step;
var accumulator = 0; // Custom timer to allow for resets
var newCycle = true; // Flag to signal a reset is needed

export function beforeRender(delta) {
    // FIXED: Use 36 (max new column height) instead of 60
    var totalAnimationSteps = 36 * pitch;
    var basePeriod = 0.2 * pitch;
    var finalPeriod = basePeriod / speed;

    // Use our custom accumulator timer. It's incremented by the time since the last frame.
    accumulator += delta / 1000;

    // If the timer completes a full cycle without a collision, signal a new cycle.
    if (accumulator >= finalPeriod) {
        accumulator = 0;
        newCycle = true;
    }

    // --- Reset logic ---
    // If a new cycle has been signaled, clear the trails and reset the flag.
    if (newCycle) {
        for (var i = 0; i < pixelCount; i++) {
            pixelsState[i] = 0;
        }
        newCycle = false;
    }

    // Calculate the animation progress from our custom timer.
    var progress = accumulator / finalPeriod;
    step = floor(progress * totalAnimationSteps);

    // --- Calculate positions for both spirals ---
    var horizontalStep = step % numBodyColumns;
    var masterVerticalStep = floor(step / pitch);

    // --- Spiral 1 (Upwards, Red) ---
    var columnNumber1 = bodyColumns[horizontalStep];
    var startIndex1 = columnStartIndices[columnNumber1];
    var len1 = columnLengths[columnNumber1];
    var reversed1 = isReversed[columnNumber1];

    if (masterVerticalStep >= len1) {
        litPixel1 = -1;
    } else {
        if (reversed1) {
            litPixel1 = (startIndex1 + len1 - 1) - masterVerticalStep;
        } else {
            litPixel1 = startIndex1 + masterVerticalStep;
        }
    }

    // --- Spiral 2 (Downwards, Blue) ---
    var columnNumber2 = bodyColumnsReversed[horizontalStep];
    var startIndex2 = columnStartIndices[columnNumber2];
    var len2 = columnLengths[columnNumber2];
    var reversed2 = isReversed[columnNumber2];

    // FIXED: Use 36 (max new column height) instead of 60
    var blueVerticalOffset = (36 - 1) - masterVerticalStep;

    if (blueVerticalOffset < 0 || blueVerticalOffset >= len2) {
        litPixel2 = -1;
    } else {
        if (reversed2) {
            litPixel2 = (startIndex2 + len2 - 1) - blueVerticalOffset;
        } else {
            litPixel2 = startIndex2 + blueVerticalOffset;
        }
    }

    // Mark the pixels in our state array.
    if (litPixel1 != -1) pixelsState[litPixel1] = 1;
    if (litPixel2 != -1) pixelsState[litPixel2] = 2;

    // --- Event Detection and Reset ---
    // If the spirals meet at the same pixel, reset.
    if (litPixel1 != -1 && litPixel1 == litPixel2) {
        accumulator = 0;
        newCycle = true;
    }
    // FIXED: If the spirals meet at the center-back columns (18 and 19 for 36-col layout)
    // AND they are at the new vertical midpoint, reset.
    else if (((columnNumber1 == 18 && columnNumber2 == 19) || (columnNumber1 == 19 && columnNumber2 == 18)) && masterVerticalStep >= 17 && masterVerticalStep <= 18) {
        accumulator = 0;
        newCycle = true;
    }
}

export function render(index) {
    var state = pixelsState[index];

    if (state == 1) { // Spiral 1 trail
        hsv(0, 1, 1); // Red
    } else if (state == 2) { // Spiral 2 trail
        hsv(0.66, 1, 1); // Blue
    } else { // Untouched pixels
        // FIXED: Set untouched pixels to black instead of white
        hsv(0, 0, 0);
    }
}