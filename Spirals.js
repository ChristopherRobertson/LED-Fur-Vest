
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
    // FIXED: Use maxColumnLength instead of a hardcoded value
    var totalAnimationSteps = maxColumnLength * pitch;
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
    var horizontalStep = step % bodyColumns.length;
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

    // FIXED: Use maxColumnLength instead of a hardcoded value
    var blueVerticalOffset = (maxColumnLength - 1) - masterVerticalStep;

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