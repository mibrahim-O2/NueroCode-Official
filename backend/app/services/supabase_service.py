from supabase import create_client, Client
from app.config.settings import settings

# ==================== DEBUG ====================
print("=== SUPABASE DEBUG START ===")
print("Current working directory:", __import__('os').getcwd())
print("SUPABASE_URL (raw):", repr(settings.SUPABASE_URL))
print("SUPABASE_URL length:", len(settings.SUPABASE_URL))
print("SUPABASE_SERVICE_ROLE_KEY length:", len(settings.SUPABASE_SERVICE_ROLE_KEY) if settings.SUPABASE_SERVICE_ROLE_KEY else 0)
print("=== SUPABASE DEBUG END ===\n")
# ===============================================

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_or_create_user(firebase_uid: str, email: str, name: str, avatar_url: str | None) -> dict:
    """Fetches the user by firebase_uid, or creates one on first login."""
    existing = supabase.table("users").select("*").eq("firebase_uid", firebase_uid).execute()
    if existing.data:
        return existing.data[0]

    role = "admin" if email.lower() == settings.ADMIN_EMAIL.lower() else "student"

    new_user = {
        "firebase_uid": firebase_uid,
        "name": name,
        "email": email,
        "avatar_url": avatar_url,
        "role": role,
        "xp": 0,
        "level": 1,
        "streak": 0,
    }
    result = supabase.table("users").insert(new_user).execute()
    return result.data[0]