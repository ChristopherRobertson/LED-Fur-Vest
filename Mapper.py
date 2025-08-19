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

# Find the maximum number of LEDs in any column to determine the total height
max_led_count = 0
for count in COL_LED_COUNTS:
    if count > max_led_count:
        max_led_count = count

# Total height of the mapped area in inches
total_height_in = (max_led_count - 1) * LED_PITCH_IN

coords_in = []
for col_idx in range(NUM_COLS):
    col_num = col_idx + 1
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
