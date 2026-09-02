import os
import time
import urllib.request
import urllib.error
import datetime

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://ibhfzlqwlluguyouiebz.supabase.co")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_UFLelgTc0DER8vrBQN1u9Q_-lfz7NEN")

def ping_supabase():
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now}] [START] Pinging Supabase: {SUPABASE_URL}...")

    # 1. Ping Auth Health
    try:
        req_auth = urllib.request.Request(
            f"{SUPABASE_URL}/auth/v1/health",
            headers={"apikey": SUPABASE_KEY}
        )
        start = time.time()
        with urllib.request.urlopen(req_auth, timeout=10) as res:
            elapsed = int((time.time() - start) * 1000)
            print(f"  [OK] [Auth Health] Status: {res.status} ({elapsed}ms)")
    except urllib.error.HTTPError as e:
        print(f"  [INFO] [Auth Health] Status: {e.code}")
    except Exception as e:
        print(f"  [ERROR] [Auth Health] Error: {e}")

    # 2. Ping REST API
    try:
        req_rest = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
        )
        start = time.time()
        with urllib.request.urlopen(req_rest, timeout=10) as res:
            elapsed = int((time.time() - start) * 1000)
            print(f"  [OK] [REST API] Status: {res.status} ({elapsed}ms)")
    except urllib.error.HTTPError as e:
        print(f"  [INFO] [REST API] Status: {e.code} (Activity recorded)")
    except Exception as e:
        print(f"  [ERROR] [REST API] Error: {e}")

    print(f"[{now}] [DONE] Ping complete! Supabase activity renewed.\n")

if __name__ == "__main__":
    ping_supabase()
