import docx

doc = docx.Document(r'C:\Users\preet\.gemini\antigravity\brain\8d8a53d1-f9e5-4d6e-b1c6-971db2c0b9e6\.user_uploaded\media_1794633188396_bfaf5d8e.docx')

with open(r'P:\pro\swaas-care\scripts\all_paragraphs.txt', 'w', encoding='utf-8') as f:
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if text:
            f.write(f"[{i:03d}] {repr(text)}\n")

print("Exported all paragraphs.")
