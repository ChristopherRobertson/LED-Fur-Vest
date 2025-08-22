// =================================================================
//
//                        GEOMETRY DEFINITION
//
// This file contains the master definition for the coat's geometry
// and provides pre-computed lookup tables for use by the patterns.
// It should be included before any pattern files.
//
// =================================================================


// --- Master Geometry Definition ---
// This is the single source of truth for the coat's physical layout.
// The first '0' is a spacer for 1-based indexing.
var columnLengths = [0,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25,25,25,35,36,36,36,36,36,35,35,36,36,36,36,36,35,25,25];


// --- Pre-computed Variables ---
var numColumns = columnLengths.length - 1;

// Calculate the maximum number of LEDs in any single column
var maxColumnLength = 0;
for (var i = 1; i <= numColumns; i++) {
    if (columnLengths[i] > maxColumnLength) {
        maxColumnLength = columnLengths[i];
    }
}

// Compute the starting pixel index for each column (1-based)
var columnStartIndices = array(numColumns + 1);
var acc = 0;
columnStartIndices[0] = 0;
for (var col = 1; col <= numColumns; col++) {
  columnStartIndices[col] = acc;
  acc += columnLengths[col];
}

// Create a lookup table for serpentine wiring (true if column is top-to-bottom)
var isReversed = array(numColumns + 1);
for (var col = 1; col <= numColumns; col++) {
  isReversed[col] = (col % 2 == 0);
}

// Create a lookup table to quickly find which column a pixel belongs to
var pixelToColumn = array(pixelCount);
// Create a lookup table for a pixel's normalized (0-1) position within its column
var pixelToColumnPos = array(pixelCount);

for (var col = 1; col <= numColumns; col++) {
    var start = columnStartIndices[col];
    var len = columnLengths[col];
    for (var i = 0; i < len; i++) {
        var pixelIndex = start + i;
        pixelToColumn[pixelIndex] = col;
        // Calculate normalized position (0.0 at bottom, 1.0 at top)
        var pos = (len > 1) ? (i / (len - 1)) : 0;
        pixelToColumnPos[pixelIndex] = isReversed[col] ? (1 - pos) : pos;
    }
}

/**
 * Firefly Swarm
 *
 * A magical swarm of fireflies drifting around the vest. Each firefly has
 * its own breathing cycle, movement pattern, and warm golden glow. Some
 * fireflies are brighter than others, creating a natural, organic feel
 * like a summer evening forest.
 */

// --- Firefly Parameters ---
var maxFireflies = 15; // Number of fireflies
var breathSpeed = 1.5; // How fast fireflies pulse
var driftSpeed = 0.4; // How fast they move around
var glowRadius = 2.5; // How far the glow extends
var spawnRate = 0.3; // How often new fireflies appear

// --- Firefly State ---
// Each firefly: col, pos, brightness, breathPhase, driftPhase, lifespan
var fireflies = array(maxFireflies * 6);
var pixelGlow = array(pixelCount);
var time = 0;

// Initialize fireflies
for (var i = 0; i < maxFireflies; i++) {
    spawnFirefly(i);
}

// =================================================================
//                        MAIN LOGIC
// =================================================================

export function beforeRender(delta) {
    time += delta / 1000;
    
    // Clear previous glow
    for (var i = 0; i < pixelCount; i++) {
        pixelGlow[i] = 0;
    }
    
    // Update each firefly
    for (var i = 0; i < maxFireflies; i++) {
        var baseIdx = i * 6;
        var lifespan = fireflies[baseIdx + 5];
        
        if (lifespan > 0) {
            // Update firefly
            updateFirefly(i, delta);
            
            // Draw firefly glow
            var col = fireflies[baseIdx];
            var pos = fireflies[baseIdx + 1];
            var brightness = fireflies[baseIdx + 2];
            
            drawFireflyGlow(col, pos, brightness);
            
            // Age the firefly
            fireflies[baseIdx + 5] -= delta / 1000 * 0.1; // Slow aging
        } else if (random(1) < spawnRate * delta / 1000) {
            // Respawn dead firefly
            spawnFirefly(i);
        }
    }
}

