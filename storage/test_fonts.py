import os
from PIL import Image, ImageDraw, ImageFont

fonts = [
    'C:/Windows/Fonts/segoeui.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/consola.ttf',
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/arialbd.ttf'
]
for f in fonts:
    print(f, os.path.exists(f))

