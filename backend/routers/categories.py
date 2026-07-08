from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import database, models
from schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from routers.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(database.get_db)):
    categories = db.query(models.Category).all()
    
    # Organize categories hierarchically (parent categories followed by their subcategories)
    parents = [c for c in categories if c.parent_id is None]
    subcategories = [c for c in categories if c.parent_id is not None]
    
    ordered_categories = []
    for p in parents:
        ordered_categories.append(p)
        # Find subcategories of this parent
        subs = [s for s in subcategories if s.parent_id == p.id]
        ordered_categories.extend(subs)
        
    # Append any orphans just in case
    for c in categories:
        if c not in ordered_categories:
            ordered_categories.append(c)
            
    result = []
    for cat in ordered_categories:
        product_count = db.query(models.Product).filter(models.Product.category_id == cat.id).count()
        # If it's a parent category, sum up the products in all of its subcategories too
        if cat.parent_id is None:
            sub_ids = [s.id for s in subcategories if s.parent_id == cat.id]
            if sub_ids:
                sub_count = db.query(models.Product).filter(models.Product.category_id.in_(sub_ids)).count()
                product_count += sub_count
                
        result.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "parent_id": cat.parent_id,
            "product_count": product_count
        })
    
    return result

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(database.get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    product_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    # Sum subcategories count if it's a parent
    if category.parent_id is None:
        sub_ids = db.query(models.Category.id).filter(models.Category.parent_id == category_id).all()
        sub_ids = [s[0] for s in sub_ids]
        if sub_ids:
            sub_count = db.query(models.Product).filter(models.Product.category_id.in_(sub_ids)).count()
            product_count += sub_count
            
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "parent_id": category.parent_id,
        "product_count": product_count
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    # Check if category name already exists
    existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Danh mục với tên này đã tồn tại!"
        )
    
    new_category = models.Category(
        name=category_data.name,
        description=category_data.description,
        parent_id=category_data.parent_id
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return {"status": "success", "message": "Đã tạo danh mục thành công!", "category_id": new_category.id}

@router.put("/{category_id}")
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    updates = category_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật")
    
    for field, value in updates.items():
        if hasattr(category, field):
            setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return {"status": "success", "message": "Đã cập nhật danh mục thành công!"}

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy danh mục!")
    
    # Check if category has products
    product_count = db.query(models.Product).filter(models.Product.category_id == category_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Không thể xóa danh mục này vì vẫn còn {product_count} sản phẩm!"
        )
    
    db.delete(category)
    db.commit()
    
    return {"status": "success", "message": "Đã xóa danh mục thành công!"}