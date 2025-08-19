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

# Serpentine wiring is physically handled, this script just generates the map
# of the physical (x,y,z) coordinates for each pixel *in order*.

# ----------------------------
# GEOMETRY - Unrolled 2D Map
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

    # X position is determined by the column index
    x_pos = col_idx * ARC_SPACING_IN

    # Y positions depend on the wiring direction for that column
    # The user specified:
    # Odd columns: bottom-to-top wiring
    # Even columns: top-to-bottom wiring

    y_positions = []
    if col_num % 2 == 1: # Odd column (bottom-to-top)
        # The first pixel (i=0) is at the bottom.
        # Y increases downwards, so bottom pixels have higher Y values.
        for i in range(n_leds):
            y_pos = total_height_in - (i * LED_PITCH_IN)
            y_positions.append(y_pos)
    else: # Even column (top-to-bottom)
        # The first pixel (i=0) is at the top.
        # Top pixels have lower Y values.
        for i in range(n_leds):
            y_pos = i * LED_PITCH_IN
            y_positions.append(y_pos)

        # As per user diagnosis, the coordinate list for even columns must be
        # reversed to match the data path.
        y_positions.reverse()

    # Add the coordinates for this column to the list
    for y in y_positions:
        coords_in.append([round(x_pos, 3), round(y, 3), 0.0])

# ----------------------------
# OUTPUT JSON
# ----------------------------
with open("mapping_inches.json", "w") as f:
    json.dump(coords_in, f, separators=(",", ":"))

print("Wrote mapping_inches.json with", len(coords_in), "LEDs")
