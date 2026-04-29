import os
from ultralytics import YOLO

model_path = r"d:\project SE\apps\api\app\models\best.pt"

try:
    print(f"Attempting to load model from: {model_path}")
    model = YOLO(model_path)
    print("SUCCESS: Loaded model directly from directory!")
    print(f"Names: {model.names}")
except Exception as e:
    print(f"FAILURE: Could not load from directory. Error: {e}")
    
    # Try zipping it?
    import zipfile
    zip_path = r"d:\project SE\apps\api\app\models\best_zipped.pt"
    print(f"Attempting to zip to: {zip_path}")
    
    try:
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(model_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, model_path)
                    zipf.write(file_path, rel_path)
        
        print("Zip created. Attempting to load zip...")
        model = YOLO(zip_path)
        print("SUCCESS: Loaded model from zip!")
        print(f"Names: {model.names}")
    except Exception as e2:
        print(f"FAILURE: Could not load from zip. Error: {e2}")
