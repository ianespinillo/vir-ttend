from __future__ import annotations

import argparse
import io
import re
import time
from pathlib import Path
from typing import Optional

import pandas as pd
import requests

DEFAULT_BASE_DIR = Path(__file__).resolve().parent
DEFAULT_OUT = DEFAULT_BASE_DIR / "schools_extracted.csv"
DEFAULT_CABA_CSV = DEFAULT_BASE_DIR / "establecimientos_educativos.csv"
DEFAULT_CABA_PADRON_CSV = DEFAULT_BASE_DIR / "padron-establecimientos.csv"
DEFAULT_PBA_CSV = DEFAULT_BASE_DIR / "establecimientos-educativos-14092026.csv"

CABA_GEO_URL = (
    "https://cdn.buenosaires.gob.ar/datosabiertos/datasets/"
    "ministerio-de-educacion/establecimientos-educativos/establecimientos_educativos.csv"
)
CABA_PADRON_URL = (
    "https://cdn.buenosaires.gob.ar/datosabiertos/datasets/"
    "ministerio-de-educacion/establecimientos-educativos/padron-establecimientos.csv"
)

PBA_API_URL = "https://catalogo.datos.gba.gob.ar/api/3/action/datastore_search"
PBA_RESOURCE_ID = "3951210e-7e0e-4fed-bbf1-0183e704c9ae"

EMAIL_RE = re.compile(
    r"(?i)[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+"
    r"(?:\.[a-z0-9-]+)+"
)


def norm_col(name: str) -> str:
    return re.sub(
        r"[^a-z0-9]",
        "",
        str(name).strip().casefold(),
    )


def find_column(df: pd.DataFrame, *wanted: str) -> Optional[str]:
    columns = {norm_col(c): c for c in df.columns}
    for w in wanted:
        key = norm_col(w)
        if key in columns:
            return columns[key]
    return None


def clean_text(value) -> str:
    if value is None or pd.isna(value):
        return ""
    text = str(value).strip()
    return re.sub(r"\s+", " ", text)


def clean_cue(value) -> str:
    if value is None or pd.isna(value):
        return ""
    try:
        val_float = float(value)
        return str(int(val_float))
    except (ValueError, OverflowError):
        return str(value).strip().split(".")[0]


def extract_emails(value) -> str:
    cleaned = clean_text(value)
    if not cleaned:
        return ""
    matches = EMAIL_RE.findall(cleaned)
    seen = []
    for email in matches:
        e = email.strip(" .;,")
        if e and e.casefold() not in [x.casefold() for x in seen]:
            seen.append(e)
    return " / ".join(seen) if seen else cleaned


def read_csv_flexibly(file_path: Path) -> pd.DataFrame:
    encodings = ["utf-8-sig", "utf-8", "latin1", "cp1252"]
    separators = [",", ";", "\t"]

    for enc in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(
                    file_path,
                    sep=sep,
                    encoding=enc,
                    dtype=str,
                    keep_default_na=False,
                )
                if len(df.columns) > 1:
                    return df
            except Exception:
                continue

    raise ValueError(f"Could not read CSV file: {file_path}")


def fetch_pba_from_api(save_path: Optional[Path] = None) -> pd.DataFrame:
    print("Fetching complete PBA dataset via official CKAN API...")
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

    # Get total count
    res = session.get(
        PBA_API_URL,
        params={"resource_id": PBA_RESOURCE_ID, "limit": 1},
        timeout=15,
    ).json()

    if not res.get("success"):
        raise RuntimeError("Failed to query PBA CKAN datastore.")

    total = res["result"]["total"]
    print(f"  Total records in PBA catalog: {total}")

    all_records = []
    limit = 200
    offset = 0

    while offset < total:
        params = {
            "resource_id": PBA_RESOURCE_ID,
            "fields": (
                "municipio_id,municipio_nombre,establecimiento_id,"
                "establecimiento_nombre,direccion,telefono,email"
            ),
            "limit": limit,
            "offset": offset,
        }

        success = False
        for attempt in range(1, 4):
            try:
                r = session.get(PBA_API_URL, params=params, timeout=15)
                data = r.json()
                if data.get("success"):
                    records = data["result"]["records"]
                    all_records.extend(records)
                    success = True
                    break
            except Exception:
                time.sleep(0.5 * attempt)

        if not success:
            print(f"  Warning: failed to fetch records at offset {offset}")

        offset += limit
        if offset % 4000 == 0 or offset >= total:
            print(f"  Fetched {min(offset, total)} / {total} records...")

    df = pd.DataFrame(all_records)
    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(save_path, index=False, encoding="utf-8-sig")
        print(f"  Saved full PBA records to {save_path.name}")

    return df


