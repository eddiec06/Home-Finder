"""
PropertyRepository - data layer for the 'properties' collection.

The search() method below is the equivalent of a parameterised SQL query.
In SQL we would write:
    SELECT * FROM Properties
    WHERE location LIKE ?            -- bind variable
      AND price BETWEEN ? AND ?      -- bind variables

In Motor/Mongo we pass the user input as DICT VALUES, never as a string of
JS/Mongo code -> no injection possible.
"""

from typing import Optional, List


class PropertyRepository:
    def __init__(self, db):
        self.collection = db.properties

    async def search(
        self,
        location: Optional[str],
        min_price: Optional[float],
        max_price: Optional[float],
        listing_type: Optional[str] = None,
    ) -> List[dict]:
        query: dict = {}
        if location:
            # Case-insensitive substring match (like SQL LIKE %x%) - still parameterised.
            query["location"] = {"$regex": location, "$options": "i"}
        if listing_type in ("rent", "sale"):
            query["listing_type"] = listing_type
        if min_price is not None or max_price is not None:
            price_filter: dict = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            query["price"] = price_filter
        cursor = self.collection.find(query, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=500)

    async def find_by_id(self, property_id: str) -> Optional[dict]:
        return await self.collection.find_one({"propertyID": property_id}, {"_id": 0})

    async def insert(self, doc: dict) -> None:
        await self.collection.insert_one(doc)

    async def update(self, property_id: str, fields: dict) -> int:
        res = await self.collection.update_one(
            {"propertyID": property_id}, {"$set": fields}
        )
        return res.modified_count

    async def delete(self, property_id: str) -> int:
        res = await self.collection.delete_one({"propertyID": property_id})
        return res.deleted_count

    async def count(self) -> int:
        return await self.collection.count_documents({})

    async def ensure_indexes(self) -> None:
        await self.collection.create_index("propertyID", unique=True)
        await self.collection.create_index("location")
