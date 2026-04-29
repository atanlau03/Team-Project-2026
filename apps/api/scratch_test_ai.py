import torch
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class DetectedColony:
    position_x: float
    position_y: float
    confidence: float
    species_name: str
    morphology: str
    label: str
    bbox_width: Optional[float] = None
    bbox_height: Optional[float] = None
    area_px: Optional[float] = None

class MockBox:
    def __init__(self, cls, conf, xywhn):
        self.cls = torch.tensor(cls)
        self.conf = torch.tensor(conf)
        self.xywhn = torch.tensor(xywhn)

class MockRes:
    def __init__(self, names, boxes):
        self.names = names
        self.boxes = boxes

def test_logic():
    # Mocking YOLO results structure
    names_map = {0: 'Species A', 1: 'Species B'}
    
    # Empty case
    boxes_empty = MockBox([], [], [])
    res_empty = MockRes(names_map, boxes_empty)
    
    # Normal case
    boxes_normal = MockBox([0, 1], [0.9, 0.8], [[0.5, 0.5, 0.1, 0.1], [0.6, 0.6, 0.2, 0.2]])
    res_normal = MockRes(names_map, boxes_normal)
    
    for res in [res_empty, res_normal]:
        print(f"Testing with {len(res.boxes.cls)} boxes")
        boxes = res.boxes
        
        # Logic from ai_inference_service.py
        names = [res.names[cls.item()] for cls in boxes.cls.int()]
        confs = boxes.conf.tolist()
        xywhn_list = boxes.xywhn.tolist()
        
        detected_colonies = []
        for i, xywhn in enumerate(xywhn_list):
            px, py, bw, bh = xywhn
            conf = confs[i]
            species = names[i]
            area = bw * bh
            
            detected_colonies.append(
                DetectedColony(
                    position_x=round(px * 100, 2),
                    position_y=round(py * 100, 2),
                    bbox_width=round(bw * 100, 2),
                    bbox_height=round(bh * 100, 2),
                    area_px=round(area * 10000, 1),
                    confidence=round(conf, 3),
                    species_name=species,
                    morphology="AI Identification",
                    label=f"{species}-{i+1:03d}",
                )
            )
        print(f"Detected {len(detected_colonies)} colonies")

if __name__ == "__main__":
    try:
        test_logic()
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")
