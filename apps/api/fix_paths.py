import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.simulator import SimulatorSample

async def fix():
    async with async_session_maker() as db:
        res = await db.execute(select(SimulatorSample))
        samples = res.scalars().all()
        count = 0
        for s in samples:
            if not s.image_path.startswith('uploads/') and not s.image_path.startswith('http'):
                s.image_path = f"uploads/{s.image_path}"
                count += 1
        await db.commit()
        print(f"FIXED {count} paths.")

if __name__ == "__main__":
    asyncio.run(fix())
