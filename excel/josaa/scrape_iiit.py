"""
scrape_iiit.py
Scrapes IIIT college data from collegepravesh.com and appends/updates
it into public/scraped_colleges.json in the jee-toolkit project.

Usage:
    # Single college
    python excel/josaa/scrape_iiit.py https://www.collegepravesh.com/engineering-colleges/iiit-delhi/

    # Bulk (all URLs from a list file)
    python excel/josaa/scrape_iiit.py --bulk excel/josaa/iiit_urls.txt

Run from the project root:  d:\\CODE\\Antigravity Stuff\\jee-toolkit\\
"""

import sys
import json
import re
import os
import time
import requests
from bs4 import BeautifulSoup

OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "public", "iiit_participating_institutes.json"
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def clean_float(val: str):
    """Strip % signs and parse as float. Returns None on failure."""
    if not val:
        return None
    val = val.replace("%", "").replace(",", "").strip()
    try:
        return float(val)
    except ValueError:
        return None


def detect_stat_col(header: str):
    """Map a column header text to our internal stat key."""
    h = header.lower()
    if "placed" in h or "placement" in h:
        return "placement_ratio_percentage"
    if "median" in h:
        return "median_package_lpa"
    if "max" in h or "highest" in h:
        return "highest_package_lpa"
    if "avg" in h or "average" in h:
        return "average_package_lpa"
    return None


