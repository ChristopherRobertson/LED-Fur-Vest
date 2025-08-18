
/**
 * Matrix
 *
 * This pattern emulates the "digital rain" effect from The Matrix.
 * Green streams of characters with bright leading edges fall down each
 * column of the coat at random speeds and intervals.
 */

// --- UI Controls ---
var speed = 0.5;
var tailLength = 0.5;

export function sliderSpeed(v) {
    // Speed slider controls the base speed of the drops
    speed = 0.1 + v * v * 2;
}
export function sliderTailLength(v) {
    // Tail Length slider controls the max length of the trails
    tailLength = 1 + v * 30;
}


// --- Animation State ---
var dropPosition = array(numColumns + 1);
var dropSpeed = array(numColumns + 1);
var dropLength = array(numColumns + 1);
var isInitialized = false;

// --- Initialization ---
// This runs only once, before the first frame is rendered.
function initializeDrops() {
    // Initialize each column's drop to a random state
    for (var col = 1; col <= numColumns; col++) {
        resetDrop(col);
        // Start them at random positions so they don't all start at once
        dropPosition[col] = random(columnLengths[col] * 2);
    }
    isInitialized = true;
}

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isInitialized) initializeDrops();

    // Update the position of each drop
    for (var col = 1; col <= numColumns; col++) {
        dropPosition[col] += delta / 1000 * dropSpeed[col];

        // If a drop has fallen off the bottom, reset it
        if (dropPosition[col] > columnLengths[col] + dropLength[col]) {
            resetDrop(col);
        }
    }
}

export function render(index) {
    var col = pixelToColumn[index];
    if (!col) { // If a pixel isn't mapped to a column, turn it off
        rgb(0, 0, 0);
        return;
    }

    var start = columnStartIndices[col];
    var len = columnLengths[col];

    // FIXED: Calculate this pixel's position from the TOP of its column
    // to make the rain fall downwards.
    var pixelPosInColumn = index - start;
    if (!isReversed[col]) { // If a column is NOT reversed, it's wired bottom-to-top.
        pixelPosInColumn = (len - 1) - pixelPosInColumn; // We need to flip it.
    }
    // If a column IS reversed, its wiring is already top-to-bottom, which is correct.

    // Calculate distance from this pixel to the head of its column's drop
    var dist = dropPosition[col] - pixelPosInColumn;

    var h = 0.333; // Matrix Green
    var s = 1;
    var v = 0;

    // Is this pixel part of the drop's trail?
    if (dist >= 0 && dist < dropLength[col]) {
        if (dist < 1) {
            // The leading pixel is bright white
            s = 0;
            v = 1;
        } else {
            // The tail fades out
            v = 1 - (dist / dropLength[col]);
            v = v * v; // Square for a steeper fade-off
        }
    } else {
        // Dimly light other pixels for background effect
        v = 0.05;
    }

    hsv(h, s, v);
}

// =================================================================
//                  HELPER FUNCTIONS
// =================================================================

function resetDrop(col) {
    // Give the drop a new random speed and length
    dropSpeed[col] = (5 + random(20)) * speed;
    dropLength[col] = 2 + random(tailLength);

    // Reset its position to the top
    // A negative start position creates a random delay before it appears on screen
    dropPosition[col] = -random(200);
}