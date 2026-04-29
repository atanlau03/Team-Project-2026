import os
import sys

try:
    from ultralytics import YOLO
    print("Ultralytics imported successfully")
except ImportError:
    print("Ultralytics NOT installed")
    sys.exit(1)

model_path = r"d:\project SE\apps\api\app\models\best.pt"
print(f"Checking path: {model_path}")
print(f"Exists: {os.path.exists(model_path)}")
print(f"Is Dir: {os.path.isdir(model_path)}")

try:
    print("Attempting to load model...")
    model = YOLO(model_path)
    print("Model loaded successfully!")
    print(f"Model names: {model.names}")
except Exception as e:
    print(f"ERROR loading model: {e}")
