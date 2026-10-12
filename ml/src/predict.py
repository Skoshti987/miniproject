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

        # Multi-language Sugarcane Disease Knowledge Base
        self.knowledge_base = {
            "Healthy": {
                "summary": "The sugarcane leaf appears healthy with robust green color and no visible disease lesions.",
                "local_names": {
                    "mr": "निरोगी ऊस पान (Healthy Sugarcane Leaf)",
                    "hi": "स्वस्थ गन्ने की पत्ती (Healthy Sugarcane Leaf)",
                    "en": "Healthy Sugarcane Leaf"
                },
                "symptoms": "Uniform deep green foliage, no yellow chlorotic streaks, no fungal pustules or rotting lesions.",
                "risk_factors": "Prolonged dry spells, soil nutrient imbalances, or water stagnation can stress the healthy plant.",
                "actions": [
                    "Maintain balanced NPK fertilizer application according to sugarcane crop stage (e.g. 250:115:115 kg/ha).",
                    "Ensure timely irrigation during tillering and formative grand growth stages.",
                    "Inspect the field weekly for early signs of borer infestation or fungal lesions."
                ],
                "prevention": [
                    "Use certified disease-free seed cane (sett treatment with carbendazim/bio-agents).",
                    "Maintain proper field drainage to prevent waterlogging."
                ],
                "severity": "Low",
                "officer_escalation": "Regular seasonal advisory visits recommended during peak tillering stage."
            },
            "Mosaic": {
                "summary": "Sugarcane Mosaic Virus causes contrasting dark and light green patches/stripes along the leaves.",
                "local_names": {
                    "mr": "ऊस मोझॅक विषाणू रोग (Sugarcane Mosaic Virus)",
                    "hi": "गन्ना मोज़ेक वायरस (Sugarcane Mosaic Virus)",
                    "en": "Sugarcane Mosaic Disease"
                },
                "symptoms": "Contrasting light and dark green mosaic patterns running parallel along the leaf blade, stunting of young shoots.",
                "risk_factors": "Transmitted by aphid vectors (Rhopalosiphum maidis) and use of infected seed setts.",
                "actions": [
                    "Rogue out and destroy infected young plants immediately to stop viral spread across rows.",
                    "Control aphid vectors using recommended neem-based bio-pesticides or approved systemic insecticides.",
                    "Avoid taking seed setts from infected fields for subsequent planting cycles."
                ],
                "prevention": [
                    "Plant mosaic-resistant sugarcane varieties (e.g., Co 86032, CoM 0265, Co 0238).",
                    "Keep field borders clear of wild grass hosts and sorghum borders that harbor aphids."
                ],
                "severity": "Moderate",
                "officer_escalation": "Contact local Krishi Vigyan Kendra (KVK) if infection exceeds 5% of clumps in the field."
            },
            "Red Rot": {
                "summary": "Red Rot (Colletotrichum falcatum) is a devastating fungal disease causing leaf yellowing, midrib reddening, and inner stalk rot.",
                "local_names": {
                    "mr": "ऊसाचा तांबेरा / लाल कुज रोग (Red Rot / Lal Kuj)",
                    "hi": "गन्ने का लाल सड़न रोग (Red Rot Disease)",
                    "en": "Sugarcane Red Rot (Colletotrichum falcatum)"
                },
                "symptoms": "Third or fourth leaf shows loss of green color, midrib exhibits bright red lesions with white center spots, longitudinal split of cane shows red pith with cross-wise white patches and alcoholic odor.",
                "risk_factors": "High humidity (>80%), waterlogging, continuous sugarcane monoculture, and infected setts.",
                "actions": [
                    "Uproot and burn infected clumps immediately along with surrounding root soil; do not leave residues in the field.",
                    "Apply Trichoderma viride or Trichoderma harzianum bio-control agent (5 kg/ha mixed with farmyard manure) around root zones.",
                    "Do not allow irrigation drainage water to flow from infected fields into healthy sugarcane rows."
                ],
                "prevention": [
                    "Hot water treatment of seed setts (50°C for 2 hours or 52°C for 30 mins) before planting.",
                    "Strict 2-year crop rotation with non-host crops such as paddy, green gram, or soybean.",
                    "Plant approved Red-Rot resistant cultivars recommended by VSI Pune or ICAR-SBI."
                ],
                "severity": "High",
                "officer_escalation": "Urgent: Immediately inform your Taluka Agriculture Officer or Sugar Factory Field Supervisor for containment."
            },
            "Rust": {
                "summary": "Sugarcane Rust (Puccinia melanocephala) displays small elongated yellowish-brown pustules on lower leaf surfaces.",
                "local_names": {
                    "mr": "ऊसावरील तांबेरा रोग (Sugarcane Rust Disease)",
                    "hi": "गन्ने का रतुआ रोग (Sugarcane Rust)",
                    "en": "Sugarcane Rust (Puccinia melanocephala)"
                },
                "symptoms": "Tiny, elongated chlorotic flecks on both surfaces that enlarge into brown to orange-brown pustules rupturing the epidermis.",
                "risk_factors": "Cool nights (15-20°C) with high humidity, heavy dew formation, and excessive nitrogenous fertilizer application.",
                "actions": [
                    "Ensure adequate field aeration; strip and burn heavily infected lower dry leaves.",
                    "Avoid excessive top-dressing of nitrogen; balance with potassium (MOP) to improve leaf resistance.",
                    "Apply protective Mancozeb (0.2%) or Copper Oxychloride spray if recommended by local agricultural office."
                ],
                "prevention": [
                    "Cultivate rust-resistant sugarcane cultivars.",
                    "Maintain proper wide row spacing (4 to 5 feet) for optimal sunlight penetration and ventilation."
                ],
                "severity": "Moderate",
                "officer_escalation": "Consult local KVK agronomist if pustules spread to the upper canopy leaves."
            },
            "Yellow": {
                "summary": "Yellow Leaf Disease (SCYLV) causes intense yellowing of the midrib and lamina on the 3rd to 5th leaves from the top.",
                "local_names": {
                    "mr": "पिवळा पान रोग (Sugarcane Yellow Leaf Disease)",
                    "hi": "पीली पत्ती रोग (Sugarcane Yellow Leaf Disease)",
                    "en": "Sugarcane Yellow Leaf Disease (SCYLV)"
                },
                "symptoms": "Prominent yellowing of the leaf midrib on mature leaves, reddish discoloration on the lower midrib surface, shortening of terminal internodes.",
                "risk_factors": "Vector transmission by sugarcane aphid (Melanaphis sacchari) and planting uncertified seed cane.",
                "actions": [
                    "Provide foliar spray of micronutrients (0.5% Ferrous Sulfate + 0.5% Zinc Sulfate + 1% Urea) to mitigate physiological stress.",
                    "Control aphid populations early in the season with recommended bio-pesticides.",
                    "Mark disease-free healthy clumps strictly for future seed sett collection."
                ],
                "prevention": [
                    "Plant tissue-culture derived disease-free plantlets from certified nurseries.",
                    "Maintain optimal soil moisture and avoid severe moisture stress during dry spells."
                ],
                "severity": "Moderate",
                "officer_escalation": "Consult agricultural extension officer for tissue culture sett sourcing for the next planting season."
            }
        }

    def validate_leaf_image(self, image: Image.Image):
        """
        Validates that the uploaded image:
        1. Has sufficient dimensions and valid decoding.
        2. Is not excessively blurry or completely dark/washed out.
        3. Exhibits natural plant/leaf coloration rather than arbitrary non-plant objects.
        """
        w, h = image.size
        if w < 64 or h < 64:
            return False, "Image resolution is too low. Please upload a clear photo of at least 200x200 pixels."

        arr = np.array(image).astype(np.float32)
        std_val = float(np.std(arr))
        mean_val = float(np.mean(arr))

        # Check for nearly blank / washed out / pitch black images
        if std_val < 8.0:
            return False, "Image appears completely blank or unreadable. Please capture a clear sugarcane leaf photo."
        if mean_val < 15.0:
            return False, "Image is too dark to inspect leaf features. Please take a photo in clear daylight."
        if mean_val > 245.0:
            return False, "Image is overexposed and washed out. Please take a clear photo with balanced lighting."

        # Digital Graphic / College Logo / Document Scan / Artificial Canvas checks:
        # Natural leaves possess organic cell/vein textures with micro-gradients across adjacent pixels.
        # Logos, computer graphics, emblems, and scanned documents have large perfectly flat regions,
        # artificial solid borders, and unnaturally uniform white/light backdrops.
        diff_h = np.abs(arr[1:, :, :] - arr[:-1, :, :])
        diff_w = np.abs(arr[:, 1:, :] - arr[:, :-1, :])
        flat_ratio = float((np.mean(np.all(diff_h < 1.0, axis=-1)) + np.mean(np.all(diff_w < 1.0, axis=-1))) / 2.0)
        
        white_ratio = float(np.mean(np.all(arr > 230.0, axis=-1)))
        
        # Check border perimeter for artificial solid framing (e.g., logo on white/black background)
        borders = np.concatenate([arr[0, :, :], arr[-1, :, :], arr[:, 0, :], arr[:, -1, :]], axis=0)
        border_std = float(np.mean(np.std(borders, axis=0)))
        border_is_solid = border_std < 2.5
        border_white_ratio = float(np.mean(np.all(borders > 220.0, axis=-1)))
        border_dark_ratio = float(np.mean(np.all(borders < 35.0, axis=-1)))

        # 1. Digital graphic / Logo detection (flat vector regions, crests, graphics)
        if flat_ratio > 0.65:
            return False, "Invalid image. The uploaded photo appears to be a digital graphic, logo, or document rather than a real sugarcane leaf photo. Please upload a clear photo of an actual sugarcane leaf."

        # 2. Large paper/white backdrop with artificial drawing or logo
        if white_ratio > 0.35:
            return False, "Invalid image. The image contains an artificial white canvas, document, or logo backdrop. Please upload a clear photograph of a sugarcane leaf in the field."

        # 3. Solid uniform borders typical of computer icons, digital graphics, and logos
        if (border_is_solid or border_white_ratio > 0.80 or border_dark_ratio > 0.80) and (white_ratio > 0.18 or flat_ratio > 0.48):
            return False, "Invalid image. The image appears to be an emblem, logo, or artificial graphic. Please upload a genuine photo of a sugarcane leaf."

        # Plant / Leaf color distribution check
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        # Calculate excess green index and yellow-green foliage ratio
        excess_green = float(np.mean(2.0 * g - r - b))
        total_intensity = r + g + b + 1e-6
        green_ratio = float(np.mean(g / total_intensity))
        blue_ratio = float(np.mean(b / total_intensity))
        red_ratio = float(np.mean(r / total_intensity))

        # Strict checks for non-leaf objects:
        # Heavily blue images (sky, blue fabrics, vehicles)
        if blue_ratio > 0.38 and excess_green < 0:
            return False, "Invalid image. The photo does not appear to contain a sugarcane leaf (excessive blue content detected). Please upload a clear photo of a sugarcane leaf."

        # Pure red/magenta objects (red cars, buildings, red clothing)
        if red_ratio > 0.52 and excess_green < -35.0:
            return False, "Invalid image. The photo does not appear to contain a sugarcane leaf. Please upload a clear photo of a sugarcane leaf."

        # Monochrome gray / metal / cement objects
        if abs(excess_green) < 5.0 and std_val < 20.0:
            return False, "Invalid image. The photo appears to be a metal, stone, or monochrome surface. Please upload a clear photo of a sugarcane leaf."

        # For sugarcane leaves (healthy green or diseased yellow/brown/rust):
        # Green excess is positive or leaf shows typical yellow/brown foliage characteristics
        if excess_green < -35.0 and green_ratio < 0.28:
            return False, "Invalid image. The image does not show recognizable sugarcane leaf foliage. Please upload a clear photo of a sugarcane leaf."

        return True, ""

    def predict_image(self, image_input):
        if isinstance(image_input, str):
            image = Image.open(image_input).convert('RGB')
        elif isinstance(image_input, Image.Image):
            image = image_input.convert('RGB')
        else:
            image = Image.open(image_input).convert('RGB')

        # 1. Validation Step
        is_valid_leaf, validation_err = self.validate_leaf_image(image)
        if not is_valid_leaf:
            return {
                "success": False,
                "crop": "sugarcane",
                "status": "invalid_image",
                "valid_leaf": False,
                "disease": None,
                "confidence": None,
                "severity": None,
                "treatment": None,
                "message": validation_err,
                "prediction": None,
                "recommendation": None,
                "model_version": self.model_version
            }

        # 2. Model Inference Step
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
                "summary": f"Detected {predicted_class} condition on sugarcane leaf.",
                "actions": ["Consult your local Krishi Bhavan or agricultural university extension officer."],
                "prevention": ["Maintain standard field hygiene and drainage."],
                "severity": "Moderate"
            })
            return {
                "success": True,
                "status": "valid_leaf",
                "crop": "sugarcane",
                "prediction": {
                    "class": predicted_class,
                    "confidence": round(confidence, 4),
                    "is_confident": True
                },
                "recommendation": {
                    "summary": kb.get("summary", ""),
                    "local_names": kb.get("local_names", {}),
                    "symptoms": kb.get("symptoms", ""),
                    "risk_factors": kb.get("risk_factors", ""),
                    "actions": kb.get("actions", []),
                    "prevention": kb.get("prevention", []),
                    "severity": kb.get("severity", "Moderate"),
                    "officer_escalation": kb.get("officer_escalation", "")
                },
                "model_version": self.model_version
            }
        else:
            return {
                "success": True,
                "status": "uncertain",
                "crop": "sugarcane",
                "prediction": {
                    "class": "Uncertain",
                    "confidence": round(confidence, 4),
                    "is_confident": False,
                    "top_candidate": predicted_class
                },
                "recommendation": {
                    "summary": "Unable to determine the disease reliably from this photo. The visual features are ambiguous or insufficiently distinct.",
                    "actions": [
                        "Upload a closer, well-focused photo showing clear symptoms on the leaf blade.",
                        "Ensure the photograph is taken in bright, diffuse daylight without strong shadows or glare.",
                        "If symptoms spread across multiple stalks, take a leaf sample to your local Krishi Bhavan or Sugar Factory Agronomist for direct testing."
                    ],
                    "prevention": [
                        "Check adjacent rows to verify if multiple plants show similar leaf discoloration."
                    ],
                    "severity": "Low",
                    "officer_escalation": "Contact your local Krishi Vigyan Kendra for in-person identification."
                },
                "model_version": self.model_version
            }

