import docx

doc = docx.Document(r'C:\Users\preet\.gemini\antigravity\brain\8d8a53d1-f9e5-4d6e-b1c6-971db2c0b9e6\.user_uploaded\media_1794633188396_bfaf5d8e.docx')

with open(r'P:\pro\swaas-care\scripts\doc_dump.txt', 'w', encoding='utf-8') as f:
    f.write(f"TOTAL PARAGRAPHS: {len(doc.paragraphs)}\n")
    f.write(f"TOTAL TABLES: {len(doc.tables)}\n\n")
    
    for i, p in enumerate(doc.paragraphs):
        runs_info = []
        for r in p.runs:
            runs_info.append(f"['{r.text}', bold={r.bold}, italic={r.italic}, font={r.font.name}, size={r.font.size.pt if r.font.size else None}]")
        f.write(f"P{i} [align={p.alignment}, style={p.style.name}]: {p.text}\n")
        if runs_info:
            f.write(f"   Runs: {' | '.join(runs_info)}\n")
            
    f.write("\n\n=== TABLES DUMP ===\n")
    for t_idx, tbl in enumerate(doc.tables):
        f.write(f"\n--- TABLE {t_idx} ({len(tbl.rows)} rows x {len(tbl.columns)} cols) ---\n")
        for r_idx, row in enumerate(tbl.rows):
            cell_texts = [c.text.strip().replace('\n', ' ') for c in row.cells]
            f.write(f"  Row {r_idx}: {' | '.join(cell_texts)}\n")

print("Dump completed.")
