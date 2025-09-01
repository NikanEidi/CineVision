from __future__ import annotations
import os, re, json, math, time, typing as T
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import joblib
import requests

ART_DIR = Path("./artifacts")
CATALOG_PATH = ART_DIR / "catalog.parquet"
VECTORIZER_PATH = ART_DIR / "tfidf_vectorizer.pkl"
MATRIX_PATH = ART_DIR / "tfidf_matrix.npz"
ID2ROW_PATH = ART_DIR / "id2row.json"

TFIDF_KWARGS = dict(
    max_features=200000,
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.6,
    lowercase=True,
    stop_words="english",
    dtype=np.float32,
)

TMDB_PAGES_MOVIE = 5
TMDB_PAGES_TV = 5
TMDB_BASE = "https://api.themoviedb.org/3"

TMDB_GENRES = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
    10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
}

def _to_text(val) -> str:
    if val is None:
        return ""
    try:
        if isinstance(val, float) and math.isnan(val):
            return ""
    except Exception:
        pass
    try:
        if hasattr(val, "__array__") and np.size(val) == 1 and np.isnan(val):
            return ""
    except Exception:
        pass
    if isinstance(val, (list, tuple, set)):
        return " ".join(_to_text(x) for x in val)
    if isinstance(val, dict):
        if "name" in val:
            return _to_text(val["name"])
        return " ".join(_to_text(x) for x in val.values())
    return str(val)

_norm_rx_keep = re.compile(r"[^a-z0-9\s]+")
_norm_rx_ws = re.compile(r"\s+")

def _normalize(text: T.Any) -> str:
    s = _to_text(text).lower()
    s = _norm_rx_keep.sub(" ", s)
    s = _norm_rx_ws.sub(" ", s).strip()
    return s

def _join_fields(*parts: T.Any) -> str:
    return _normalize(" ".join(_to_text(p) for p in parts))

