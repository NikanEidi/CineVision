import os, math, shutil, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import Recommender, ART_DIR

# Create Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # allow all origins (can restrict in prod)

# Init recommender (will load or build artifacts later)
recommender = Recommender(artifacts_dir=ART_DIR)

# Config: build catalog from TMDB if no local artifacts
BUILD_FROM_TMDB = True
TMDB_API_KEY = os.environ.get("TMDB_API_KEY") or os.environ.get("VITE_TMDB_API_KEY") or ""

# Ensure recommender is ready (load from artifacts or build from TMDB)
def _ensure_recommender_ready():
    if recommender.catalog is not None:  # already ready
        return
    if recommender._artifacts_exist():   # load existing
        recommender.ensure_ready()
        return
    if BUILD_FROM_TMDB:                  # build new from TMDB API
        if not TMDB_API_KEY:
            raise RuntimeError("TMDB_API_KEY is missing.")
        recommender.ensure_ready(build_from_tmdb=True, tmdb_api_key=TMDB_API_KEY, region="US")
        return
    raise RuntimeError("Artifacts missing and BUILD_FROM_TMDB=False.")

# --- Health check ---
@app.route("/healthz", methods=["GET"])
def healthz():
    try:
        _ensure_recommender_ready()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "detail": str(e)}), 500

# --- Force rebuild of artifacts ---
@app.route("/rebuild", methods=["POST"])
def rebuild():
    try:
        if ART_DIR.exists():
            shutil.rmtree(ART_DIR, ignore_errors=True)  # clear old artifacts
        if not TMDB_API_KEY:
            return jsonify({"detail": "TMDB_API_KEY missing"}), 400

        # reset state
        recommender.catalog = None
        recommender.vectorizer = None
        recommender.matrix = None
        recommender.id2row = None

        # rebuild from TMDB
        recommender.ensure_ready(build_from_tmdb=True, tmdb_api_key=TMDB_API_KEY, region="US")
        return jsonify({"ok": True})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"ok": False, "detail": str(e)}), 500

# --- Recommendation endpoint ---
@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        _ensure_recommender_ready()
        payload = request.get_json(force=True) or {}

        watchlist = payload.get("watchlist") or []
        limit = payload.get("limit", 20)
        media_types = payload.get("media_types")

        # validate limit
        try:
            limit = int(limit)
            if limit <= 0:
                limit = 20
        except Exception:
            limit = 20

        # clean watchlist items
        cleaned = []
        for it in watchlist:
            mt = str((it or {}).get("media_type", "")).lower().strip()
            mid = (it or {}).get("media_id")
            if mt in {"movie", "tv"} and isinstance(mid, (int, float)) and not math.isnan(mid):
                cleaned.append({"media_type": mt, "media_id": int(mid)})

        if not cleaned:
            return jsonify({"detail": "empty or invalid watchlist"}), 400

        # optional type filter
        allowed_types = None
        if isinstance(media_types, list) and media_types:
            allowed_types = {str(t).lower().strip() for t in media_types if str(t).lower().strip() in {"movie", "tv"}}
            if not allowed_types:
                allowed_types = None

        # get recommendations
        results = recommender.recommend(
            watchlist=cleaned,
            limit=limit,
            filter_media_types=allowed_types,
        )
        return jsonify({"results": results})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"detail": str(e), "error": "internal_error"}), 500

# --- Entrypoint ---
if __name__ == "__main__":
    # For local dev. In production use gunicorn: `gunicorn -w 2 -b 0.0.0.0:5178 app:app`
    app.run(host="0.0.0.0", port=5178, debug=False)