def fetch_caba_from_api(
    geo_path: Optional[Path] = None, padron_path: Optional[Path] = None
) -> tuple[pd.DataFrame, Optional[pd.DataFrame]]:
    headers = {"User-Agent": "Mozilla/5.0"}

    print("Fetching CABA geographical dataset from CDN...")
    r_geo = requests.get(CABA_GEO_URL, headers=headers, timeout=30)
    r_geo.raise_for_status()
    df_geo = pd.read_csv(io.BytesIO(r_geo.content), dtype=str, keep_default_na=False)
    if geo_path:
        with open(geo_path, "wb") as f:
            f.write(r_geo.content)

    df_padron = None
    try:
        print("Fetching CABA padron dataset for email enrichment...")
        r_pad = requests.get(CABA_PADRON_URL, headers=headers, timeout=30)
        r_pad.raise_for_status()
        df_padron = pd.read_csv(
            io.BytesIO(r_pad.content),
            sep=";",
            dtype=str,
            keep_default_na=False,
            encoding="utf-8-sig",
        )
        if padron_path:
            with open(padron_path, "wb") as f:
                f.write(r_pad.content)
    except Exception as e:
        print(f"  Warning: could not fetch CABA padron: {e}")

    return df_geo, df_padron


def process_pba_df(df: pd.DataFrame) -> pd.DataFrame:
    col_inst = find_column(df, "establecimiento_nombre", "nombre", "institucion")
    col_dir = find_column(df, "direccion", "domicilio", "calle")
    col_tel = find_column(df, "telefono", "telefonos", "tel")
    col_email = find_column(df, "email", "correo", "mail")
    col_partido = find_column(df, "municipio_nombre", "partido", "municipio", "distrito")
    col_loc = find_column(df, "localidad", "barrio")

    if not col_inst:
        raise KeyError(f"Could not find institution column in PBA data: {df.columns.tolist()}")

    rows = []
    for _, r in df.iterrows():
        inst = clean_text(r.get(col_inst))
        if not inst:
            continue

        direccion = clean_text(r.get(col_dir)) if col_dir else ""
        telefono = clean_text(r.get(col_tel)) if col_tel else ""
        email = extract_emails(r.get(col_email)) if col_email else ""
        partido = clean_text(r.get(col_partido)) if col_partido else ""
        localidad = clean_text(r.get(col_loc)) if col_loc else partido

        rows.append({
            "jurisdiccion": "PBA",
            "institucion": inst,
            "direccion": direccion,
            "telefono": telefono,
            "email": email,
            "partido": partido,
            "localidad": localidad,
        })

    return pd.DataFrame(rows)


def process_caba_df(
    df: pd.DataFrame, padron_df: Optional[pd.DataFrame] = None
) -> pd.DataFrame:
    email_by_cue: dict[str, str] = {}
    if padron_df is not None:
        col_padron_cue = find_column(padron_df, "cue")
        col_padron_email = find_column(padron_df, "email")
        if col_padron_cue and col_padron_email:
            for _, pr in padron_df.iterrows():
                cue_key = clean_cue(pr.get(col_padron_cue))
                em = extract_emails(pr.get(col_padron_email))
                if cue_key and em and cue_key not in email_by_cue:
                    email_by_cue[cue_key] = em

    col_inst = find_column(df, "nam", "fna", "nombre_est", "nombre")
    col_dir = find_column(df, "dir", "direccion", "domicilio")
    col_calle = find_column(df, "calle")
    col_num = find_column(df, "num", "numero", "altura")
    col_tel = find_column(df, "telefono", "telefonos", "tel")
    col_email = find_column(df, "email", "correo")
    col_barrio = find_column(df, "bar", "barrio")
    col_comuna = find_column(df, "com", "comuna")
    col_cue = find_column(df, "cue")

    rows = []
    for _, r in df.iterrows():
        inst = clean_text(r.get(col_inst))
        if not inst:
            continue

        if col_dir and clean_text(r.get(col_dir)):
            direccion = clean_text(r.get(col_dir))
        elif col_calle:
            calle = clean_text(r.get(col_calle))
            num = clean_text(r.get(col_num)) if col_num else ""
            direccion = f"{calle} {num}".strip()
        else:
            direccion = ""

        telefono = clean_text(r.get(col_tel)) if col_tel else ""

        email = extract_emails(r.get(col_email)) if col_email else ""
        if not email and col_cue:
            cue_key = clean_cue(r.get(col_cue))
            email = email_by_cue.get(cue_key, "")

        localidad = clean_text(r.get(col_barrio)) if col_barrio else ""
        raw_comuna = clean_text(r.get(col_comuna)) if col_comuna else ""
        if raw_comuna:
            partido = raw_comuna if raw_comuna.lower().startswith("comuna") else f"Comuna {raw_comuna}"
        else:
            partido = "CABA"

        rows.append({
            "jurisdiccion": "CABA",
            "institucion": inst,
            "direccion": direccion,
            "telefono": telefono,
            "email": email,
            "partido": partido,
            "localidad": localidad,
        })

    return pd.DataFrame(rows)


