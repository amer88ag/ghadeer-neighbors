from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')
for src in ('enhancements.js?v=20260928','quran-enhancement.js?v=20260928'):
    if src not in text:
        text = text.replace('</body>', f'<script src="{src}"></script>\n</body>')
text = text.replace('app.js?v=e1032958', 'app.js?v=20260928')
index.write_text(text, encoding='utf-8')
