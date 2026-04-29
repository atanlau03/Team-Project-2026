"""
CLI command to create the first Admin user.

Usage:
    python -m app.cli.seed_admin --email admin@lab.com --password SecureP@ss123 --name "Lab Admin"

This command will:
1. Check if any Admin user already exists
2. If yes → refuse (print message)
3. If no → create a new user with role='admin'
"""
import asyncio
import argparse

from sqlalchemy import select, func

from app.database import async_session_maker, engine
from app.models.user import User
from app.database import Base  # noqa - ensure base is available


async def seed_admin(email: str, password: str, name: str):
    """Create the first admin user if none exists."""
    from app.dependencies import UserManager
    from fastapi_users.db import SQLAlchemyUserDatabase
    from fastapi_users import schemas

    async with async_session_maker() as session:
        # Check if any admin exists
        count = (
            await session.execute(
                select(func.count(User.id)).where(User.role == "admin")
            )
        ).scalar() or 0

        if count > 0:
            print("[X] An admin user already exists.")
            print("    Use the Admin Panel to manage roles.")
            return

        # Create admin user via the UserManager
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager = UserManager(user_db)

        class AdminCreate(schemas.BaseUserCreate):
            full_name: str
            role: str = "admin"

        admin_create = AdminCreate(
            email=email,
            password=password,
            full_name=name,
        )

        # Build the user dict manually
        create_dict = {
            "email": email,
            "hashed_password": user_manager.password_helper.hash(password),
            "full_name": name,
            "role": "admin",
            "is_active": True,
            "is_superuser": True,
            "is_verified": True,
        }

        user = User(**create_dict)
        session.add(user)
        await session.flush()

        # Create default settings
        from app.models.user_settings import UserSettings
        user_settings = UserSettings(user_id=user.id)
        session.add(user_settings)

        await session.commit()

        print(f"[OK] Admin user created successfully!")
        print(f"     Email:    {email}")
        print(f"     Name:     {name}")
        print(f"     Role:     admin")
        print(f"")
        print(f"     You can now log in at the PlateSense web app.")


def main():
    parser = argparse.ArgumentParser(description="Create the first PlateSense admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password (min 8 chars)")
    parser.add_argument("--name", required=True, help="Admin full name")
    args = parser.parse_args()

    if len(args.password) < 8:
        print("[X] Password must be at least 8 characters.")
        return

    asyncio.run(seed_admin(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
