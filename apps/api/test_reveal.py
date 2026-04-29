import asyncio
import uuid
from sqlalchemy import select
from app.database import async_session_maker
from app.models.simulator import SimulatorSession, SimulatorSample
from app.services import simulator_service

async def test_reveal():
    async with async_session_maker() as db:
        # Get a session that has a manual count
        res = await db.execute(select(SimulatorSession).where(SimulatorSession.manual_count != None).limit(1))
        session = res.scalar_one_or_none()
        
        if not session:
            # Create a mock session if none exists
            res = await db.execute(select(SimulatorSample).limit(1))
            sample = res.scalar_one_or_none()
            if not sample:
                print("No samples found.")
                return
            
            # Need a user
            from app.models.user import User
            res = await db.execute(select(User).limit(1))
            user = res.scalar_one_or_none()
            if not user:
                print("No user found.")
                return

            session = SimulatorSession(user_id=user.id, sample_image_id=sample.id, manual_count=50, manual_time_ms=10000)
            db.add(session)
            await db.commit()
            await db.refresh(session)
            print(f"Created session {session.id}")

        print(f"Testing reveal for session {session.id}")
        try:
            result = await simulator_service.reveal_ai_result(db, session.id, session.user_id)
            print(f"RESULT: ai_count={result.ai_count}, ai_time_ms={result.ai_time_ms}")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_reveal())
