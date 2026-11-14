import os
import shutil
import zipfile
import docx

SRC_DOCX = r"C:\Users\preet\.gemini\antigravity\brain\8d8a53d1-f9e5-4d6e-b1c6-971db2c0b9e6\.user_uploaded\media_1794633188396_bfaf5d8e.docx"
FIG_DIR = r"P:\pro\swaas-care\scripts\figures_out"
OUTPUT_DIR = r"P:\pro\swaas-care"

STUDENTS = [
    {
        "name": "Preet Dudhat",
        "roll": "BAD04",
        "filename": "SwaasCare_Mini_Project_Report_Preet_Dudhat_BAD04.docx"
    },
    {
        "name": "Jay Mehta",
        "roll": "BAD03",
        "filename": "SwaasCare_Mini_Project_Report_Jay_Mehta_BAD03.docx"
    },
    {
        "name": "Ved Walunj",
        "roll": "BAD05",
        "filename": "SwaasCare_Mini_Project_Report_Ved_Walunj_BAD05.docx"
    }
]

def update_zip_images(docx_path):
    """Replaces images in the docx zip with generated SwaasCare figures (image2..image15), keeping image1 intact."""
    temp_zip = docx_path + ".temp"
    with zipfile.ZipFile(docx_path, 'r') as zin, zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            fname = item.filename
            if fname.startswith("word/media/image") and not fname.endswith("image1.jpeg"):
                base_name = os.path.basename(fname)
                new_fig = os.path.join(FIG_DIR, base_name)
                if os.path.exists(new_fig):
                    with open(new_fig, 'rb') as f:
                        zout.writestr(item, f.read())
                    continue
            zout.writestr(item, zin.read(fname))
    os.remove(docx_path)
    os.rename(temp_zip, docx_path)

def set_para_text(p, text):
    """Sets paragraph text while preserving style and run properties of the first run."""
    if not p.runs:
        p.text = text
        return
    r0 = p.runs[0]
    font_name = r0.font.name
    font_size = r0.font.size
    bold = r0.bold
    italic = r0.italic
    
    # remove all runs except first
    for r in p.runs[1:]:
        p._p.remove(r._r)
        
    r0.text = text
    r0.font.name = font_name
    r0.font.size = font_size
    r0.bold = bold
    r0.italic = italic

print("Helper functions ready.")