def scrape_iiit(url: str) -> dict | None:
    """Fetch and parse one IIIT college page. Returns the data dict or None."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=20)
    except Exception as exc:
        print(f"  [ERROR] Request failed for {url}: {exc}")
        return None

    if response.status_code != 200:
        print(f"  [ERROR] HTTP {response.status_code} for {url}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    slug = url.strip("/").split("/")[-1]

    data = {
        "institute_id": slug,
        "institute_name": "",
        "short_name": "",
        "college_type": "IIIT",
        "establishment_year": None,
        "state": "",
        "placements": {
            "overall": {},
            "branch_wise": {},
        },
        "media": {},
    }

    # ── 1. Basic Info Table (T0) ──────────────────────────────────────────────
    tables = soup.find_all("table")
    if tables:
        for row in tables[0].find_all("tr"):
            cols = [c.get_text(strip=True) for c in row.find_all(["th", "td"])]
            # Each row can have 2 or 4 cells (key, val, key, val)
            pairs = []
            if len(cols) >= 2:
                pairs.append((cols[0], cols[1]))
            if len(cols) >= 4:
                pairs.append((cols[2], cols[3]))

            for key, val in pairs:
                key = key.replace(":", "").strip()
                if "Institute Name" in key:
                    data["institute_name"] = val
                elif "Also Known As" in key:
                    data["short_name"] = val
                elif "Established" in key:
                    m = re.search(r"\d{4}", val)
                    if m:
                        data["establishment_year"] = int(m.group())
                elif "Location" in key:
                    # Last comma-separated part is usually the state
                    parts = [p.strip() for p in val.split(",")]
                    if len(parts) > 1:
                        data["state"] = parts[-1]
                    else:
                        data["state"] = val

    # ── 2. Placement Tables ───────────────────────────────────────────────────
    #
    # Structure on the page (IIIT Delhi example):
    #   Tables before first year h3  → "Latest" data
    #   h3: "2024"  → next tables are 2024 data
    #   h3: "2023"  → next tables are 2023 data
    #   ...
    #
    # Each year has up to 4 tables, one per stat (Placed%, Median, Max, Avg).
    # Rows are branch-wise (no explicit "Overall" row); we compute overall
    # from branch values weighted equally (simple mean, stored as approximate).

    YEAR_PATTERN = re.compile(r"^20\d{2}$")

    # Walk through the DOM sequentially to track year context
    current_year = "Latest"

    for element in soup.find_all(["h3", "table"]):
        if element.name == "h3":
            txt = element.get_text(strip=True)
            if YEAR_PATTERN.match(txt):
                current_year = txt
            continue

        # It's a <table>
        tbl_headers = [th.get_text(strip=True) for th in element.find_all(["th", "td"])[:3]]
        if len(tbl_headers) < 2:
            continue
        if tbl_headers[0].lower() != "branch":
            continue  # Not a placement table

        stat_key = detect_stat_col(tbl_headers[1])
        if not stat_key:
            continue

        # Ensure year keys exist
        if current_year not in data["placements"]["overall"]:
            data["placements"]["overall"][current_year] = {}
        if current_year not in data["placements"]["branch_wise"]:
            data["placements"]["branch_wise"][current_year] = []

        branch_list = data["placements"]["branch_wise"][current_year]
        overall_vals = []

        for row in element.find_all("tr")[1:]:  # skip header row
            cells = [c.get_text(strip=True) for c in row.find_all(["th", "td"])]
            if len(cells) < 2:
                continue

            branch_name = cells[0].strip()
            raw_val = cells[1].strip()
            val = clean_float(raw_val)
            if val is None or not branch_name:
                continue

            # Check if it's an aggregate/overall row
            is_overall = any(
                kw in branch_name.lower()
                for kw in ["overall", "total", "all branch", "4-year b.", "b.tech (all"]
            )

            if is_overall:
                data["placements"]["overall"][current_year][stat_key] = val
            else:
                # Find or create the branch entry
                entry = next(
                    (b for b in branch_list if b["branch_name"] == branch_name), None
                )
                if entry is None:
                    entry = {"branch_name": branch_name}
                    branch_list.append(entry)
                entry[stat_key] = val
                overall_vals.append(val)

        # If no overall row found, compute approximate from branch means
        overall_dict = data["placements"]["overall"][current_year]
        if stat_key not in overall_dict and overall_vals:
            mean_val = round(sum(overall_vals) / len(overall_vals), 2)
            overall_dict[stat_key] = mean_val

    # ── 3. Logo ───────────────────────────────────────────────────────────────
    SKIP_ALTS = {"ranking", "index", "nirf", "outlook", "theweek", "the week",
                 "qs", "college pravesh", "india today"}

    for img in soup.find_all("img"):
        src = img.get("src", "")
        alt = img.get("alt", "")
        alt_lower = alt.lower()

        # Skip known non-college logos
        if any(skip in alt_lower for skip in SKIP_ALTS):
            continue
        if "Logo_Light" in src or "Logo_Small" in src:
            continue

        if "logo" in alt_lower or "logo" in src.lower():
            # Prefer hosted on img.collegepravesh.com
            if src.startswith("http"):
                data["media"]["logo_url"] = src
                break

    # ── 4. Post-process: prune empty year buckets ─────────────────────────────
    for year in list(data["placements"]["overall"].keys()):
        if not data["placements"]["overall"][year]:
            del data["placements"]["overall"][year]

    for year in list(data["placements"]["branch_wise"].keys()):
        if not data["placements"]["branch_wise"][year]:
            del data["placements"]["branch_wise"][year]

    return data


# ── Persistence ───────────────────────────────────────────────────────────────

def save(college_data: dict):
    """Append or update the college in the shared scraped_colleges.json."""
    out_path = os.path.abspath(OUTPUT_PATH)
    all_data = []

    if os.path.exists(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                all_data = json.load(f)
        except Exception:
            pass

    existing_idx = next(
        (i for i, d in enumerate(all_data)
         if d.get("institute_id") == college_data["institute_id"]),
        None,
    )
    if existing_idx is not None:
        all_data[existing_idx] = college_data
        print(f"  [UPDATE] {college_data['institute_id']}")
    else:
        all_data.append(college_data)
        print(f"  [APPEND] {college_data['institute_id']}")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)


# ── Entry Point ───────────────────────────────────────────────────────────────

def run_single(url: str):
    print(f"Scraping: {url}")
    data = scrape_iiit(url)
    if data:
        save(data)
        # Pretty-print a snippet
        snippet = {
            "institute_id": data["institute_id"],
            "institute_name": data["institute_name"],
            "short_name": data["short_name"],
            "establishment_year": data["establishment_year"],
            "state": data["state"],
            "logo": data["media"].get("logo_url", ""),
            "placement_years": list(data["placements"]["overall"].keys()),
        }
        print(json.dumps(snippet, indent=2, ensure_ascii=False))
    else:
        print("  Failed.")


def run_bulk(list_file: str):
    with open(list_file, encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    print(f"Bulk scraping {len(urls)} colleges...")
    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}] {url}")
        data = scrape_iiit(url)
        if data:
            save(data)
        else:
            print("  Skipped (failed).")
        if i < len(urls):
            time.sleep(1.5)  # polite delay


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python excel/josaa/scrape_iiit.py <url>")
        print("  python excel/josaa/scrape_iiit.py --bulk excel/josaa/iiit_urls.txt")
        sys.exit(1)

    if sys.argv[1] == "--bulk":
        if len(sys.argv) < 3:
            print("Provide a URL list file after --bulk")
            sys.exit(1)
        run_bulk(sys.argv[2])
    else:
        run_single(sys.argv[1])
