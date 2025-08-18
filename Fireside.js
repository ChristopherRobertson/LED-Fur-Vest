
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
 * Fireside (Columnar Method)
 *
 * This pattern emulates a fire using a classic "columnar" or "chimney"
 * algorithm. Heat rises from a chaotic source at the bottom and cools
 * as it travels up each column, creating a realistic, flowing flame effect.
 */

// --- UI Controls ---
var cooling = 0.8; // How quickly the flames cool as they rise. (0.1-1.0)
var sparking = 0.3; // The chance of a bright spark appearing. (0-1)

export function sliderCooling(v) {
    // A lower cooling value means taller, more intense flames.
    cooling = 0.1 + v * 0.9;
}
export function sliderSparking(v) {
    sparking = v;
}


// --- Animation State ---
var heat = array(pixelCount);

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    // --- Step 1: Cool down all the flames from the previous frame ---
    // We iterate upwards from the bottom of each column.
    for (var i = 0; i < bodyColumns.length; i++) {
        var colNum = bodyColumns[i];
        var start = columnStartIndices[colNum];
        var len = columnLengths[colNum];

        // The direction of "up" depends on how the column is wired.
        if (isReversed[colNum]) {
            // For reversed columns, "up" means iterating from high index to low.
            for (var p = 0; p < len - 1; p++) {
                var selfIndex = start + p;
                var belowIndex = start + p + 1;
                // The heat of this pixel is the heat of the one below it, cooled slightly.
                heat[selfIndex] = heat[belowIndex] - random(cooling) / len;
            }
        } else {
            // For normal columns, "up" means iterating from low index to high.
            for (var p = len - 1; p > 0; p--) {
                var selfIndex = start + p;
                var belowIndex = start + p - 1;
                heat[selfIndex] = heat[belowIndex] - random(cooling) / len;
            }
        }
    }

    // --- Step 2: Set the heat for the fire source (the bottom row) ---
    for (var i = 0; i < bodyColumns.length; i++) {
        var colNum = bodyColumns[i];
        var start = columnStartIndices[colNum];
        var len = columnLengths[colNum];

        // Find the index of the bottom-most pixel in this column.
        var bottomPixelIndex = isReversed[colNum] ? start + len - 1 : start;

        // Create a random, chaotic heat source.
        var rand = random(1);
        if (rand < sparking) {
            // Occasionally, create a very hot "spark".
            heat[bottomPixelIndex] = rand * 5; // Sparks can be hotter than 1.0
        } else {
            // Otherwise, create a normal, flickering flame source.
            heat[bottomPixelIndex] = rand;
        }
    }
}

export function render(index) {
    // Get the heat for this pixel, ensuring it's not negative.
    var h = max(0, heat[index]);

    // Map the heat value to a fire color gradient.
    // The hue shifts from red (0) to a warm orange (0.06) as heat increases.
    // This prevents the color from ever reaching the greenish-yellow part of the spectrum.
    // FIXED: Changed hue multiplier from 0.08 to 0.06 to ensure a warm fire color.
    var hue = 0.06 * min(1, h);

    hsv(hue, 1, h * h); // Squaring the brightness makes the falloff look better.
}