def _tmdb_get(endpoint: str, api_key: str, params: dict | None = None) -> dict:
    if params is None:
        params = {}
    params = dict(params)
    params["api_key"] = api_key
    for i in range(3):
        try:
            resp = requests.get(f"{TMDB_BASE}/{endpoint.lstrip('/')}", params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            if 500 <= resp.status_code < 600:
                time.sleep(0.8 * (i + 1))
                continue
            return {}
        except Exception:
            time.sleep(0.8 * (i + 1))
    return {}

def _extract_cast_names(credits: dict) -> list[str]:
    cast = credits.get("cast") if isinstance(credits, dict) else []
    names = []
    if isinstance(cast, list):
        for c in cast[:10]:
            n = _to_text(c.get("name"))
            if n:
                names.append(n)
    return names

def _extract_directors_or_creators(credits: dict, details: dict, media_type: str) -> list[str]:
    names = []
    if media_type == "movie":
        crew = credits.get("crew") if isinstance(credits, dict) else []
        if isinstance(crew, list):
            for m in crew:
                if isinstance(m, dict) and _to_text(m.get("job")).lower() == "director":
                    n = _to_text(m.get("name"))
                    if n:
                        names.append(n)
    else:
        created_by = details.get("created_by") if isinstance(details, dict) else []
        if isinstance(created_by, list):
            for c in created_by[:5]:
                n = _to_text(c.get("name"))
                if n:
                    names.append(n)
    return names

def _genres_to_string_any(row: pd.Series) -> str:
    cand = row.get("genres")
    if isinstance(cand, list):
        names = []
        for g in cand:
            if isinstance(g, dict) and "name" in g:
                t = _to_text(g["name"]).strip()
                if t:
                    names.append(t)
            else:
                t = _to_text(g).strip()
                if t:
                    names.append(t)
        if names:
            return ", ".join(dict.fromkeys(names))
    if isinstance(cand, str) and cand.strip():
        return cand.strip()
    cand2 = row.get("genre_names")
    if isinstance(cand2, list):
        names = [_to_text(x).strip() for x in cand2 if _to_text(x).strip()]
        if names:
            return ", ".join(dict.fromkeys(names))
    if isinstance(cand2, str) and cand2.strip():
        return cand2.strip()
    ids = row.get("genre_ids")
    if isinstance(ids, list):
        names = []
        for gid in ids:
            try:
                gid_int = int(gid)
                name = TMDB_GENRES.get(gid_int)
                if name:
                    names.append(name)
            except Exception:
                pass
        if names:
            return ", ".join(dict.fromkeys(names))
    return ""

class Recommender:
    def __init__(self, artifacts_dir: Path | str = ART_DIR):
        self.art_dir = Path(artifacts_dir)
        self.art_dir.mkdir(parents=True, exist_ok=True)
        self.catalog: pd.DataFrame | None = None
        self.vectorizer: TfidfVectorizer | None = None
        self.matrix: sparse.csr_matrix | None = None
        self.id2row: dict[str, int] | None = None

    def ensure_ready(self, *, df: pd.DataFrame | None = None, build_from_tmdb: bool = False, tmdb_api_key: str | None = None, region: str = "US") -> None:
        if self._artifacts_exist():
            self._load_artifacts()
            return
        if df is not None:
            self._build_artifacts_from_df(df)
            return
        if build_from_tmdb:
            if not tmdb_api_key:
                raise RuntimeError("TMDB_API_KEY is required to build from TMDB.")
            df_tmdb = self._seed_catalog_from_tmdb(tmdb_api_key=tmdb_api_key, region=region)
            self._build_artifacts_from_df(df_tmdb)
            return
        raise RuntimeError("Artifacts not found and no build path specified.")

    def recommend(self, watchlist: list[dict], *, limit: int = 20, filter_media_types: set[str] | None = None, exclude_ids: set[tuple[str, int]] | None = None) -> list[dict]:
        if self.catalog is None or self.vectorizer is None or self.matrix is None or self.id2row is None:
            raise RuntimeError("Recommender is not ready. Call ensure_ready() first.")
        seeds: list[tuple[str, int]] = []
        for it in watchlist or []:
            mt = str((it or {}).get("media_type", "")).lower().strip()
            mid = (it or {}).get("media_id")
            if mt in {"movie", "tv"} and isinstance(mid, (int, float)) and not math.isnan(mid):
                seeds.append((mt, int(mid)))
        if not seeds:
            return []
        row_indices = []
        seed_weights = []
        for mt, mid in seeds:
            key = self._key(mt, mid)
            idx = self.id2row.get(key)
            if idx is not None:
                row_indices.append(idx)
                va = float(self.catalog.iloc[idx].get("vote_average") or 0.0)
                w = max(0.0, min(1.0, va / 10.0))
                seed_weights.append(0.5 + 0.5 * w)
        if not row_indices:
            return []
        rows = self.matrix[row_indices]
        if seed_weights:
            w = np.array(seed_weights, dtype=np.float32)[:, None]
            rows = rows.multiply(w)
        query_vec = rows.sum(axis=0)
        if isinstance(query_vec, np.matrix):
            query_vec = np.asarray(query_vec)
        query_vec = sparse.csr_matrix(query_vec)
        sims = linear_kernel(query_vec, self.matrix).ravel()
        exclude = set(seeds)
        if exclude_ids:
            exclude |= set(exclude_ids)
        if filter_media_types:
            mask_media = self.catalog["media_type"].isin(list(filter_media_types))
        else:
            mask_media = np.ones(len(self.catalog), dtype=bool)
        keys = self.catalog[["media_type", "id"]].apply(lambda r: self._key(r["media_type"], r["id"]), axis=1)
        mask_excl = ~keys.isin({_key(mt, mid) for (mt, mid) in exclude})
        final_mask = mask_media & mask_excl.values
        if not final_mask.any():
            return []
        allowed_idx = np.where(final_mask)[0]
        allowed_sims = sims[allowed_idx]
        if allowed_sims.size == 0:
            return []
        top_k = min(limit, allowed_sims.size)
        top_local = np.argpartition(-allowed_sims, kth=top_k - 1)[:top_k]
        top_sorted_local = top_local[np.argsort(-allowed_sims[top_local])]
        top_indices = allowed_idx[top_sorted_local]
        out: list[dict] = []
        for i in top_indices:
            row = self.catalog.iloc[i]
            genres_str = _genres_to_string_any(row) or "Other"
            out.append(
                dict(
                    media_type=row["media_type"],
                    id=int(row["id"]),
                    media_id=int(row["id"]),
                    title=row.get("title") or row.get("name"),
                    name=row.get("name"),
                    poster_path=row.get("poster_path"),
                    vote_average=float(row.get("vote_average") or 0.0),
                    similarity=float(sims[i]),
                    genres=genres_str,
                )
            )
        return out

    def _artifacts_exist(self) -> bool:
        return all(p.exists() for p in [CATALOG_PATH, VECTORIZER_PATH, MATRIX_PATH, ID2ROW_PATH])

    def _load_artifacts(self) -> None:
        self.catalog = pd.read_parquet(CATALOG_PATH)
        self.vectorizer = joblib.load(VECTORIZER_PATH)
        self.matrix = sparse.load_npz(MATRIX_PATH).tocsr()
        with open(ID2ROW_PATH, "r", encoding="utf-8") as f:
            self.id2row = json.load(f)

    def _save_artifacts(self) -> None:
        assert self.catalog is not None and self.vectorizer is not None and self.matrix is not None and self.id2row is not None
        ART_DIR.mkdir(parents=True, exist_ok=True)
        self.catalog.to_parquet(CATALOG_PATH, index=False)
        joblib.dump(self.vectorizer, VECTORIZER_PATH)
        sparse.save_npz(MATRIX_PATH, self.matrix.tocsr())
        with open(ID2ROW_PATH, "w", encoding="utf-8") as f:
            json.dump(self.id2row, f)

    def _build_artifacts_from_df(self, df: pd.DataFrame) -> None:
        req_cols = {"media_type", "id"}
        for c in req_cols:
            if c not in df.columns:
                raise ValueError(f"Missing required column: {c}")
        texts = []
        for _, row in df.iterrows():
            title = row.get("title")
            if not _to_text(title):
                title = row.get("name") or row.get("original_title") or row.get("original_name")
            overview = row.get("overview")
            genres_raw = row.get("genres") or row.get("genre_names") or row.get("genre_ids")
            if isinstance(genres_raw, list):
                names = [g.get("name") for g in genres_raw if isinstance(g, dict) and "name" in g]
                genres = names if names else genres_raw
            else:
                genres = genres_raw
            keywords_raw = row.get("keywords")
            if isinstance(keywords_raw, list):
                kw = [k.get("name") if isinstance(k, dict) else k for k in keywords_raw]
            else:
                kw = keywords_raw
            cast_raw = row.get("cast") or []
            if isinstance(cast_raw, list):
                cast = [c.get("name") for c in cast_raw if isinstance(c, dict) and "name" in c][:10]
            else:
                cast = cast_raw
            directors_or_creators = row.get("directors") or row.get("created_by") or row.get("showrunners")
            text = _join_fields(title, overview, genres, kw, cast, directors_or_creators)
            texts.append(text)
        df = df.copy()
        df["text"] = pd.Series(texts, index=df.index).astype(str).fillna("")
        vec = TfidfVectorizer(**TFIDF_KWARGS)
        mat = vec.fit_transform(df["text"].tolist())
        id2row = {}
        for i, r in df.reset_index(drop=True).iterrows():
            key = self._key(r["media_type"], r["id"])
            id2row[key] = int(i)
        self.catalog = df.reset_index(drop=True)
        self.vectorizer = vec
        self.matrix = mat.tocsr()
        self.id2row = id2row
        self._save_artifacts()

    def _seed_catalog_from_tmdb(self, *, tmdb_api_key: str, region: str = "US") -> pd.DataFrame:
        rows = []
        def fetch_block(media_type: str, pages: int):
            for p in range(1, pages + 1):
                lst = _tmdb_get(f"{media_type}/popular", tmdb_api_key, params={"page": p, "region": region})
                for item in lst.get("results", []):
                    details = _tmdb_get(f"{media_type}/{item.get('id')}", tmdb_api_key, params={})
                    credits = _tmdb_get(f"{media_type}/{item.get('id')}/credits", tmdb_api_key)
                    if media_type == "movie":
                        kws = _tmdb_get(f"movie/{item.get('id')}/keywords", tmdb_api_key).get("keywords", [])
                    else:
                        kws = _tmdb_get(f"tv/{item.get('id')}/keywords", tmdb_api_key).get("results", [])
                    title = _to_text(details.get("title") or details.get("name") or item.get("title") or item.get("name"))
                    overview = details.get("overview") or item.get("overview")
                    genres = details.get("genres") or item.get("genre_ids") or []
                    keywords = kws
                    cast = _extract_cast_names(credits)
                    creators = _extract_directors_or_creators(credits, details, media_type)
                    vote_average = details.get("vote_average") or item.get("vote_average") or 0.0
                    poster_path = details.get("poster_path") or item.get("poster_path")
                    popularity = details.get("popularity") or item.get("popularity")
                    rows.append(
                        dict(
                            media_type=media_type,
                            id=int(item.get("id")),
                            title=title,
                            overview=overview,
                            genres=genres,
                            keywords=keywords,
                            cast=[{"name": n} for n in cast],
                            created_by=[{"name": n} for n in creators],
                            vote_average=float(vote_average or 0.0),
                            popularity=float(popularity or 0.0),
                            poster_path=poster_path,
                        )
                    )
        fetch_block("movie", TMDB_PAGES_MOVIE)
        fetch_block("tv", TMDB_PAGES_TV)
        df = pd.DataFrame(rows)
        df = df.drop_duplicates(subset=["media_type", "id"])
        return df.reset_index(drop=True)

    @staticmethod
    def _key(media_type: str, id_int: int) -> str:
        return f"{str(media_type).lower().strip()}:{int(id_int)}"

def _key(media_type: str, id_int: int) -> str:
    return f"{str(media_type).lower().strip()}:{int(id_int)}"