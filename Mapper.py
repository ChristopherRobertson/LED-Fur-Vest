import json
import math

# ----------------------------
# CONFIG
# ----------------------------
ARC_SPACING_IN = 1.25                    # column spacing (inches)
LED_PITCH_IN = (1000.0 / 60.0) / 25.4    # SK9822 pitch ≈ 0.656" per LED
NUM_COLS = 36
COL_LED_COUNTS = [
    25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35,
    25, 25, 25, 25, 35, 36, 36, 36, 36, 36, 35, 35, 36, 36, 36, 36, 36, 35, 25, 25
]

ROT_OFFSET = 0.0   # radians (rotate where column 1 is placed)
CCW = True         # True = columns increase CCW; False = CW
# This setting controls the Z-axis mapping for serpentine data flow.
# The user's wiring is: Odd Cols = bottom-to-top, Even Cols = top-to-bottom
# My previous attempt to fix the map had this reversed. This is the original logic.
SERPENTINE_LOGIC_REVERSED = True # Set to true to match user's diagnosis

# ----------------------------
# GEOMETRY - 3D Cylindrical Map
# ----------------------------
circ_in = NUM_COLS * ARC_SPACING_IN
radius_in = circ_in / (2.0 * math.pi)
dtheta = ARC_SPACING_IN / radius_in
dir_mult = 1.0 if CCW else -1.0

coords_in = []
for col_idx in range(NUM_COLS):
    col_num = col_idx + 1
    theta = ROT_OFFSET + dir_mult * (col_idx * dtheta)
    x_base = radius_in * math.cos(theta)
    y_base = radius_in * math.sin(theta)

    n_leds = COL_LED_COUNTS[col_idx]

    # Generate z-positions based on wiring direction
    z_positions_natural = [i * LED_PITCH_IN for i in range(n_leds)]

    # Determine which direction this column goes
    is_bottom_to_top = (col_num % 2 == 1)
    if SERPENTINE_LOGIC_REVERSED:
        is_bottom_to_top = not is_bottom_to_top

    if is_bottom_to_top:
        # Bottom-to-top: ascending Z values
        z_positions = z_positions_natural
    else:
        # Top-to-bottom: descending Z values
        z_positions = list(reversed(z_positions_natural))

    for z in z_positions:
        coords_in.append([round(x_base, 3), round(y_base, 3), round(z, 3)])

# ----------------------------
# OUTPUT JSON
# ----------------------------
with open("mapping_inches.json", "w") as f:
    json.dump(coords_in, f, separators=(",", ":"))

print("Wrote mapping_inches.json with", len(coords_in), "LEDs")
