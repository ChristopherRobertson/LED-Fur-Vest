
/**
 * Black Hole (Finale - Moving)
 *
 * This pattern creates a moving black hole on the surface of the coat.
 * It features a swirling, multicolored event horizon with a gravitational
 * lensing effect, all set against a backdrop of twinkling stars.
 * The black hole moves along the surface from one random pixel to another.
 */

// --- UI Controls ---
var r1 = 0.1; // Radius of the black center
var r2 = 0.2; // Outer radius of the event horizon
var swirlSpeed = 0.2;
var wanderSpeed = 0.5; // Controls how fast it moves between points

// FIXED: Hardcoded star density. Change this value to adjust the number of stars.
var starDensity = 0.75;

export function sliderRadius1(v) {
    r1 = v * 0.5;
    if (r2 < r1) r2 = r1;
}
export function sliderRadius2(v) {
    var newR2 = v * 0.5;
    if (newR2 >= r1) r2 = newR2;
}
export function sliderSwirlSpeed(v) {
    swirlSpeed = 0.05 + v * 0.5;
}
export function sliderWanderSpeed(v) {
    wanderSpeed = 0.1 + v * 0.9;
}

// --- Animation State ---
var bhX, bhY, bhZ; // Black hole's current interpolated position
var PI2 = PI * 2;

// --- Movement State ---
var currentPointX, currentPointY, currentPointZ;
var targetPointX, targetPointY, targetPointZ;
var moveTimer = 9999;
var moveDuration = 5000;

// --- Starfield State ---
var starHue = array(pixelCount);
var starPhase = array(pixelCount);
var isStarsInitialized = false;

// --- Map Initialization ---
var isMapInitialized = false;
var allX = array(pixelCount), allY = array(pixelCount), allZ = array(pixelCount);

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    if (!isMapInitialized) return;

    moveTimer += delta;

    // A `while` loop is more robust for handling the transition.
    // This ensures that even if a lot of time has passed (e.g. a lag spike),
    // the animation catches up correctly without pausing.
    while (moveTimer >= moveDuration) {
        moveTimer -= moveDuration;
        pickNewTarget();
        moveDuration = (2000 + random(4000)) / wanderSpeed; // 2-6 second travel time
    }

    // Interpolate the black hole's position between the current and target points
    var progress = moveTimer / moveDuration;
    if (moveDuration == 0) progress = 1; // Prevent division by zero

    progress = progress * progress * (3 - 2 * progress); // Smoothstep easing

    bhX = currentPointX + (targetPointX - currentPointX) * progress;
    bhY = currentPointY + (targetPointY - currentPointY) * progress;
    bhZ = currentPointZ + (targetPointZ - currentPointZ) * progress;
}

export function render3D(index, x, y, z) {
    // --- One-time Map & Starfield Capture ---
    if (!isMapInitialized) {
        allX[index] = x; allY[index] = y; allZ[index] = z;
        if (index == pixelCount - 1) {
            isMapInitialized = true;
            pickNewTarget(); // Set the very first target
            pickNewTarget(); // And the second, to initialize current and target
            bhX = currentPointX; bhY = currentPointY; bhZ = currentPointZ;
        }
    }

    if (!isStarsInitialized) {
        if (random(1) < starDensity) {
            var r = random(1);
            if (r < 0.4) starHue[index] = 0.66; else if (r < 0.7) starHue[index] = 0.83; else if (r < 0.9) starHue[index] = 0; else starHue[index] = -1;
            starPhase[index] = random(1);
        } else {
            starHue[index] = -2;
        }
        if (index == pixelCount - 1) isStarsInitialized = true;
    }

    if (!isMapInitialized) return;

    // --- Distance Calculation ---
    var dx = x - bhX;
    var dy = y - bhY;
    var dz = z - bhZ;
    var distance = hypot3(dx, dy, dz);

    // --- Rendering Logic ---
    if (distance < r1) {
        rgb(0, 0, 0); // Singularity
    } else if (distance <= r2) {
        // Event Horizon
        var normalizedDist = (distance - r1) / (r2 - r1);
        var angle = atan2(dy, dx);
        var swirl = time(swirlSpeed * 0.1) * PI2;
        var lensing = 1 - normalizedDist;
        swirl -= lensing * lensing * 5;

        var noise = perlin(angle * 2, swirl, distance * 5, 1);
        noise = noise * noise;

        var brightness = (1 - normalizedDist) * noise;
        var hue = 0.6 + noise * 0.5 - (lensing * 0.2);

        hsv(hue, 1, brightness * 2.0);
    } else {
        // Starfield
        if (starHue[index] > -2) {
            var twinkle = wave(time(0.1) + starPhase[index]);
            var h = starHue[index];
            var s = 1, v = twinkle * twinkle * 0.5;
            if (h == -1) { s = 0; v *= 0.7; }
            hsv(h, s, v);
        } else {
            rgb(0, 0, 0); // Empty space
        }
    }
}

// =================================================================
//                  HELPER FUNCTIONS
// =================================================================

function pickNewTarget() {
    // The old target becomes the new starting point
    currentPointX = targetPointX;
    currentPointY = targetPointY;
    currentPointZ = targetPointZ;

    // Pick a new random pixel on the coat as the next destination
    var targetIndex = floor(random(pixelCount));
    targetPointX = allX[targetIndex];
    targetPointY = allY[targetIndex];
    targetPointZ = allZ[targetIndex];
}