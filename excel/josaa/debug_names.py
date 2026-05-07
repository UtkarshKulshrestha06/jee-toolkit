import json
d = json.load(open('public/iiit_participating_institutes.json', encoding='utf-8'))
for c in d:
    print(f"{c['institute_id']}: '{c['institute_name']}' / '{c['short_name']}'")
