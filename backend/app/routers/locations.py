from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse, LocationTree
from app.utils.dependencies import get_current_admin

router = APIRouter(prefix="/api/locations", tags=["Locations"])


def build_tree(locations: List[Location]) -> List[LocationTree]:
    by_id = {}
    for loc in locations:
        node = LocationTree(
            id=loc.id,
            name=loc.name,
            description=loc.description,
            parent_id=loc.parent_id,
            slug=loc.slug,
            display_order=loc.display_order,
            created_at=loc.created_at,
            updated_at=loc.updated_at,
            children=[],
        )
        by_id[loc.id] = node
    roots = []
    for loc in locations:
        node = by_id[loc.id]
        if loc.parent_id and loc.parent_id in by_id:
            by_id[loc.parent_id].children.append(node)
        else:
            roots.append(node)
    return roots


@router.get("", response_model=List[LocationTree])
def get_locations(db: Session = Depends(get_db)):
    locations = db.query(Location).order_by(Location.display_order, Location.name).all()
    return build_tree(locations)


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(data: LocationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    loc = Location(**data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(location_id: int, data: LocationUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(loc, key, value)
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return None
