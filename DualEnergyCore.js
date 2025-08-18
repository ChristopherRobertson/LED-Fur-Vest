/*
  Music-Responsive 3D Dual Energy Cores

  This pattern generates two "energy cores" on the front and back of the
  coat that swell and throb in time with the music's bass energy.

  This version REQUIRES the Pixelblaze Sensor Board to be attached and enabled.
  - The size and brightness of the cores are tied to the bass volume.
  - The color of the cores can be controlled via the UI.
*/

// --- UI Controls ---
export var gain = 0.5;      // Controls the maximum size and brightness of the cores
export var smoothing = 0.5;   // How much to smooth the bass response (0-1)
export var baseHue = 0.66;    // Base color of the pulse (0-1, 0.66 is blue)

export function sliderGain(v) { gain = v; }
export function sliderSmoothing(v) { smoothing = v; }
export function sliderHue(v) { baseHue = v; }


// --- Sensor Board Data ---
export var frequencyData;

// --- State Variables ---
var displayBass = 0;
var isMapInitialized = false;

// --- 3D Map & Epicenter Storage ---
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);
var frontX, frontY, frontZ;
var backX, backY, backZ;


// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isMapInitialized) return;

    // --- Calculate Bass Energy ---
    // Sum the energy from the lowest frequency bins
    var rawBass = frequencyData[0] + frequencyData[1] + frequencyData[2];

    // Smooth the bass value using an exponential moving average.
    // The smoothing factor determines how much of the previous value to keep.
    var decay = smoothing * 0.2 + 0.79; // Map slider (0-1) to a useful range (0.79-0.99)
    displayBass = displayBass * decay + rawBass * (1 - decay);
}


export function render3D(index, x, y, z) {
    // --- One-time Map Capture & Epicenter Calculation ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            // --- Front Epicenter (between cols 9 & 10) ---
            var p1_idx = columnStartIndices[9] + floor(columnLengths[9] / 2);
            var p2_idx = columnStartIndices[10] + floor(columnLengths[10] / 2);
            frontX = (allX[p1_idx] + allX[p2_idx]) / 2;
            frontY = (allY[p1_idx] + allY[p2_idx]) / 2;
            frontZ = (allZ[p1_idx] + allZ[p2_idx]) / 2;

            // --- Back Epicenter (between cols 27 & 28) ---
            var p3_idx = columnStartIndices[27] + floor(columnLengths[27] / 2);
            var p4_idx = columnStartIndices[28] + floor(columnLengths[28] / 2);
            backX = (allX[p3_idx] + allX[p4_idx]) / 2;
            backY = (allY[p3_idx] + allY[p4_idx]) / 2;
            backZ = (allZ[p3_idx] + allZ[p4_idx]) / 2;

            isMapInitialized = true;
        }
        return;
    }

    // --- Distance Calculation ---
    // Calculate squared distance to both epicenters
    var dfSq = (x-frontX)*(x-frontX) + (y-frontY)*(y-frontY) + (z-frontZ)*(z-frontZ);
    var dbSq = (x-backX)*(x-backX) + (y-backY)*(y-backY) + (z-backZ)*(z-backZ);

    // Find the distance to the *nearer* of the two cores
    var minDistSq = min(dfSq, dbSq);

    // --- Rendering Logic ---
    // The max radius of the core is controlled by the smoothed bass and gain
    var maxRadius = displayBass * gain * 5;
    var maxRadiusSq = maxRadius * maxRadius;

    var v = 0;
    if (minDistSq < maxRadiusSq) {
        var dist = sqrt(minDistSq);
        // Brightest at the center, fading to the edge
        v = 1 - (dist / maxRadius);
        v = v * v; // Square for a steeper falloff
    }

    hsv(baseHue, 1, v);
}
