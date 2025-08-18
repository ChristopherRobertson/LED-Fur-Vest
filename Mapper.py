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
SERPENTINE_Z = True  # False = all columns start at base (z=0)

# ----------------------------
# GEOMETRY
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
    if SERPENTINE_Z:
        if col_num % 2 == 1:
            z_positions = [i * LED_PITCH_IN for i in range(n_leds)]
        else:
            top_z = (n_leds - 1) * LED_PITCH_IN
            z_positions = [top_z - i * LED_PITCH_IN for i in range(n_leds)]
    else:
        z_positions = [i * LED_PITCH_IN for i in range(n_leds)]

    for z in z_positions:
        coords_in.append([round(x_base, 3), round(y_base, 3), round(z, 3)])

# ----------------------------
# OUTPUT JSON
# ----------------------------
with open("mapping_inches.json", "w") as f:
    json.dump(coords_in, f, separators=(",", ":"))

print("Wrote mapping_inches.json with", len(coords_in), "LEDs")
