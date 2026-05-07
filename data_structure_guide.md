# JEE Toolkit - Data Structure Guide

This guide explains the data format required by the JEE Toolkit web application for adding new cutoff data (for different rounds, years, and counsellings).

## The Core Concept
The application dynamically derives filters (branches, quotas, seat types) and displays data purely based on the JSON files placed in the `public/` directory.

To ensure the predictor and cutoff search pages work correctly, any new JSON file must strictly follow the schema defined below.

## JSON Schema Structure

Each JSON file (e.g., `nit_24_jr6.json` for JoSAA 2024 Round 6) must have a root object containing two main keys: `meta` and `colleges`.

### 1. `meta` Object
This contains the summary information for the entire file.

```json
"meta": {
  "source": "2025_R1.xlsx",               // Original source file (informational)
  "counselling": "JoSAA",                 // The counselling body (e.g., JoSAA, CSAB)
  "year": 2025,                           // The year of counselling
  "round": 1,                             // The round number
  "type": "NIT",                          // College type (e.g., NIT, IIT, IIIT, GFTI)
  "totalEntries": 6500,                   // Total number of branch cutoff records
  "totalColleges": 32                     // Total number of colleges in this file
}
```

### 2. `colleges` Array
This is an array of objects. Each object represents a single college and contains its corresponding cutoff entries.

```json
"colleges": [
  {
    "id": 1,                              // Unique integer ID for the college
    "name": "National Institute of Technology, Trichy", // Full name of the college
    "entries": [                          // Array of all cutoffs for this college
      {
        "program": "Computer Science and Engineering (4 Years, Bachelor of Technology)",
        "quota": "OS",                    // e.g., OS (Other State), HS (Home State), AI (All India)
        "seatType": "OPEN",               // e.g., OPEN, EWS, OBC-NCL, SC, ST
        "gender": "Gender-Neutral",       // e.g., Gender-Neutral, Female-only (including Supernumerary)
        "openingRank": 1500,              // Must be an integer
        "closingRank": 2500               // Must be an integer
      },
      // ... more branch entries for this college
    ]
  },
  // ... more colleges
]
```

## How to Create More Data Files

If you have raw data in Excel or CSV format from JoSAA or CSAB, you need to write a script (e.g., in Python or Node.js) to parse the rows and group them by college.

### Grouping Logic for your Script:
1. Initialize an empty dictionary/map of colleges.
2. Loop through every row in your Excel/CSV file.
3. For each row:
   - Extract the college name.
   - If the college is not in your dictionary, add it and assign a unique ID.
   - Append the current row's cutoff data (program, quota, category, etc.) into the `entries` array of that college.
4. Once all rows are processed, format the dictionary into the required JSON array.
5. Add the `meta` header object.
6. Export as a `.json` file and place it in the `public/` directory.

### Loading it in the App
Currently, the app might be fetching a hardcoded path in its components (like `fetch('/nit_25_jr1.json')`). Once you generate new JSON files, you can update your React components (e.g., inside `src/Predictor.tsx` or `src/CutoffSearch.tsx`) to fetch these new files or provide a dropdown for the user to select the year/round!

---

## College Details Data Structure

The application uses another set of data to populate college profile pages, which includes placements, fees, and highlights. 

Previously, this data was a flat array with fields like `institute_name`, `nirf_ranking_engineering`, `nirf_ranking_overall`, `average_package_lpa`, `highest_package_lpa`, and `logo_base64`. 

To support the rich UI features (branch-wise placements, fee structures, maps, etc.), the structure has been expanded into a comprehensive nested object.

### The New College Details Schema

When creating JSON files for college details (e.g., `nit_participating_institutes.json`), each college should be represented as an object with the following structure:

```json
{
  "institute_id": "nit-trichy",           // Unique identifier for URL routing or relationships
  "institute_name": "National Institute of Technology Tiruchirappalli", // Required (Legacy)
  "short_name": "NIT Trichy",             // E.g., NIT-T, NITW
  "college_type": "NIT",                  // E.g., IIT, NIT, IIIT, GFTI
  "establishment_year": 1964,             
  "campus_area": "800 Acres",
  "state": "Tamil Nadu",
  
  "location": "https://maps.app.goo.gl/...",
  
  "description": "National Institute of Technology Tiruchirappalli is a public technical and research university...",
  
  "highlights": [
    "Ranked #9 in Engineering by NIRF 2023",
    "Highest package of 52.89 LPA in 2023",
    "Rich alumni network spanning across the globe",
    "Excellent placement record with top tech giants"
  ],
  
  "rankings": {
    "nirf_engineering": 9,                // Replaces legacy nirf_ranking_engineering
    "nirf_overall": 31                    // Replaces legacy nirf_ranking_overall
  },
  
  "fee_structure": {
    "tuition_fee_per_semester": 62500,
    "overall_rough_estimate_4_years": 800000 
  },
  
  "placements": {
    "overall": {
      "2023": {
        "average_package_lpa": 15.7,      // Replaces legacy average_package_lpa
        "median_package_lpa": 12.0,
        "highest_package_lpa": 52.89,     // Replaces legacy highest_package_lpa
        "placement_ratio_percentage": 92.5
      },
      "2022": {
        "average_package_lpa": 14.5,
        "median_package_lpa": 11.5,
        "highest_package_lpa": 45.0,
        "placement_ratio_percentage": 90.0
      }
    },
    "branch_wise": {
      "2023": [
        {
          "branch_name": "Computer Science and Engineering",
          "average_package_lpa": 27.5,
          "median_package_lpa": 25.0,
          "highest_package_lpa": 52.89,
          "placement_ratio_percentage": 100
        },
        {
          "branch_name": "Electronics and Communication Engineering",
          "average_package_lpa": 20.1,
          "median_package_lpa": 18.0,
          "highest_package_lpa": 40.0,
          "placement_ratio_percentage": 95
        }
      ]
    }
  },
  
  "media": {
    "logo_url": "https://example.com/logo.png" // Replaces legacy logo_base64
  }
}
```

### Cross-Verification with Existing Data
The old fields map to the new fields seamlessly:
1. `institute_name` -> remains `institute_name`
2. `nirf_ranking_engineering` -> moved to `rankings.nirf_engineering`
3. `nirf_ranking_overall` -> moved to `rankings.nirf_overall`
4. `average_package_lpa` -> moved to `placements.overall["YYYY"].average_package_lpa`
5. `highest_package_lpa` -> moved to `placements.overall["YYYY"].highest_package_lpa`
6. `logo_base64` -> changed to a simple URL in `media.logo_url`

This strong structure ensures that your future Python/Node scraper scripts have a consistent schema to fill, covering placements across multiple years and branches, as well as descriptive data required for beautiful UI rendering.
