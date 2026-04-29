import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User

async def check():
    async with async_session_maker() as s:
        result = await s.execute(select(User.email, User.organization_id))
        for row in result.all():
            print(f"{row[0]}: org={row[1]}")

asyncio.run(check())
