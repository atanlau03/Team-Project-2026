import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.simulator import SimulatorSample

async def check():
    try:
        async with async_session_maker() as db:
            res = await db.execute(select(SimulatorSample))
            samples = res.scalars().all()
            print(f"COUNT:{len(samples)}")
            for s in samples:
                print(f"ID:{s.id}, Name:{s.name}")
    except Exception as e:
        print(f"ERROR:{e}")

if __name__ == "__main__":
    asyncio.run(check())
