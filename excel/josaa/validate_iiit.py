import json

with open("public/iiit_participating_institutes.json", encoding="utf-8") as f:
    data = json.load(f)

iiit = next(d for d in data if d["institute_id"] == "iiit-delhi")
print("Name:", iiit["institute_name"])
print("Short:", iiit["short_name"])
print("Est:", iiit["establishment_year"])
print("State:", iiit["state"])
print("Logo:", iiit["media"]["logo_url"])
print()
print("Overall placements:")
for yr, stats in iiit["placements"]["overall"].items():
    print(f"  {yr}: {stats}")
print()
print("Branch-wise Latest (first 3 branches):")
for b in iiit["placements"]["branch_wise"].get("Latest", [])[:3]:
    print(" ", b)
latest_branches = iiit["placements"]["branch_wise"].get("Latest", [])
print(f"Total branch entries (Latest): {len(latest_branches)}")
print()
print("Branch-wise 2024 (first 3):")
for b in iiit["placements"]["branch_wise"].get("2024", [])[:3]:
    print(" ", b)
