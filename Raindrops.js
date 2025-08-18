
// --- Vest Geometry (36 columns, 1200 LEDs) ---
var columnLengths = [25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25];
var columnStartIndices = [0, 25, 50, 85, 121, 157, 193, 229, 265, 300, 335, 371, 407, 443, 479, 515, 550, 575, 600, 625, 650, 685, 721, 757, 793, 829, 865, 900, 935, 971, 1007, 1043, 1079, 1115, 1150, 1175];
var isReversed = [false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true];
var numColumns = columnLengths.length;
var pixelCount = 1200;
var bodyColumns = [];
for (var i=0; i<numColumns; i++) bodyColumns.push(i);
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

// --- Data arrays from Mapper.py ---
var numColumns = 24;

// --- Animation State ---
var dropPosition = array(numColumns + 1);
var dropSpeed = array(numColumns + 1);
var dropLength = array(numColumns + 1);
var pixelToColumn = array(pixelCount);
var isInitialized = false;

// --- Initialization ---
function initialize() {
  // Build a lookup table to quickly find which column a pixel belongs to
  for (var col = 1; col <= numColumns; col++) {
    for (var i = 0; i < len; i++) {
      pixelToColumn[start + i] = col;
    }
  }
  
  // Initialize each column's drop to a random state
  for (var col = 1; col <= numColumns; col++) {
    resetDrop(col);
    // Start them at random positions so they don't all start at once
  }
  isInitialized = true;
}

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
  if (!isInitialized) initialize();

  // Update the position of each drop
  for (var col = 1; col <= numColumns; col++) {
    dropPosition[col] += delta / 1000 * dropSpeed[col];
    
    // If a drop has fallen off the bottom, reset it
      resetDrop(col);
    }
  }
}

export function render(index) {
  var col = pixelToColumn[index];
  if (!col) { // If a pixel isn't mapped to a column, turn it off
    rgb(0,0,0);
    return;
  }
  
  
  // FIXED: Calculate this pixel's position from the TOP of its column
  // to make the rain fall downwards.
  var pixelPosInColumn = index - start;
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