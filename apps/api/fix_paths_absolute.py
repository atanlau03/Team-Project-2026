import asyncio
import os
from sqlalchemy import select
from app.database import async_session_maker
from app.models.simulator import SimulatorSample
from app.config import settings

async def fix():
    async with async_session_maker() as db:
        res = await db.execute(select(SimulatorSample))
        samples = res.scalars().all()
        count = 0
        for s in samples:
            # If it's a local path, ensure it starts with /uploads/
            if not s.image_path.startswith('http'):
                # Strip leading slashes first
                clean_path = s.image_path.lstrip('/')
                # If it already starts with uploads/, just ensure leading slash
                if clean_path.startswith('uploads/'):
                    s.image_path = f"/{clean_path}"
                else:
                    # It might be just plates/xxx.jpg
                    s.image_path = f"/uploads/{clean_path}"
                count += 1
        await db.commit()
        print(f"FIXED {count} paths to absolute URL paths.")

if __name__ == "__main__":
    asyncio.run(fix())
