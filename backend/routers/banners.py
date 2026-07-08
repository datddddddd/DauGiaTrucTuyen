import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional

import database, models
from schemas.banner import BannerResponse
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
    title: str = Form(...),
    link_url: Optional[str] = Form(None),
    is_active: bool = Form(True),
    order: int = Form(0),
    file: UploadFile = File(...),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)

    filename = file.filename.replace(" ", "_")
    path = os.path.join(upload_dir, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/static/uploads/{filename}"

    new_banner = models.Banner(
        title=title,
        image_url=image_url,
        link_url=link_url,
        is_active=is_active,
        order=order
    )
    db.add(new_banner)
    db.commit()
    db.refresh(new_banner)
    
    return {"status": "success", "message": "Đã tạo banner thành công!", "banner_id": new_banner.id}

@router.put("/{banner_id}")
def update_banner(
    banner_id: int,
    title: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    is_active: Optional[bool] = Form(None),
    order: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy banner!")
    
    if title is not None:
        banner.title = title
    if link_url is not None:
        banner.link_url = link_url
    if is_active is not None:
        banner.is_active = is_active
    if order is not None:
        banner.order = order
        
    if file is not None:
        upload_dir = "static/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        filename = file.filename.replace(" ", "_")
        path = os.path.join(upload_dir, filename)
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        banner.image_url = f"/static/uploads/{filename}"
    
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