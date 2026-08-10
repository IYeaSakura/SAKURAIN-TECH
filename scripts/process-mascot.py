from PIL import Image


def remove_white_background(input_path: str, output_path: str, max_size: int = 128) -> None:
    """Remove near-white background and resize mascot image for web use."""
    img = Image.open(input_path).convert('RGBA')
    width, height = img.size

    threshold = 245
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r > threshold and g > threshold and b > threshold:
                pixels[x, y] = (255, 255, 255, 0)

    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    img.save(output_path)
    print(f"Saved {output_path}: {img.size}")


if __name__ == '__main__':
    remove_white_background(
        'public/image/mascot/concept-v3.jpg',
        'public/image/mascot/saku-chan.png',
    )
