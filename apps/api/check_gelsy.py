import asyncio
from app.database import async_session_maker
from app.models.user import User
from app.models.analysis import Analysis
from sqlalchemy import select, func

async def check():
    async with async_session_maker() as s:
        stmt = select(User.full_name, User.email, func.count(Analysis.id)).outerjoin(Analysis, User.id == Analysis.user_id).where(User.email.ilike('%gelsy6767%') | User.full_name.ilike('%gelsy6767%')).group_by(User.id)
        res = await s.execute(stmt)
        print(res.all())

asyncio.run(check())
