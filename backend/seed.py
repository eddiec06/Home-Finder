"""
Idempotent seed: creates the admin user + a small set of sample properties so
the app is demoable the moment it boots.
"""

import os
import uuid
from datetime import datetime, timezone

from core.security import hash_password, verify_password


SAMPLE_PROPERTIES = [
    {
        "title": "Sunny 2-Bed Apartment near Campus",
        "location": "Lahore",
        "price": 45000,
        "bedrooms": 2,
        "bathrooms": 1,
        "description": "Bright south-facing apartment, 10 minutes walk to the university gate. Furnished, high-speed internet included.",
        "image_url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    },
    {
        "title": "Cozy Studio for One",
        "location": "Karachi",
        "price": 22000,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Compact studio ideal for a single student. Includes utilities and a small balcony.",
        "image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    },
    {
        "title": "Spacious 3-Bed Family House",
        "location": "Islamabad",
        "price": 95000,
        "bedrooms": 3,
        "bathrooms": 2,
        "description": "Quiet residential street, small garden, dedicated parking. Pet-friendly.",
        "image_url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    },
    {
        "title": "Modern Loft Downtown",
        "location": "Lahore",
        "price": 60000,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Open-plan loft with floor-to-ceiling windows. Walking distance to cafes and the metro.",
        "image_url": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    },
    {
        "title": "Shared Hostel Room",
        "location": "Faisalabad",
        "price": 12000,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Affordable shared accommodation, meals included. Female-only floor.",
        "image_url": "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
    },
    {
        "title": "Garden Villa with Pool",
        "location": "Islamabad",
        "price": 220000,
        "bedrooms": 4,
        "bathrooms": 3,
        "description": "Premium villa - private pool, large garden, fully serviced. Perfect for a family stay.",
        "image_url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    },
]


async def seed_admin(user_repo) -> None:
    """Create the admin if missing; if the env-password changed, update the hash."""
    email = os.environ["ADMIN_EMAIL"]
    password = os.environ["ADMIN_PASSWORD"]
    existing = await user_repo.find_by_email(email)
    if existing is None:
        await user_repo.insert(
            {
                "id": str(uuid.uuid4()),
                "email": email.lower(),
                "password_hash": hash_password(password),
                "name": "Administrator",
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
    elif not verify_password(password, existing["password_hash"]):
        await user_repo.update_password(email, hash_password(password))


async def seed_properties(property_repo) -> None:
    if await property_repo.count() > 0:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    for p in SAMPLE_PROPERTIES:
        await property_repo.insert(
            {
                "propertyID": str(uuid.uuid4()),
                **p,
                "created_by": "system_seed",
                "created_at": now_iso,
            }
        )
