import asyncio
import uuid
from sqlalchemy import select, delete
from app.database import async_session_maker
from app.models.simulator import SimulatorSample, SimulatorSession

# Sample high-quality petri dish images
SAMPLES = [
    {
        "label": "Standard TSA Plate",
        "image_path": "https://lh3.googleusercontent.com/aida-public/AB6AXuD_Le-zFIVLA0crz5XNCOxRskYmygjrWqsomAQT7EdYzGC0RjYGAPFxKs-mTWibOpxR4GvM5U9PPhMhD7WogygV3prbwsYsJNr2zALdnEFR3osLimojObBJnue1fL3HAPvk0zZukVwqev_4lskKmdGKV6RGEW1v-P6kX4LV_wzmh-icaB1HFWUmLcGLJRUJ6J1CzKZ02Ltv0pYR0SVGy9e5jwDDhiY37f-8l7s7tPfp-4f0lMytPxwJIy_eUeOXn-kOrl1SYEV0Xek",
        "ground_truth_count": 42
    },
    {
        "label": "MacConkey Agar",
        "image_path": "https://lh3.googleusercontent.com/aida-public/AB6AXuC_IqfQXscqISKnZ9Yf15hbgi2oFVUlfdG3seC-_WAJoAxBH8lKhsWWssVDnz3gpYBHgoQ48RUC4I8t6BfCRBNUEKT7gJk5eu_7xVxP9ixgn8spGNZfjo4yjnCa5I7HRcy3ptvYIgffM4RD5S_EoA5bv9cVa6oX0KqvIPveTsPrbAUCfgJea9yy0ntHNJqaeqlTG39aAO90KzwUnilww3IlDqxiu8NRsxpRn6MxTn_CE3C_nGKAMkjISeK9t40QeCOVT3MlPtww4Pc",
        "ground_truth_count": 85
    },
    {
        "label": "Blood Agar Culture",
        "image_path": "https://lh3.googleusercontent.com/aida-public/AB6AXuCej7mCZQN6cg1xwlIuJLCutmfPzRF04FPCr9KIGriHYJu6lMxd0VA6bEOlOurSpKBVfRIGMFKU1cSLQKEaIjN_HUIgVqeA3nAZFyIh8uW0bESwze4Q6qGeZTEjwGt8FKxqcev_L42s1h0UjiyDULDUCyy9-9muzTlZF7Our7hHqtKlGJPTEER-KkK6ukPAi-GLqViKN99Er-2nKfc3VjJhwQmvdUOqhTJFbSi9O-Tw7Ct4XWcBRWDJiZVZ7Y3b5f92IHSYNviiO1M",
        "ground_truth_count": 128
    },
    {
        "label": "Mixed Morphology",
        "image_path": "https://lh3.googleusercontent.com/aida-public/AB6AXuDUDGgMbaVIojcQqbdwtY2Og-fxuCCOlhgmeZHdNqLu5iQoxoieUxg2aF1Ce2eEhXnRuZj_lTdgHhTTcj-a86f7vq8i-3kIqdqjys4fn6yaJXbNW987104IhFAGZMYJ2kcnQmzpMqcsgNMYGtY-el6P3vzc-NPK9OSolgx6JX_B8OtVjaWj5lEGd1eSjQgJZTPqflD8whXHYzC3npCwiVt2OYxqUEMpq70BB4MSLbYlPTD-0xcejKHDIPvL5lBF0muJtGNVqIg7qew",
        "ground_truth_count": 56
    }
]

async def seed():
    async with async_session_maker() as db:
        # Clear existing sessions then samples
        print("Clearing existing data...")
        await db.execute(delete(SimulatorSession))
        await db.execute(delete(SimulatorSample))
        
        print(f"Seeding {len(SAMPLES)} simulator samples...")
        for s_data in SAMPLES:
            sample = SimulatorSample(
                label=s_data["label"],
                image_path=s_data["image_path"],
                ground_truth_count=s_data["ground_truth_count"]
            )
            db.add(sample)
        
        await db.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
