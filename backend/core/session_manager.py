"""
SessionManager - Singleton Pattern Implementation
--------------------------------------------------
WHY SINGLETON?
We need ONE single, globally-accessible object that tracks the "currentUser"
for the running application (as required by the SIS / FR documentation).
A Singleton guarantees only ONE instance exists in memory, so every layer of
the app (controller, service, repository) reads/writes the same session state.

We use the classic Singleton via `__new__`. The first time SessionManager()
is called it builds the instance; every later call returns the same one.

For the prototype, sessions are kept in a simple in-memory dict keyed by the
JWT token. In a production system you would back this with Redis - but the
pattern (single point-of-truth for sessions) stays the same.
"""

from threading import Lock
from typing import Optional, Dict


class SessionManager:
    _instance: Optional["SessionManager"] = None
    _lock: Lock = Lock()  # makes singleton thread-safe (uvicorn workers may be threaded)

    def __new__(cls):
        # Double-checked locking: only build the instance ONCE, even under threads.
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = super().__new__(cls)
                    # _sessions: { token -> { "user_id": ..., "email": ..., "role": ... } }
                    instance._sessions: Dict[str, dict] = {}
                    instance._current_user: Optional[dict] = None
                    cls._instance = instance
        return cls._instance

    # ---- Session lifecycle ---------------------------------------------------
    def register_session(self, token: str, user: dict) -> None:
        """Save the logged-in user under their JWT token."""
        self._sessions[token] = user
        self._current_user = user  # tracks the most recently authenticated user

    def get_user_by_token(self, token: str) -> Optional[dict]:
        """Look up the user attached to a given token (used by auth dependency)."""
        return self._sessions.get(token)

    def clear_session(self, token: str) -> None:
        """Drop a session - called on logout."""
        self._sessions.pop(token, None)

    # ---- 'currentUser' helper (matches the SIS naming) -----------------------
    @property
    def currentUser(self) -> Optional[dict]:
        """Returns the currentUser attribute referenced in the SIS."""
        return self._current_user

    def set_current_user(self, user: Optional[dict]) -> None:
        self._current_user = user
