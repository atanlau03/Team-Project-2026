import asyncio
from sqlalchemy import update
from app.database import async_session_maker
from app.models.user import User

async def fix():
    async with async_session_maker() as s:
        await s.execute(
            update(User)
            .where(User.email == "admin@platesense.lab")
            .values(is_active=True)
        )
        await s.commit()
        print("[OK] Admin user activated successfully.")

asyncio.run(fix())
