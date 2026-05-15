"""
Property Controller. Public search endpoint + admin-protected CRUD.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Request, Query

from models import PropertyCreate, PropertyUpdate
from controllers.auth_controller import require_admin


router = APIRouter(tags=["properties"])


def get_service(request: Request):
    return request.app.state.property_service


# ---- public: search & view -------------------------------------------------------
@router.get("/properties")
async def list_properties(
    location: Optional[str] = Query(default=None),
    min_price: Optional[float] = Query(default=None, ge=0),
    max_price: Optional[float] = Query(default=None, ge=0),
    listing_type: Optional[str] = Query(default=None, pattern="^(rent|sale)$"),
    service=Depends(get_service),
):
    """FR-05: filter by location, price and listing type using parameterised queries."""
    return await service.search(location, min_price, max_price, listing_type)


@router.get("/properties/{property_id}")
async def get_property(property_id: str, service=Depends(get_service)):
    return await service.get(property_id)


# ---- admin: CRUD -----------------------------------------------------------------
@router.post("/admin/properties", status_code=201)
async def create_property(
    payload: PropertyCreate,
    admin=Depends(require_admin),
    service=Depends(get_service),
):
    return await service.create(payload, admin["id"])


@router.put("/admin/properties/{property_id}")
async def update_property(
    property_id: str,
    payload: PropertyUpdate,
    admin=Depends(require_admin),
    service=Depends(get_service),
):
    return await service.update(property_id, payload)


@router.delete("/admin/properties/{property_id}", status_code=204)
async def delete_property(
    property_id: str,
    admin=Depends(require_admin),
    service=Depends(get_service),
):
    await service.delete(property_id)
    return None
