
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

/*
  Music-Responsive 3D Energy Pulse

  This pattern generates waves of energy that pulse outwards from the center
  of the 3D map. It's designed to be highly performant and visually impressive
  on a mapped garment.

  This version REQUIRES the Pixelblaze Sensor Board to be attached and enabled.
  - Bass hits in the music will trigger new pulses.
  - The color of the pulses can be controlled and will shift with the music.
*/

// --- UI Controls ---
export var sensitivity = 0.01; // Bass trigger sensitivity (0-1, lower is more sensitive)
export var pulseSpeed = 0.5;  // How fast the pulses travel (0-1)
export var waveWidth = 0.15;  // The width of the energy wave (0-1)
export var baseHue = 0.66;    // Base color of the pulse (0-1, 0.66 is blue)

// --- Sensor Board Data ---
export var frequencyData;

// --- Internal State ---
var maxPulses = 10; // Manage up to 10 simultaneous pulses
var pulses = array(maxPulses); // Stores the current distance of each pulse from the center

// Initialize all pulses to be 'dead' (position < 0)
for (var i = 0; i < maxPulses; i++) {
    pulses[i] = -1;
}

// --- Animation Logic ---
export function beforeRender(delta) {
    // Move existing pulses outwards
    for (var i = 0; i < maxPulses; i++) {
        if (pulses[i] >= 0) {
            pulses[i] += delta / 16 * pulseSpeed / 10;
            // If a pulse has gone past the edge (max distance squared is 3 for a -1 to 1 cube), kill it.
            if (pulses[i] > 3) {
                pulses[i] = -1;
            }
        }
    }

    // Check for a bass hit to trigger a new pulse
    // We sum the energy of the first 3 low-frequency bins.
    var bass = frequencyData[0] + frequencyData[1] + frequencyData[2];
    if (bass > sensitivity) {
        // Find a 'dead' pulse slot to reuse
        for (i = 0; i < maxPulses; i++) {
            if (pulses[i] < 0) {
                pulses[i] = 0; // Start a new pulse at the center
                break; // Only start one new pulse per frame
            }
        }
    }
}

// --- Per-Pixel Rendering ---
// By using render3D, we get the x, y, and z coordinates for each pixel.
export function render3D(index, x, y, z) {
    var v = 0;
    var h = baseHue;

    // Calculate the pixel's distance squared from the center (0,0,0).
    // We use distance squared (without the slow square root) for performance.
    var distSq = x * x + y * y + z * z;

    // Check against all active pulses
    for (var i = 0; i < maxPulses; i++) {
        if (pulses[i] >= 0) {
            // Calculate the difference between the pixel's distance and the pulse's position
            var diff = abs(distSq - pulses[i]);

            // Is this pixel part of the current pulse's wave?
            if (diff < waveWidth) {
                // Create a triangle wave for a sharp pulse shape
                var newV = 1 - diff / waveWidth;

                // Use the brightest value if pixels are in multiple overlapping waves
                if (newV > v) {
                    v = newV;
                    // Shift the hue based on which pulse is rendering
                    h = baseHue + i * 0.05;
                }
            }
        }
    }

    // Set the pixel's color and brightness
    hsv(h, 1, v * v);
}