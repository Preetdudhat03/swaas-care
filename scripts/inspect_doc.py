import docx, re

doc = docx.Document(r'C:\Users\preet\.gemini\antigravity\brain\8d8a53d1-f9e5-4d6e-b1c6-971db2c0b9e6\.user_uploaded\media_1794633188396_bfaf5d8e.docx')

print("=== PARAGRAPHS WITH IMAGES ===")
for idx, p in enumerate(doc.paragraphs):
    xml = p._p.xml
    m = re.findall(r'r:(?:embed|id)="([^"]+)"', xml)
    if m:
        print(f"P{idx}: {m} - text: {repr(p.text[:40])}")

print("\n=== TABLES WITH IMAGES ===")
for tidx, tbl in enumerate(doc.tables):
    xml = tbl._tbl.xml
    m = re.findall(r'r:(?:embed|id)="([^"]+)"', xml)
    if m:
        print(f"Table {tidx}: {m} - text: {repr(tbl.rows[0].cells[0].text[:40])}")
