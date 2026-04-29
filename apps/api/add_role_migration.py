"""Add role column to user table."""
import asyncio
from sqlalchemy import text
from app.database import async_session_maker


async def migrate():
    async with async_session_maker() as session:
        # Check if column exists
        result = await session.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'user' AND column_name = 'role'"
        ))
        if result.scalar():
            print("Column 'role' already exists. Skipping.")
            return

        # Add role column
        await session.execute(text(
            "ALTER TABLE \"user\" ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'researcher'"
        ))
        await session.commit()
        print("✅ Added 'role' column to user table (default: 'researcher')")


if __name__ == "__main__":
    asyncio.run(migrate())
