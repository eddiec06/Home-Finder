"""
PropertyService - business logic for search + admin CRUD.
Stays thin: validates inputs, calls the repository, returns plain dicts.
"""

from typing import Optional, List
from fastapi import HTTPException

from models import PropertyCreate, PropertyUpdate, Property


class PropertyService:
    def __init__(self, repository):
        self.repo = repository

    async def search(
        self,
        location: Optional[str],
        min_price: Optional[float],
        max_price: Optional[float],
        listing_type: Optional[str] = None,
    ) -> List[dict]:
        return await self.repo.search(location, min_price, max_price, listing_type)

    async def get(self, property_id: str) -> dict:
        prop = await self.repo.find_by_id(property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        return prop

    async def create(self, data: PropertyCreate, admin_user_id: str) -> dict:
        prop = Property(**data.model_dump(), created_by=admin_user_id)
        doc = prop.model_dump()
        # Datetime -> ISO string (Mongo-friendly + JSON-friendly).
        doc["created_at"] = doc["created_at"].isoformat()
        await self.repo.insert(doc)
        # Mongo mutates `doc` to add a BSON `_id` which is not JSON-serialisable.
        doc.pop("_id", None)
        return doc

    async def update(self, property_id: str, data: PropertyUpdate) -> dict:
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="No fields supplied")
        modified = await self.repo.update(property_id, fields)
        if modified == 0:
            # Could be 'not found' or 'no change'; check existence to disambiguate.
            existing = await self.repo.find_by_id(property_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Property not found")
        return await self.repo.find_by_id(property_id)

    async def delete(self, property_id: str) -> None:
        deleted = await self.repo.delete(property_id)
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Property not found")
