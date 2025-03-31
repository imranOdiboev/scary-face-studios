# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import models, database
from sqlalchemy.exc import IntegrityError

app = FastAPI()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True

async def check_unique_user(db: AsyncSession, username: str, email: str):

    # Проверка уникальности username и email
    existing_user = await db.execute(
        select(models.User).where(
            (models.User.username == username) | 
            (models.User.email == email)
        )
    )
    if existing_user.scalar():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

@app.post("/register/", response_model=UserResponse)
async def register_user(
    user_data: UserCreate, 
    db: AsyncSession = Depends(database.get_db)
):
    try:
        # Проверка уникальности
        await check_unique_user(db, user_data.username, user_data.email)
        
        # Хэширование пароля
        hashed_password = user_data.password
        
        # Создание пользователя
        new_user = models.User(
            username=user_data.username,
            email=user_data.email,
            password=hashed_password
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return new_user
        
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )