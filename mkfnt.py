from PIL import Image

img = Image.open('font-table.png')

cols = 16
rows_original = 8      # всего строк в исходной таблице
glyph_width = 6
glyph_height = 13
spacing_x = 27
spacing_y = 22
start_x = 11
start_y = 5

rows_result = rows_original - 2   # 6 строк в результате

result = Image.new('RGB', (cols * glyph_width, rows_result * glyph_height), color='white')

for r in range(rows_result):
    original_row = r + 2          # пропускаем строки 0 и 1
    for col in range(cols):
        left = start_x + col * spacing_x
        top = start_y + original_row * spacing_y
        right = left + glyph_width
        bottom = top + glyph_height
        glyph = img.crop((left, top, right, bottom))
        result.paste(glyph, (col * glyph_width, r * glyph_height))

result.save('font.png')
print(f"Готово! Размер результата: {cols * glyph_width} x {rows_result * glyph_height}")