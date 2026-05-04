import asyncio
import uuid
from app.database import async_session_maker
from app.models.user import User
from app.models.user_settings import UserSettings
from fastapi_users.password import PasswordHelper

password_helper = PasswordHelper()

async def create_supervisor():
    email = "supervisor@platesense.lab"
    name = "Lab Supervisor"
    password = "Password123!" # Default password
    
    async with async_session_maker() as session:
        # Check if exists
        from sqlalchemy import select
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar():
            print(f"User {email} already exists.")
            return

        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=name,
            hashed_password=password_helper.hash(password),
            role="lab_manager",
            is_active=True,
            is_verified=True,
        )
        session.add(user)
        await session.flush()
        
        # Add default settings
        settings = UserSettings(user_id=user.id)
        session.add(settings)
        
        await session.commit()
        print(f"✅ Created Supervisor Account: {email} / {password}")

if __name__ == "__main__":
    asyncio.run(create_supervisor())
