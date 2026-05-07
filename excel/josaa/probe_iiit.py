"""Probe script to inspect IIIT page structure on collegepravesh.com"""
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

url = "https://www.collegepravesh.com/engineering-colleges/iiit-delhi/"
r = requests.get(url, headers=HEADERS, timeout=15)
soup = BeautifulSoup(r.text, "html.parser")

tables = soup.find_all("table")
out = [f"Total tables: {len(tables)}", ""]

for i, t in enumerate(tables):
    prev_h = t.find_previous(["h1", "h2", "h3", "h4"])
    h_text = (prev_h.get_text(strip=True) if prev_h else "(none)")[:70]
    first_cells = [td.get_text(strip=True)[:30] for td in t.find_all(["th", "td"])[:8]]
    out.append(f"T{i}: heading={h_text!r}")
    out.append(f"     cols  ={first_cells}")

out.append("")
out.append("=== H2/H3 headings ===")
for h in soup.find_all(["h2", "h3"]):
    txt = h.get_text(strip=True)
    if txt:
        out.append(f"  {h.name}: {txt[:90]}")

out.append("")
out.append("=== Logo images ===")
for img in soup.find_all("img"):
    src = img.get("src", "")
    alt = img.get("alt", "")
    if "logo" in alt.lower() or "logo" in src.lower():
        out.append(f"  alt={alt!r} | src={src}")

result = "\n".join(out)
with open("iiit_probe.txt", "w", encoding="utf-8") as f:
    f.write(result)

print("Probe written to iiit_probe.txt")
print(result[:2000])
