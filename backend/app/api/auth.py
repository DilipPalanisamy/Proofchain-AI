import os
import json
import urllib.request
import urllib.parse
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID", ""
)
GOOGLE_CLIENT_SECRET = os.getenv(
    "GOOGLE_CLIENT_SECRET", ""
)
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"
)


@router.get("/google/login", summary="Redirect to Google OAuth Consent Screen")
def google_login():
    """Redirects the user to Google OAuth consent screen."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback", summary="Handle Google OAuth Callback")
def google_callback(code: str = Query(..., description="Authorization code from Google")):
    """Exchanges Google authorization code for user info and redirects to frontend."""
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code from Google.")

    # 1. Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI,
    }).encode("utf-8")

    req = urllib.request.Request(
        token_url, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            token_res = json.loads(resp.read().decode("utf-8"))
    except Exception as err:
        raise HTTPException(
            status_code=400, detail=f"Failed to exchange Google OAuth code: {str(err)}"
        )

    access_token = token_res.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to retrieve Google access token.")

    # 2. Fetch User Profile
    userinfo_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
    try:
        with urllib.request.urlopen(userinfo_url) as resp:
            user_info = json.loads(resp.read().decode("utf-8"))
    except Exception as err:
        raise HTTPException(
            status_code=400, detail=f"Failed to fetch Google user profile: {str(err)}"
        )

    email = user_info.get("email", "")
    name = user_info.get("name", email.split("@")[0] if email else "Google User")

    # 3. Redirect back to frontend dashboard with session parameters
    frontend_url = "http://localhost:3000/login"
    redirect_params = urllib.parse.urlencode({
        "google_auth": "success",
        "email": email,
        "name": name,
    })

    return RedirectResponse(url=f"{frontend_url}?{redirect_params}")
