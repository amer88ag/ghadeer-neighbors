from pathlib import Path

# Vercel static build hook: attach the enhancement bundle without rewriting the main application source.
index = Path('index.html')
text = index.read_text(encoding='utf-8')
marker = 'enhancements.js?v=20260928'
if marker not in text:
    text = text.replace('</body>', '<script src="enhancements.js?v=20260928"></script>\n</body>')
    index.write_text(text, encoding='utf-8')

# Keep a cache-busted application reference when present.
text = index.read_text(encoding='utf-8')
text = text.replace('app.js?v=e1032958', 'app.js?v=20260928')
index.write_text(text, encoding='utf-8')
