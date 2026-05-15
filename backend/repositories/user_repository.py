"""
UserRepository - DATA-ACCESS LAYER (analogous to Spring's @Repository).
The service layer never talks to Mongo directly; it goes through here.

Note on 'parameterised queries':
We pass user-supplied values as dict values (e.g. {"email": email}), NEVER by
string-concatenation. Motor/Mongo treats them as data, not as code - the exact
same defence against injection that parameterised SQL gives in JDBC.
"""

from typing import Optional


class UserRepository:
    def __init__(self, db):
        self.collection = db.users

    async def find_by_email(self, email: str) -> Optional[dict]:
        # Parameterised: 'email' is data, not part of the query string.
        return await self.collection.find_one({"email": email.lower()}, {"_id": 0})

    async def find_by_id(self, user_id: str) -> Optional[dict]:
        return await self.collection.find_one({"id": user_id}, {"_id": 0})

    async def insert(self, user_doc: dict) -> None:
        await self.collection.insert_one(user_doc)

    async def update_password(self, email: str, password_hash: str) -> None:
        await self.collection.update_one(
            {"email": email.lower()}, {"$set": {"password_hash": password_hash}}
        )

    async def ensure_indexes(self) -> None:
        await self.collection.create_index("email", unique=True)
        await self.collection.create_index("id", unique=True)
