import os
from PIL import Image

def generate_icons():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_icon = os.path.join(base_dir, 'resources', 'icon.png')
    
    if not os.path.exists(src_icon):
        raise FileNotFoundError(f"Source icon not found at {src_icon}")

    img = Image.open(src_icon)
    sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
    
    targets = [
        os.path.join(base_dir, 'build', 'icons'),
        os.path.join(base_dir, 'resources', 'icons')
    ]

    for target_dir in targets:
        os.makedirs(target_dir, exist_ok=True)
        for s in sizes:
            resized = img.resize((s, s), Image.Resampling.LANCZOS)
            out_file = os.path.join(target_dir, f'{s}x{s}.png')
            resized.save(out_file, 'PNG')
            print(f"Generated: {out_file}")

    print("All icon resolutions generated successfully.")

if __name__ == '__main__':
    generate_icons()
