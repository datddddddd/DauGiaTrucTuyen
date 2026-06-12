from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import database, models
from schemas.banner import BannerCreate, BannerUpdate, BannerResponse
from routers.auth import get_current_admin

router = APIRouter(prefix="/api/banners", tags=["Banners"])

@router.get("", response_model=List[BannerResponse])
def get_banners(
    db: Session = Depends(database.get_db),
    active_only: bool = False
):
    query = db.query(models.Banner)
    
    if active_only:
        query = query.filter(models.Banner.is_active == True)
    
    banners = query.order_by(models.Banner.order.asc(), models.Banner.created_at.desc()).all()
    
    return [
        {
            "id": b.id,
            "title": b.title,
            "image_url": b.image_url,
            "link_url": b.link_url,
            "is_active": b.is_active,
            "order": b.order,
            "created_at": b.created_at.isoformat() if b.created_at else None
        }
        for b in banners
    ]

@router.get("/{banner_id}", response_model=BannerResponse)
def get_banner(banner_id: int, db: Session = Depends(database.get_db)):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy banner!")
    
    return {
        "id": banner.id,
        "title": banner.title,
        "image_url": banner.image_url,
        "link_url": banner.link_url,
        "is_active": banner.is_active,
        "order": banner.order,
        "created_at": banner.created_at.isoformat() if banner.created_at else None
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_banner(
    banner_data: BannerCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    new_banner = models.Banner(
        title=banner_data.title,
        image_url=banner_data.image_url,
        link_url=banner_data.link_url,
        is_active=banner_data.is_active,
        order=banner_data.order
    )
    db.add(new_banner)
    db.commit()
    db.refresh(new_banner)
    
    return {"status": "success", "message": "Đã tạo banner thành công!", "banner_id": new_banner.id}

@router.put("/{banner_id}")
def update_banner(
    banner_id: int,
    banner_data: BannerUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy banner!")
    
    updates = banner_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật")
    
    for field, value in updates.items():
        if hasattr(banner, field):
            setattr(banner, field, value)
    
    db.commit()
    db.refresh(banner)
    
    return {"status": "success", "message": "Đã cập nhật banner thành công!"}

@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy banner!")
    
    db.delete(banner)
    db.commit()
    
    return {"status": "success", "message": "Đã xóa banner thành công!"}