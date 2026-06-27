// Auto-generated demo data (mirrors db/schema.sql). Used only in demo mode.
export const SEED = [
  {
    "slug": "cardiology",
    "title": "Cardiology",
    "subtitle": "Anatomy & physiology, ischemia, arrhythmias, murmurs, heart failure, congenital disease, hypertension and more.",
    "category": "systems",
    "status": "published",
    "order_index": 7,
    "sections": [
      {
        "numeral": "I",
        "title": "Anatomy & Physiology",
        "order_index": 0,
        "lessons": [
          {
            "title": "Cardiac Anatomy",
            "slug": "cardiac-anatomy",
            "lenses": [
              "anatomy"
            ],
            "state": "done",
            "order_index": 0
          },
          {
            "title": "Cardiac Physiology",
            "slug": "cardiac-physiology",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 1
          },
          {
            "title": "CV Response to Exercise",
            "slug": "cv-response-to-exercise",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 2
          },
          {
            "title": "Blood Flow Mechanics",
            "slug": "blood-flow-mechanics",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 3
          },
          {
            "title": "Regulation of Blood Pressure",
            "slug": "regulation-of-blood-pressure",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 4
          },
          {
            "title": "Pressure-Volume (PV) Loops",
            "slug": "pv-loops",
            "lenses": [
              "physio",
              "patho"
            ],
            "state": "done",
            "order_index": 5
          },
          {
            "title": "Wiggers' Diagram",
            "slug": "wiggers-diagram",
            "lenses": [
              "physio"
            ],
            "state": "prog",
            "order_index": 6
          },
          {
            "title": "Venous Pressure Tracings",
            "slug": "venous-pressure-tracings",
            "lenses": [
              "physio"
            ],
            "state": "new",
            "order_index": 7
          },
          {
            "title": "Starling Curve",
            "slug": "starling-curve",
            "lenses": [
              "physio"
            ],
            "state": "new",
            "order_index": 8
          }
        ]
      },
      {
        "numeral": "II",
        "title": "Ischemic Heart Disease",
        "order_index": 1,
        "lessons": [
          {
            "title": "Cardiac Ischemia",
            "slug": "cardiac-ischemia",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "done",
            "order_index": 0
          },
          {
            "title": "STEMI",
            "slug": "stemi",
            "lenses": [
              "patho",
              "pharm"
            ],
            "state": "done",
            "order_index": 1
          },
          {
            "title": "Unstable Angina / NSTEMI",
            "slug": "unstable-angina-nstemi",
            "lenses": [
              "patho"
            ],
            "state": "prog",
            "order_index": 2
          },
          {
            "title": "Stable Angina",
            "slug": "stable-angina",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 3
          }
        ]
      },
      {
        "numeral": "III",
        "title": "Arrhythmias & EKG",
        "order_index": 2,
        "lessons": [
          {
            "title": "EKG Basics",
            "slug": "ekg-basics",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 0
          },
          {
            "title": "High-Yield EKGs",
            "slug": "high-yield-ekgs",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "prog",
            "order_index": 1
          },
          {
            "title": "Action Potentials",
            "slug": "action-potentials",
            "lenses": [
              "physio",
              "pharm"
            ],
            "state": "done",
            "order_index": 2
          },
          {
            "title": "AV & Bundle Branch Blocks",
            "slug": "av-and-bundle-branch-blocks",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "new",
            "order_index": 3
          },
          {
            "title": "Atrial Fibrillation",
            "slug": "atrial-fibrillation",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 4
          },
          {
            "title": "AVNRT",
            "slug": "avnrt",
            "lenses": [
              "physio",
              "patho"
            ],
            "state": "new",
            "order_index": 5
          },
          {
            "title": "WPW (Wolff-Parkinson-White)",
            "slug": "wpw-wolff-parkinson-white",
            "lenses": [
              "physio",
              "patho"
            ],
            "state": "new",
            "order_index": 6
          },
          {
            "title": "Antiarrhythmic Drugs",
            "slug": "antiarrhythmic-drugs",
            "lenses": [
              "pharm"
            ],
            "state": "new",
            "order_index": 7
          }
        ]
      },
      {
        "numeral": "IV",
        "title": "Heart Sounds & Murmurs",
        "order_index": 3,
        "lessons": [
          {
            "title": "Heart Sounds",
            "slug": "heart-sounds",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 0
          },
          {
            "title": "Heart Murmurs",
            "slug": "heart-murmurs",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "prog",
            "order_index": 1
          }
        ]
      },
      {
        "numeral": "V",
        "title": "Heart Failure",
        "order_index": 4,
        "lessons": [
          {
            "title": "Heart Failure Basics",
            "slug": "heart-failure-basics",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Systolic & Diastolic Heart Failure",
            "slug": "systolic-and-diastolic-heart-failure",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "new",
            "order_index": 1
          },
          {
            "title": "Restrictive Cardiomyopathy",
            "slug": "restrictive-cardiomyopathy",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 2
          },
          {
            "title": "Acute Heart Failure",
            "slug": "acute-heart-failure",
            "lenses": [
              "patho",
              "pharm"
            ],
            "state": "new",
            "order_index": 3
          },
          {
            "title": "Chronic Heart Failure",
            "slug": "chronic-heart-failure",
            "lenses": [
              "patho",
              "pharm"
            ],
            "state": "new",
            "order_index": 4
          }
        ]
      },
      {
        "numeral": "VI",
        "title": "Congenital Heart Disease",
        "order_index": 5,
        "lessons": [
          {
            "title": "Cardiac Embryology",
            "slug": "cardiac-embryology",
            "lenses": [
              "embryo"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Shunts",
            "slug": "shunts",
            "lenses": [
              "embryo",
              "patho"
            ],
            "state": "new",
            "order_index": 1
          },
          {
            "title": "Cyanotic Congenital Heart Disease",
            "slug": "cyanotic-congenital-heart-disease",
            "lenses": [
              "embryo",
              "patho"
            ],
            "state": "new",
            "order_index": 2
          },
          {
            "title": "Coarctation of the Aorta",
            "slug": "coarctation-of-the-aorta",
            "lenses": [
              "embryo",
              "anatomy"
            ],
            "state": "new",
            "order_index": 3
          }
        ]
      },
      {
        "numeral": "VII",
        "title": "Hypertension",
        "order_index": 6,
        "lessons": [
          {
            "title": "Hypertension",
            "slug": "hypertension",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Secondary Hypertension",
            "slug": "secondary-hypertension",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 1
          },
          {
            "title": "Hypertension Drugs",
            "slug": "hypertension-drugs",
            "lenses": [
              "pharm"
            ],
            "state": "new",
            "order_index": 2
          }
        ]
      },
      {
        "numeral": "VIII",
        "title": "Other Cardiac Disease",
        "order_index": 7,
        "lessons": [
          {
            "title": "Valve Disease",
            "slug": "valve-disease",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Shock",
            "slug": "shock",
            "lenses": [
              "physio",
              "patho"
            ],
            "state": "new",
            "order_index": 1
          },
          {
            "title": "Pericardial Disease",
            "slug": "pericardial-disease",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 2
          },
          {
            "title": "Aortic Dissection",
            "slug": "aortic-dissection",
            "lenses": [
              "patho",
              "anatomy"
            ],
            "state": "new",
            "order_index": 3
          },
          {
            "title": "Cardiac Tumors",
            "slug": "cardiac-tumors",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 4
          },
          {
            "title": "Hypertrophic Cardiomyopathy",
            "slug": "hypertrophic-cardiomyopathy",
            "lenses": [
              "patho"
            ],
            "state": "new",
            "order_index": 5
          },
          {
            "title": "Endocarditis",
            "slug": "endocarditis",
            "lenses": [
              "patho",
              "micro"
            ],
            "state": "new",
            "order_index": 6
          }
        ]
      }
    ]
  },
  {
    "slug": "respiratory",
    "title": "Respiratory",
    "subtitle": "Lung volumes, V/Q matching, obstructive vs restrictive disease, and control of breathing.",
    "category": "systems",
    "status": "published",
    "order_index": 8,
    "sections": [
      {
        "numeral": "I",
        "title": "Lung Volumes & Mechanics",
        "order_index": 0,
        "lessons": [
          {
            "title": "Lung Volumes & Capacities",
            "slug": "lung-volumes-and-capacities",
            "lenses": [
              "physio"
            ],
            "state": "done",
            "order_index": 0
          },
          {
            "title": "Spirometry",
            "slug": "spirometry",
            "lenses": [
              "physio"
            ],
            "state": "prog",
            "order_index": 1
          },
          {
            "title": "Compliance & Elastance",
            "slug": "compliance-and-elastance",
            "lenses": [
              "physio"
            ],
            "state": "new",
            "order_index": 2
          }
        ]
      },
      {
        "numeral": "II",
        "title": "Gas Exchange",
        "order_index": 1,
        "lessons": [
          {
            "title": "V/Q Matching",
            "slug": "v-q-matching",
            "lenses": [
              "physio"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Oxygen & CO\u2082 Transport",
            "slug": "oxygen-and-co-transport",
            "lenses": [
              "physio",
              "biochem"
            ],
            "state": "new",
            "order_index": 1
          }
        ]
      },
      {
        "numeral": "III",
        "title": "Obstructive & Restrictive Disease",
        "order_index": 2,
        "lessons": [
          {
            "title": "Obstructive vs Restrictive",
            "slug": "obstructive-vs-restrictive",
            "lenses": [
              "patho",
              "physio"
            ],
            "state": "new",
            "order_index": 0
          },
          {
            "title": "Asthma & COPD",
            "slug": "asthma-and-copd",
            "lenses": [
              "patho",
              "pharm"
            ],
            "state": "new",
            "order_index": 1
          }
        ]
      },
      {
        "numeral": "IV",
        "title": "Development",
        "order_index": 3,
        "lessons": [
          {
            "title": "Lung Development & Surfactant",
            "slug": "lung-development-and-surfactant",
            "lenses": [
              "embryo"
            ],
            "state": "new",
            "order_index": 0
          }
        ]
      }
    ]
  },
  {
    "slug": "biochemistry",
    "title": "Biochemistry",
    "subtitle": "Metabolism, enzymes, molecular biology, and the vitamins that keep showing up in vignettes.",
    "category": "foundations",
    "status": "draft",
    "order_index": 1,
    "sections": []
  },
  {
    "slug": "genetics",
    "title": "Genetics",
    "subtitle": "Inheritance patterns, trinucleotide repeats, imprinting, and population genetics.",
    "category": "foundations",
    "status": "draft",
    "order_index": 2,
    "sections": []
  }
];
