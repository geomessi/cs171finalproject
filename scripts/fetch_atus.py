"""Rebuild data/atus.json from the BLS American Time Use Survey time series.

Usage:
    BLS_CONTACT=you@college.harvard.edu python3 scripts/fetch_atus.py

BLS rejects anonymous scripted downloads, so the request identifies itself
with the contact email in BLS_CONTACT. Files come from
https://download.bls.gov/pub/time.series/tu/ (tu.txt documents the layout).

Output: data/atus.json, values in MINUTES per day, one value per year
2003-2025 (null where BLS published nothing, e.g. 2020).

  act[age][day][activity]   activity series by age group
  par[parent][day][activity] same, by presence of own child under 18
  who["who|age|day"]         waking time by companion (starts 2010)

Codes: age 000 all, 103 15-24, 031 25-34, 038 35-44, 042 45-54, 049 55-64,
065 65+. day 00 all days, 19 nonholiday weekdays, 16 weekends/holidays.
parent 13 own child <18 at home, 01 none.
"""
import json, os, sys, urllib.request
from pathlib import Path

BASE = "https://download.bls.gov/pub/time.series/tu/"
YEARS = list(range(2003, 2026))
AGES = ["000", "103", "031", "038", "042", "049", "065"]
DAYS = ["00", "19", "16"]
PARENTS = ["01", "13"]
ACTS = ["600001", "600003", "600007", "600010", "600013", "600016", "600018",
        "600022", "600023", "600030", "600033", "600034",  # 12 groups that sum to 24h
        "600024", "600025"]  # socializing, TV (both inside 600023 leisure)
AWAKE = "600085"


def fetch(name):
    contact = os.environ.get("BLS_CONTACT")
    if not contact:
        sys.exit("Set BLS_CONTACT to your email so BLS accepts the request.")
    req = urllib.request.Request(BASE + name, headers={"User-Agent": f"CS171 student project ({contact})"})
    with urllib.request.urlopen(req) as r:
        return r.read().decode("latin-1")


def rows(text):
    lines = [l.rstrip("\r") for l in text.split("\n") if l.strip()]
    head = [h.strip() for h in lines[0].split("\t")]
    return [dict(zip(head, (c.strip() for c in l.split("\t")))) for l in lines[1:]]


def only(r, keep):
    """True if every demographic code is zero except the ones in keep."""
    skip = {"seasonal", "stattype_code", "actcode_code", "datays_code", *keep}
    return all(set(v) <= {"0"} for k, v in r.items() if k.endswith("_code") and k not in skip)


def main():
    want = {}
    for r in rows(fetch("tu.series")):
        if r["stattype_code"] != "10101" or r["datays_code"] != "01":
            continue  # average hours per day, single-year estimates only
        a = r["actcode_code"]
        if a in ACTS and only(r, ["age_code", "pertype_code"]) and r["age_code"] in AGES and r["pertype_code"] in DAYS:
            want[r["series_id"]] = ("act", r["age_code"], r["pertype_code"], a)
        elif a in ACTS and only(r, ["prownhhchild_code", "pertype_code"]) and r["prownhhchild_code"] in PARENTS and r["pertype_code"] in DAYS:
            want[r["series_id"]] = ("par", r["prownhhchild_code"], r["pertype_code"], a)
        elif a == AWAKE and only(r, ["age_code", "who_code", "pertype_code"]) and set(r["who_code"]) != {"0"}:
            want[r["series_id"]] = ("who", r["who_code"], r["age_code"], r["pertype_code"])

    out = {"years": YEARS, "act": {}, "par": {}, "who": {}}
    for line in fetch("tu.data.1.AllData").split("\n")[1:]:
        p = [c.strip() for c in line.split("\t")]
        if len(p) < 4 or p[0] not in want or p[2] != "A01":
            continue
        try:
            v = round(float(p[3]) * 60, 1)
        except ValueError:
            continue  # "S" suppressed, "Z" close to zero, "-" not published
        y = int(p[1])
        if y not in YEARS:
            continue
        kind, *k = want[p[0]]
        if kind == "who":
            arr = out["who"].setdefault("|".join(k), [None] * len(YEARS))
        else:
            arr = out[kind].setdefault(k[0], {}).setdefault(k[1], {}).setdefault(k[2], [None] * len(YEARS))
        arr[YEARS.index(y)] = v

    dest = Path(__file__).resolve().parent.parent / "data" / "atus.json"
    dest.write_text(json.dumps(out, separators=(",", ":")))
    print(f"Wrote {dest} ({len(want)} series)")


if __name__ == "__main__":
    main()
