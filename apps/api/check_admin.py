import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User

async def check():
    async with async_session_maker() as s:
        r = await s.execute(select(User.email, User.role, User.is_active, User.is_verified).where(User.email == "admin@platesense.lab"))
        row = r.one_or_none()
        if row:
            print(f"Found: email={row[0]}, role={row[1]}, active={row[2]}, verified={row[3]}")
        else:
            print("User not found")

        # Also test password
        from app.dependencies import UserManager
        from fastapi_users.db import SQLAlchemyUserDatabase
        user_db = SQLAlchemyUserDatabase(s, User)
        um = UserManager(user_db)

        result = await s.execute(select(User).where(User.email == "admin@platesense.lab"))
        user = result.scalar_one_or_none()
        if user:
            verified, updated = um.password_helper.verify_and_update(
                "Admin12345", user.hashed_password
            )
            print(f"Password verify: {verified}")

asyncio.run(check())
