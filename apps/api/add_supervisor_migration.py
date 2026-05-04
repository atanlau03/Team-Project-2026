"""Add supervisor_id column to user table."""
import asyncio
from sqlalchemy import text
from app.database import async_session_maker


async def migrate():
    async with async_session_maker() as session:
        # Check if column exists
        result = await session.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'user' AND column_name = 'supervisor_id'"
        ))
        if result.scalar():
            print("Column 'supervisor_id' already exists. Skipping.")
        else:
            # Add supervisor_id column
            await session.execute(text(
                "ALTER TABLE \"user\" ADD COLUMN supervisor_id UUID REFERENCES \"user\"(id)"
            ))
            await session.commit()
            print("✅ Added 'supervisor_id' column to user table.")

if __name__ == "__main__":
    asyncio.run(migrate())
