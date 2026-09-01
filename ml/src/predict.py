import os
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np

MODELS_DIR = r'd:\Sem 3\Miniproject\ml\models'
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class SugarcanePredictor:
    def __init__(self, confidence_threshold=0.60):
        self.confidence_threshold = confidence_threshold
        self.model_path = os.path.join(MODELS_DIR, 'sugarcane_disease_model.pt')
        self.metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')

        if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
            raise FileNotFoundError("Trained sugarcane disease model or metadata not found!")

        with open(self.metadata_path, 'r') as f:
            self.metadata = json.load(f)

        self.classes = self.metadata['classes']
        self.model_version = self.metadata.get('model_version', '1.0.0')

        self.model = models.mobilenet_v3_small(weights=None)
        in_features = self.model.classifier[3].in_features
        self.model.classifier[3] = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, len(self.classes))
        )
        self.model.load_state_dict(torch.load(self.model_path, map_location=DEVICE))
        self.model = self.model.to(DEVICE)
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        # Sugarcane Disease Knowledge Base
        self.knowledge_base = {
            "Healthy": {
                "summary": "The sugarcane leaf appears healthy with no visible signs of disease.",
                "actions": [
                    "Maintain balanced NPK fertilizer application according to crop stage.",
                    "Ensure timely irrigation during tillering and grand growth phases.",
                    "Inspect crop regularly for early signs of pests or disease."
                ],
                "prevention": [
                    "Use certified disease-free seed cane (sett treatment).",
                    "Maintain proper field drainage to prevent waterlogging."
                ],
                "severity": "Low"
            },
            "Mosaic": {
                "summary": "Sugarcane Mosaic Virus causes contrasting dark and light green patches/stripes along the leaves.",
                "actions": [
                    "Rogue out and destroy infected young plants to stop viral spread.",
                    "Control aphid vectors using recommended neem-based bio-pesticides.",
                    "Avoid taking seed setts from infected fields for next planting cycle."
                ],
                "prevention": [
                    "Plant mosaic-resistant sugarcane varieties (e.g., Co 86032, Co 0238).",
                    "Keep field borders clear of wild grass hosts."
                ],
                "severity": "Moderate"
            },
            "Red Rot": {
                "summary": "Red Rot (Colletotrichum falcatum) causes leaf yellowing, reddening of inner tissue, and sour alcoholic smell.",
                "actions": [
                    "Uproot and burn infected clumps immediately along with surrounding soil.",
                    "Apply Trichoderma viride bio-control agent around root zones.",
                    "Do not allow irrigation water to flow from infected fields to healthy fields."
                ],
                "prevention": [
                    "Hot water treatment of seed setts (50°C for 2 hours) before planting.",
                    "Practice 2-year crop rotation with non-host crops like rice or pulses.",
                    "Avoid waterlogging in field rows."
                ],
                "severity": "High"
            },
            "Rust": {
                "summary": "Sugarcane Rust (Puccinia melanocephala) displays small elongated yellowish-brown spots/pustules on lower leaf surfaces.",
                "actions": [
                    "Ensure adequate field aeration and avoid excess nitrogen fertilizer.",
                    "Remove heavily infected lower leaves and burn them.",
                    "Apply protective copper/sulfur-based fungicide sprays as advised by local Krishi Bhavan."
                ],
                "prevention": [
                    "Cultivate rust-resistant sugarcane cultivars.",
                    "Maintain proper row spacing (4 to 5 feet) for optimal sunlight and ventilation."
                ],
                "severity": "Moderate"
            },
            "Yellow": {
                "summary": "Yellow Leaf Virus (SCYLV) causes intense yellowing of the midrib on 3rd to 5th leaves from top.",
                "actions": [
                    "Provide balanced potash and micronutrient spray (Zinc/Iron) to reduce stress.",
                    "Control aphid vectors early in the season.",
                    "Mark disease-free healthy clumps for seed collection."
                ],
                "prevention": [
                    "Plant tissue-culture derived disease-free plantlets.",
                    "Maintain proper soil moisture during hot summer months."
                ],
                "severity": "Moderate"
            }
        }

    def predict_image(self, image_input):

        if isinstance(image_input, str):
            image = Image.open(image_input).convert('RGB')
        elif isinstance(image_input, Image.Image):
            image = image_input.convert('RGB')
        else:
            image = Image.open(image_input).convert('RGB')

        input_tensor = self.transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            top_prob, top_idx = torch.max(probabilities, dim=0)

        confidence = float(top_prob.cpu().numpy())
        predicted_class = self.classes[top_idx.item()]

        is_confident = confidence >= self.confidence_threshold

        if is_confident:
            kb = self.knowledge_base.get(predicted_class, {
                "summary": f"Detected {predicted_class} condition.",
                "actions": ["Consult local agricultural officer for field inspection."],
                "prevention": ["Maintain proper crop hygiene."],
                "severity": "Moderate"
            })
            return {
                "success": True,
                "crop": "sugarcane",
                "prediction": {
                    "class": predicted_class,
                    "confidence": round(confidence, 4),
                    "is_confident": True
                },
                "recommendation": {
                    "summary": kb["summary"],
                    "actions": kb["actions"],
                    "prevention": kb["prevention"],
                    "severity": kb["severity"]
                },
                "model_version": self.model_version
            }
        else:
            return {
                "success": True,
                "crop": "sugarcane",
                "prediction": {
                    "class": "Uncertain",
                    "confidence": round(confidence, 4),
                    "is_confident": False,
                    "top_candidate": predicted_class
                },
                "recommendation": {
                    "summary": "KrishSathi could not confidently identify the leaf condition from this image.",
                    "actions": [
                        "Upload a clearer, well-lit photo focusing closely on affected leaf symptoms.",
                        "Ensure the image is taken in bright daylight without harsh shadows.",
                        "Consult your local Krishi Bhavan officer for an in-person field diagnostic."
                    ],
                    "prevention": [
                        "Take multiple photos from different angles if symptoms persist."
                    ],
                    "severity": "Low"
                },
                "model_version": self.model_version
            }
