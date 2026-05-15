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
        "title": "Bright Studio near Sorbonne",
        "location": "Paris, France",
        "price": 1200,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Quiet 5th-arrondissement studio, two metro stops from the campus. Fully furnished.",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    },
    {
        "title": "Modern Loft in Kreuzberg",
        "location": "Berlin, Germany",
        "price": 950,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Industrial-style loft with high ceilings, near Görlitzer Park and several universities.",
        "image_url": "https://images.unsplash.com/photo-1494203484021-3c454daf695d?w=800",
    },
    {
        "title": "Canal-view Apartment",
        "location": "Amsterdam, Netherlands",
        "price": 1450,
        "bedrooms": 2,
        "bathrooms": 1,
        "description": "Charming apartment overlooking the Prinsengracht canal. Bike storage included.",
        "image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800",
    },
    {
        "title": "Sunny Flat in Gracia",
        "location": "Barcelona, Spain",
        "price": 780,
        "bedrooms": 2,
        "bathrooms": 1,
        "description": "Bohemian neighbourhood, walking distance to UPF campus and tapas bars.",
        "image_url": "https://images.unsplash.com/photo-1522444195799-478538b28823?w=800",
    },
    {
        "title": "Trastevere Studio",
        "location": "Rome, Italy",
        "price": 820,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Cosy studio in Trastevere with exposed beams. 10 minutes by tram to Sapienza.",
        "image_url": "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    },
    {
        "title": "Tile-roof House in Alfama",
        "location": "Lisbon, Portugal",
        "price": 1100,
        "bedrooms": 3,
        "bathrooms": 2,
        "description": "Traditional Portuguese townhouse with a roof terrace and river views.",
        "image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    },
    {
        "title": "Vienna Old-Town Flat",
        "location": "Vienna, Austria",
        "price": 990,
        "bedrooms": 2,
        "bathrooms": 1,
        "description": "Classic Viennese 1st-district apartment near WU and the Hofburg.",
        "image_url": "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    },
    {
        "title": "Riverside Apartment",
        "location": "Prague, Czech Republic",
        "price": 680,
        "bedrooms": 1,
        "bathrooms": 1,
        "description": "Bright apartment on the Vltava river embankment, 15 minutes to Charles University.",
        "image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
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