export function render(index) {
    var glow = pixelGlow[index];
    
    if (glow <= 0) {
        rgb(0, 0, 0);
        return;
    }
    
    // Warm firefly colors - golden yellow to orange
    var h, s, v;
    
    if (glow > 0.7) {
        // Bright core: warm white/pale yellow
        h = 0.12; // Pale yellow
        s = 0.4;
        v = min(1, glow);
    } else if (glow > 0.3) {
        // Medium glow: golden yellow
        h = 0.15; // Golden
        s = 0.8;
        v = glow;
    } else {
        // Soft edge: warm orange
        h = 0.08; // Orange
        s = 1.0;
        v = glow;
    }
    
    hsv(h, s, v);
}

// =================================================================
//                        HELPER FUNCTIONS
// =================================================================

function spawnFirefly(index) {
    var baseIdx = index * 6;
    
    fireflies[baseIdx] = random(numColumns) + 1; // col
    fireflies[baseIdx + 1] = random(1); // pos
    fireflies[baseIdx + 2] = 0.4 + random(0.6); // brightness
    fireflies[baseIdx + 3] = random(6.28); // breathPhase
    fireflies[baseIdx + 4] = random(6.28); // driftPhase
    fireflies[baseIdx + 5] = 8 + random(12); // lifespan (8-20 seconds)
}

function updateFirefly(index, delta) {
    var baseIdx = index * 6;
    
    // Update breathing
    fireflies[baseIdx + 3] += breathSpeed * delta / 1000;
    var breathCycle = (sin(fireflies[baseIdx + 3]) + 1) / 2; // 0 to 1
    
    // Update brightness based on breathing
    var baseBrightness = 0.4 + random(0.3);
    fireflies[baseIdx + 2] = baseBrightness * (0.3 + breathCycle * 0.7);
    
    // Update position (gentle drift)
    fireflies[baseIdx + 4] += driftSpeed * delta / 1000;
    var driftCycle = fireflies[baseIdx + 4];
    
    // Gentle horizontal drift
    var colDrift = sin(driftCycle * 0.7) * 0.3;
    var newCol = fireflies[baseIdx] + colDrift;
    
    // Wrap around vest
    if (newCol > numColumns) newCol -= numColumns;
    if (newCol < 1) newCol += numColumns;
    fireflies[baseIdx] = newCol;
    
    // Gentle vertical drift
    var posDrift = sin(driftCycle * 0.5 + 1.5) * 0.05;
    var newPos = fireflies[baseIdx + 1] + posDrift;
    newPos = max(0.1, min(0.9, newPos)); // Keep away from edges
    fireflies[baseIdx + 1] = newPos;
}

function drawFireflyGlow(centerCol, centerPos, brightness) {
    // Draw glow around firefly position
    for (var col = 1; col <= numColumns; col++) {
        var colDistance = abs(col - centerCol);
        
        // Handle wrap-around distance
        if (colDistance > numColumns / 2) {
            colDistance = numColumns - colDistance;
        }
        
        if (colDistance <= glowRadius) {
            var columnLen = columnLengths[col];
            var startIndex = columnStartIndices[col];
            
            for (var i = 0; i < columnLen; i++) {
                var pixelPos = i / (columnLen - 1);
                if (isReversed[col]) pixelPos = 1 - pixelPos;
                
                var posDistance = abs(pixelPos - centerPos) * 20; // Scale for comparison
                var totalDistance = sqrt(colDistance * colDistance + posDistance * posDistance);
                
                if (totalDistance <= glowRadius) {
                    var actualPixelIdx = isReversed[col] ? 
                        (startIndex + columnLen - 1) - i : startIndex + i;
                    
                    if (actualPixelIdx >= 0 && actualPixelIdx < pixelCount) {
                        // Soft falloff
                        var falloff = 1 - (totalDistance / glowRadius);
                        falloff = falloff * falloff; // Quadratic for softer edges
                        
                        var glowContribution = brightness * falloff;
                        pixelGlow[actualPixelIdx] = max(pixelGlow[actualPixelIdx], glowContribution);
                    }
                }
            }
        }
    }
}