def main():
    parser = argparse.ArgumentParser(
        description="Extract and consolidate school data for PBA and CABA."
    )
    parser.add_argument(
        "--from-api",
        action="store_true",
        help="Download fresh data directly from official PBA and CABA APIs",
    )
    parser.add_argument(
        "--caba",
        type=Path,
        default=DEFAULT_CABA_CSV,
        help="Path to CABA CSV file",
    )
    parser.add_argument(
        "--caba-padron",
        type=Path,
        default=DEFAULT_CABA_PADRON_CSV,
        help="Path to CABA padron CSV",
    )
    parser.add_argument(
        "--pba",
        type=Path,
        default=DEFAULT_PBA_CSV,
        help="Path to PBA CSV file",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT,
        help="Output CSV path",
    )
    args = parser.parse_args()

    dfs = []

    # PBA data loading
    if args.from_api or not args.pba.exists():
        raw_pba_df = fetch_pba_from_api(save_path=args.pba)
    else:
        print(f"Reading PBA from local file: {args.pba.name}...")
        raw_pba_df = read_csv_flexibly(args.pba)

    pba_df = process_pba_df(raw_pba_df)
    print(f"  PBA rows processed: {len(pba_df)}")
    dfs.append(pba_df)

    # CABA data loading
    if args.from_api or not args.caba.exists():
        raw_caba_df, raw_padron_df = fetch_caba_from_api(
            geo_path=args.caba, padron_path=args.caba_padron
        )
    else:
        print(f"Reading CABA from local file: {args.caba.name}...")
        raw_caba_df = read_csv_flexibly(args.caba)
        raw_padron_df = None
        if args.caba_padron.exists():
            print(f"  Reading CABA padron for enrichment: {args.caba_padron.name}...")
            raw_padron_df = read_csv_flexibly(args.caba_padron)

    caba_df = process_caba_df(raw_caba_df, padron_df=raw_padron_df)
    print(f"  CABA rows processed: {len(caba_df)}")
    dfs.append(caba_df)

    consolidated = pd.concat(dfs, ignore_index=True)

    # Deduplicate establishments with same jurisdiction, institution name and address
    initial_count = len(consolidated)
    consolidated = consolidated.drop_duplicates(
        subset=["jurisdiccion", "institucion", "direccion"],
        keep="first",
    )
    dedup_count = len(consolidated)
    if initial_count != dedup_count:
        print(f"Deduplicated from {initial_count} to {dedup_count} unique establishments.")

    # Sort results
    consolidated = consolidated.sort_values(
        by=["jurisdiccion", "partido", "institucion"],
        key=lambda col: col.str.casefold(),
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    consolidated.to_csv(args.out, index=False, encoding="utf-8-sig")

    print("\nExtraction summary:")
    print(f"- Output file: {args.out.resolve()}")
    print(f"- Total records: {len(consolidated)}")
    print(f"- Unique partidos/municipios: {consolidated['partido'].nunique()}")
    print(f"- Total in Escobar: {(consolidated['partido'].str.casefold() == 'escobar').sum()}")
    print(f"- With address: {(consolidated['direccion'] != '').sum()}")
    print(f"- With telephone: {(consolidated['telefono'] != '').sum()}")
    print(f"- With email: {(consolidated['email'] != '').sum()}")


if __name__ == "__main__":
    main()
