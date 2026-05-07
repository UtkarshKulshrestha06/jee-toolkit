import json
import os
import re

SCRAPED_FILE = "public/iiit_participating_institutes.json"
MANUAL_FILE = "excel/josaa/iiit_manual_data.json"

def slugify(name):
    """Create a simple slug for matching."""
    if not name: return ""
    return re.sub(r'[^a-z0-9]', '', name.lower())

def get_city(name):
    """Extract last word (usually city) or specific known city."""
    name = name.replace(",", " ").replace("-", " ")
    words = name.split()
    if not words: return ""
    # Tricky ones
    if "sri city" in name.lower(): return "sricity"
    if "naya raipur" in name.lower(): return "nayaraipur"
    return words[-1].lower()

def merge():
    if not os.path.exists(SCRAPED_FILE):
        print(f"Error: {SCRAPED_FILE} not found.")
        return
    if not os.path.exists(MANUAL_FILE):
        print(f"Error: {MANUAL_FILE} not found.")
        return

    with open(SCRAPED_FILE, "r", encoding="utf-8") as f:
        scraped_data = json.load(f)
    with open(MANUAL_FILE, "r", encoding="utf-8") as f:
        manual_data = json.load(f)

    merged_ids = set()
    new_entries = []

    for manual_entry in manual_data:
        m_name = manual_entry["institute_name"]
        m_short = manual_entry["short_name"]
        m_slug = slugify(m_name)
        m_short_slug = slugify(m_short)
        m_city = get_city(m_name)

        best_match = None
        
        # 1. Exact Name/Short Match
        for s_entry in scraped_data:
            if s_entry["institute_name"] == m_name or s_entry["short_name"] == m_short:
                best_match = s_entry
                break
        
        # 2. Slug Match
        if not best_match:
            for s_entry in scraped_data:
                s_slug = slugify(s_entry["institute_name"])
                s_short_slug = slugify(s_entry["short_name"])
                if m_slug == s_slug or m_short_slug == s_short_slug:
                    best_match = s_entry
                    break
        
        # 3. City Match (last resort for IIITs since most are named by city)
        if not best_match:
            for s_entry in scraped_data:
                s_city = get_city(s_entry["institute_name"])
                # Compare cities (handling Trichy/Tiruchirapalli)
                if m_city == s_city or \
                   (m_city == "tiruchirappalli" and s_city == "tiruchirapalli") or \
                   (m_city == "tiruchirapalli" and s_city == "tiruchirappalli"):
                    best_match = s_entry
                    break

        if best_match:
            # Check if this match was already taken (to avoid IIITD -> Jabalpur issue)
            # Actually, just avoid matching if the short name is too different unless city matches
            print(f"Merging: '{m_short}' -> '{best_match['short_name']}'")
            
            # Update fields
            best_match["campus_area"] = manual_entry.get("campus_area", best_match.get("campus_area", ""))
            best_match["location"] = manual_entry.get("location", best_match.get("location", ""))
            best_match["description"] = manual_entry.get("description", best_match.get("description", ""))
            best_match["highlights"] = manual_entry.get("highlights", best_match.get("highlights", []))
            best_match["rankings"] = manual_entry.get("rankings", best_match.get("rankings", {}))
            best_match["fee_structure"] = manual_entry.get("fee_structure", best_match.get("fee_structure", {}))
            
            # Update short name if manual one is better/more standard
            best_match["short_name"] = m_short
            best_match["college_type"] = "IIIT" # Ensure type
            
            merged_ids.add(best_match["institute_id"])
        else:
            print(f"Adding new entry: {m_name} ({m_short})")
            # Create a new entry for non-JoSAA IIITs
            new_id = slugify(m_short).replace("iiit", "iiit-")
            if not new_id.startswith("iiit-"): new_id = "iiit-" + new_id
            
            new_entry = {
                "institute_id": new_id,
                "institute_name": m_name,
                "short_name": m_short,
                "college_type": "IIIT",
                "establishment_year": None,
                "state": manual_entry["location"].split(",")[-2].strip() if "," in manual_entry["location"] else "",
                "campus_area": manual_entry.get("campus_area", ""),
                "location": manual_entry.get("location", ""),
                "description": manual_entry.get("description", ""),
                "highlights": manual_entry.get("highlights", []),
                "rankings": manual_entry.get("rankings", {}),
                "fee_structure": manual_entry.get("fee_structure", {}),
                "placements": {},
                "media": {"logo_url": ""}
            }
            new_entries.append(new_entry)

    # Final list: merged scraped data + new entries
    final_data = scraped_data + new_entries
    
    with open(SCRAPED_FILE, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)

    print(f"\nSuccessfully merged {len(merged_ids)} entries and added {len(new_entries)} new entries.")

if __name__ == "__main__":
    merge()
