
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
export var sensitivity = 0.5; // Bass trigger sensitivity (0-1, lower is more sensitive)
export var pulseSpeed = 0.5;  // How fast the pulses travel (0-1)
export var waveWidth = 0.15;  // The width of the energy wave (0-1)
export var baseHue = 0.66;    // Base color of the pulse (0-1, 0.66 is blue)

// --- Sensor Board Data ---
export var frequencyData;

// --- Internal State ---
var maxPulses = 10; // Manage up to 10 simultaneous pulses
var pulses = array(maxPulses); // Stores the current distance of each pulse from the center
// --- Beat Detection State ---
var avgBassEnergy = 0;
var timeSinceLastPulse = 9999; // Start ready to fire
var beatCooldown = 150; // Minimum ms between beats

// Initialize all pulses to be 'dead' (position < 0)
for (var i = 0; i < maxPulses; i++) {
    pulses[i] = -1;
}

// --- Animation Logic ---
export function beforeRender(delta) {
    timeSinceLastPulse += delta;

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

    // --- Advanced Beat Detection ---
    var rawBass = frequencyData[0] + frequencyData[1] + frequencyData[2];

    // Calculate the threshold for a beat. The sensitivity slider adjusts how
    // much louder the current bass has to be than the recent average.
    var threshold = 1 + (1 - sensitivity) * 4; // Threshold ranges from 1.0 to 5.0

    // Check for a beat: current bass is above threshold AND cooldown has passed
    if (rawBass > avgBassEnergy * threshold && timeSinceLastPulse > beatCooldown) {
        // Find a 'dead' pulse slot to reuse
        for (i = 0; i < maxPulses; i++) {
            if (pulses[i] < 0) {
                pulses[i] = 0; // Start a new pulse at the center
                timeSinceLastPulse = 0; // Reset cooldown timer
                break; // Only start one new pulse per frame
            }
        }
    }

    // Update the average bass energy using an exponential moving average
    avgBassEnergy = avgBassEnergy * 0.9 + rawBass * 0.1;
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