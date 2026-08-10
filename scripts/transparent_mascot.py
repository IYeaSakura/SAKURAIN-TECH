from PIL import Image, ImageDraw
import os


def make_background_transparent(input_path, output_path, tolerance=12):
    """Make the uniform background of a mascot sprite transparent."""
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    # Use a temporary working image to mark the background via flood fill.
    work = img.copy()
    marker = (0, 255, 0, 255)  # bright green, unlikely to appear in the character

    corners = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]
    for x, y in corners:
        ImageDraw.floodfill(work, (x, y), value=marker, thresh=tolerance)

    # Build alpha mask: marker (background) -> 0, everything else -> 255.
    pixels = work.load()
    alpha = Image.new("L", (width, height), 0)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r == 0 and g == 255 and b == 0 and a == 255:
                alpha_pixels[x, y] = 0
            else:
                alpha_pixels[x, y] = 255

    # Apply the new alpha channel.
    r, g, b, _ = img.split()
    img = Image.merge("RGBA", (r, g, b, alpha))

    # Crop transparent borders to keep the sprite tight.
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.save(output_path, "PNG")
    print(f"Saved {output_path}")


if __name__ == "__main__":
    base_dir = os.path.join(os.path.dirname(__file__), "..", "public", "image", "mascot")
    names = ["saku-chan-climb", "saku-chan-hang", "saku-chan-peek", "saku-chan-sleep", "saku-chan-dance"]

    for name in names:
        jpg = os.path.join(base_dir, f"{name}.jpg")
        png = os.path.join(base_dir, f"{name}.png")
        if os.path.exists(jpg):
            make_background_transparent(jpg, png)
        else:
            print(f"Missing {jpg}")
