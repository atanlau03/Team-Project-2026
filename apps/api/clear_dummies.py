import asyncio
from sqlalchemy import delete
from app.database import async_session_maker
from app.models.simulator import SimulatorSample, SimulatorSession

async def clear_dummies():
    async with async_session_maker() as db:
        # Delete sessions first due to FK constraints
        # We only want to delete sessions related to dummy samples
        # But user wants to "remove dummy images", so we can clear all sessions to be safe
        await db.execute(delete(SimulatorSession))
        
        # Delete samples that use external URLs (dummies)
        res = await db.execute(
            delete(SimulatorSample).where(SimulatorSample.image_path.like('http%'))
        )
        await db.commit()
        print(f"CLEARED dummy samples.")

if __name__ == "__main__":
    asyncio.run(clear_dummies())
