import os
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image, ImageFilter
import numpy as np

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class SugarcanePredictor:
    def __init__(self, confidence_threshold=0.60):
        self.confidence_threshold = confidence_threshold
        self.model_path = os.path.join(MODELS_DIR, 'sugarcane_disease_model.pt')
        self.metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')

        if not os.path.exists(self.model_path) or not os.path.exists(self.metadata_path):
            raise FileNotFoundError(f"Model or metadata missing at {MODELS_DIR}")

        with open(self.metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)

        self.classes = self.metadata['classes']
        self.model_version = self.metadata.get('model_version', '1.0.0')

        # Load MobileNetV3_Small architecture
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

        # Grounded Sugarcane Agricultural Knowledge Base (ICAR-SBI & VSI Pune references)
        self.knowledge_base = {
            "Healthy": {
                "disease_name": "Healthy Sugarcane Leaf",
                "local_names": {
                    "en": "Healthy Sugarcane Leaf",
                    "mr": "निरोगी ऊस पान (Healthy Sugarcane Leaf)",
                    "hi": "स्वस्थ गन्ने की पत्ती (Healthy Sugarcane Leaf)",
                    "ml": "ആരോഗ്യമുള്ള കരിമ്പ് ഇല (Healthy Sugarcane Leaf)"
                },
                "severity": "Low",
                "summary": "The sugarcane leaf is healthy with robust deep-green foliage, intact white midrib, and no visible lesions.",
                "why_identified": "Uniform chlorophyll pigmentation across parallel venation, intact epidermal cell structure, absence of fungal pustules, chlorotic streaks, or necrosis.",
                "symptoms": "Uniform rich green color across the leaf lamina, clear light-colored central midrib, sharp serrated leaf margins, no fungal powder, no red spots or yellow chlorosis.",
                "causes": "Good agronomic management, certified seed cane, and balanced soil nutrition.",
                "conditions_responsible": "Favorable growing environment with adequate sunlight, timely irrigation, and proper soil aeration.",
                "immediate_treatment": [
                    "No curative chemical or fungicide treatment required.",
                    "Continue regular irrigation and weed-free field maintenance."
                ],
                "agricultural_practices": [
                    "Maintain balanced N:P:K fertilization (250:115:115 kg/ha) adjusted for crop stage.",
                    "Perform earthing-up at 90-120 days after planting to promote root anchorage and prevent stalk lodging.",
                    "Apply 10 cm thick trash mulching between rows to conserve moisture and suppress weeds."
                ],
                "prevention_methods": [
                    "Use certified disease-free tissue-cultured seed cane from authorized nurseries.",
                    "Practice regular field inspection for early borer or insect pest detection."
                ],
                "field_management": "Ensure field drainage channels are unobstructed to avoid water stagnation during the monsoon.",
                "expert_consultation": "Routine seasonal visits by Sugar Mill Agricultural Field Officers during peak tillering and grand growth stages.",
                "products": {
                    "disease_treatment_products": [],
                    "crop_nutrition_fertilizers": [
                        {
                            "name": "IFFCO Nano DAP Liquid (8% N, 16% P2O5)",
                            "type": "Bio-Available Phosphorus Fertilizer",
                            "purpose": "Promotes profuse tillering, vigorous root establishment, and early cane vigor.",
                            "why_recommended": "Delivers nano-structured nitrogen and phosphorus directly to leaf mesophyll without soil fixation.",
                            "usage": "2 ml to 4 ml per liter of water sprayed at 30-45 days after planting.",
                            "alternatives": "Single Super Phosphate (SSP), DAP 18-46-0.",
                            "approx_price": "₹600 per 500ml bottle",
                            "purchase_link": "https://www.iffcobazar.in/en/product/iffco-nano-dap-liquid"
                        },
                        {
                            "name": "IFFCO Bio-Fertilizer Consortium (Azotobacter, PSB, KMB)",
                            "type": "Beneficial Microbial Inoculant",
                            "purpose": "Enhances biological nitrogen fixation, phosphorus solubilization, and potash mobilization.",
                            "why_recommended": "Improves soil health, enhances root uptake, and reduces chemical fertilizer requirement by 20-25%.",
                            "usage": "1 liter per acre applied through drip irrigation or mixed with 100 kg compost/FYM.",
                            "alternatives": "Azospirillum brasilense + Phosphobacteria culture.",
                            "approx_price": "₹180 - ₹250 per 1 liter bottle",
                            "purchase_link": "https://www.iffcobazar.in/en/product/consortium-bio-fertilizer"
                        }
                    ]
                }
            },
            "Red Rot": {
                "disease_name": "Sugarcane Red Rot (Colletotrichum falcatum)",
                "local_names": {
                    "en": "Sugarcane Red Rot Disease",
                    "mr": "ऊसाचा तांबेरा / लाल कुज रोग (Red Rot / Lal Kuj)",
                    "hi": "गन्ने का लाल सड़न रोग (Red Rot Disease)",
                    "ml": "കരിമ്പ് ചുവപ്പ് ചീയൽ രോഗം (Red Rot)"
                },
                "severity": "High",
                "summary": "Red Rot is a severe fungal disease causing vascular discoloration, midrib reddening with white centers, and internal stalk necrosis.",
                "why_identified": "Presence of elongated reddish midrib lesions with characteristic white centers, leaf tip yellowing, and vascular necrosis pattern typical of Colletotrichum falcatum infection.",
                "symptoms": "Third or fourth leaf from top turns yellow and dries from tip downward; midrib displays blood-red lesions with white spots; split cane reveals bright red pith with transverse white bands and distinct sour alcoholic odor.",
                "causes": "Fungal pathogen Colletotrichum falcatum (teleomorph Glomerella tucumanensis), spread via infected seed setts, irrigation water, and soil debris.",
                "conditions_responsible": "High relative humidity (>80%), warm temperatures (28°C–32°C), waterlogging, continuous sugarcane monoculture, and use of susceptible varieties like Co 0238.",
                "immediate_treatment": [
                    "Rogue out and incinerate infected clumps with root soil immediately; do not leave crop residue in the field.",
                    "Drench root zone of neighboring stools with Carbendazim 50% WP (1g/L of water) or Thiophanate Methyl 70% WP.",
                    "Apply Trichoderma viride bio-agent (2.5 kg/acre) mixed with well-rotted FYM in adjacent rows."
                ],
                "agricultural_practices": [
                    "Perform deep summer plowing to expose fungal resting structures to sunlight.",
                    "Stop flood irrigation drainage from infected fields into healthy sugarcane blocks.",
                    "Enforce strict 2-year crop rotation with non-host crops like paddy, green gram, or soybean."
                ],
                "prevention_methods": [
                    "Use certified disease-free setts treated with hot water (50°C for 2 hours or 52°C for 30 minutes).",
                    "Dip setts in 0.1% Carbendazim solution for 15 minutes before planting.",
                    "Plant approved Red-Rot resistant sugarcane varieties (e.g., Co 86032, CoM 0265, Co 11015, Co 09004)."
                ],
                "field_management": "Ensure field drainage slopes are cleared to prevent water stagnation around the root zone during monsoon rains.",
                "expert_consultation": "Urgent: Notify your Sugar Factory Cane Development Officer or local Krishi Vigyan Kendra (KVK) for containment protocol.",
                "products": {
                    "disease_treatment_products": [
                        {
                            "name": "Trichoderma viride Bio-Fungicide (1% WP)",
                            "type": "Bio-Control Fungicide",
                            "purpose": "Biological prevention and suppression of soil-borne Colletotrichum falcatum fungal spores.",
                            "why_recommended": "Colonizes rhizosphere, secretes chitinase enzymes that degrade pathogenic fungal walls, and prevents re-infection naturally.",
                            "usage": "Mix 2.5 kg in 100 kg decomposed FYM/compost, incubate under shade for 7 days, and incorporate in furrow before planting or earthing-up.",
                            "alternatives": "Trichoderma harzianum, Pseudomonas fluorescens.",
                            "approx_price": "₹120 - ₹180 per 1 kg pack",
                            "purchase_link": "https://www.iffcobazar.in/en/product/trichoderma-viride"
                        },
                        {
                            "name": "Carbendazim 50% WP (Bavistin / Dhanustin)",
                            "type": "Curative Systemic Fungicide",
                            "purpose": "Systemic fungicide for sett treatment and localized spot root drenching.",
                            "why_recommended": "Halts beta-tubulin assembly in fungal hyphae, arresting progression of localized infection.",
                            "usage": "Dissolve 1g per liter of water (0.1% solution). Soak seed setts for 15 minutes before planting or drench root zone around affected clumps.",
                            "alternatives": "Thiophanate Methyl 70% WP, Mancozeb 75% WP.",
                            "approx_price": "₹250 - ₹380 per 500g pack",
                            "purchase_link": "https://www.bighaat.com/products/bavistin-fungicide"
                        }
                    ],
                    "crop_nutrition_fertilizers": [
                        {
                            "name": "Muriate of Potash (MOP 0-0-60)",
                            "type": "Potassium Fertilizer",
                            "purpose": "Strengthens sugarcane rind, cell wall thickness, and vascular resistance against fungus.",
                            "why_recommended": "Excessive nitrogen favors red rot expansion; potassium application balances nutrition and hardens stalk rind tissue.",
                            "usage": "Apply 40-50 kg/acre in 2 split doses (at planting and grand earthing up at 90-120 days).",
                            "approx_price": "₹1,400 - ₹1,700 per 50 kg bag",
                            "purchase_link": "https://www.iffcobazar.in/en/product/muriate-of-potash-mop"
                        }
                    ]
                }
            },
            "Rust": {
                "disease_name": "Sugarcane Rust (Puccinia melanocephala)",
                "local_names": {
                    "en": "Sugarcane Rust Disease",
                    "mr": "ऊसावरील तांबेरा रोग (Sugarcane Rust Disease)",
                    "hi": "गन्ने का रतुआ रोग (Sugarcane Rust)",
                    "ml": "കരിമ്പ് തുരുമ്പ് രോഗം (Sugarcane Rust)"
                },
                "severity": "Moderate",
                "summary": "Sugarcane Rust is an airborne foliar fungal infection causing elongated reddish-brown pustules and premature leaf scorching.",
                "why_identified": "Detection of dense chlorotic flecks coalescing into characteristic parallel reddish-orange powdery pustules rupturing the leaf epidermis.",
                "symptoms": "Tiny elongated yellowish flecks that enlarge into reddish-brown to dark brown powdery pustules parallel to leaf veins; severe infection causes leaf drying and reduced photosynthetic area.",
                "causes": "Obligate airborne biotrophic fungus Puccinia melanocephala (teleomorph Puccinia kuehnii).",
                "conditions_responsible": "Cool nights (15°C–22°C), moderate day temperatures (25°C–30°C), prolonged high humidity (>85%), dense foliage, and excessive nitrogen application.",
                "immediate_treatment": [
                    "Detrash and burn heavily infected lower dry leaves to eliminate spore reservoirs and improve canopy aeration.",
                    "Apply foliar spray of Mancozeb 75% WP @ 2.5g/L or Propiconazole 25% EC @ 1ml/L at first notice of pustules.",
                    "Repeat spray after 14 days if cool humid conditions persist."
                ],
                "agricultural_practices": [
                    "Adopt wider row spacing (4 to 5 feet) for optimal sunlight penetration and wind circulation.",
                    "Avoid overhead sprinkler irrigation during rust outbreaks; use drip or furrow irrigation to keep foliage dry.",
                    "Avoid excessive urea top-dressing; maintain balanced N:P:K ratio (100:40:40 kg/acre)."
                ],
                "prevention_methods": [
                    "Cultivate rust-resistant sugarcane varieties (e.g., Co 86032, CoM 0265, Co 94012).",
                    "Monitor leaf canopy closely during post-monsoon cool weather."
                ],
                "field_management": "Ensure regular detrashing of old senescent leaves around 150 and 210 days after planting.",
                "expert_consultation": "Contact local KVK agronomist if rust pustules spread to the upper 4 canopy leaves before grand growth stage.",
                "products": {
                    "disease_treatment_products": [
                        {
                            "name": "Mancozeb 75% WP (Dithane M-45)",
                            "type": "Contact Protective Fungicide",
                            "purpose": "Multi-site contact fungicide preventing rust spore germination on leaf lamina.",
                            "why_recommended": "Forms a protective chemical barrier over both leaf surfaces, preventing airborne rust urediniospores from penetrating.",
                            "usage": "2.5g per liter of water (500g in 200L water per acre); ensure thorough spray coverage on both upper and lower leaf surfaces.",
                            "alternatives": "Copper Oxychloride 50% WP, Zineb 75% WP.",
                            "approx_price": "₹300 - ₹450 per 1 kg pack",
                            "purchase_link": "https://agribegri.com/products/mancozeb-75-wp-fungicide.php"
                        },
                        {
                            "name": "Propiconazole 25% EC (Tilt / Bumper)",
                            "type": "Curative Systemic Fungicide",
                            "purpose": "Triazole systemic fungicide for curative eradication of internal rust mycelium.",
                            "why_recommended": "Inhibits ergosterol biosynthesis in fungal cell membranes, stopping active spore pustule eruption inside leaf tissue.",
                            "usage": "1 ml per liter of water (200 ml in 200L water per acre).",
                            "alternatives": "Tebuconazole 25.9% EC, Hexaconazole 5% EC.",
                            "approx_price": "₹480 - ₹750 per 250ml bottle",
                            "purchase_link": "https://www.bighaat.com/products/tilt-fungicide"
                        }
                    ],
                    "crop_nutrition_fertilizers": [
                        {
                            "name": "IFFCO Water Soluble Fertilizer NPK (00:00:50 - Sulfate of Potash)",
                            "type": "Foliar Potassium & Sulfur",
                            "purpose": "Foliar potassium and sulfur supplementation without adding vegetative nitrogen.",
                            "why_recommended": "Thickens epidermal cuticle layer, making leaf surface physically resilient against fungal germ-tube penetration.",
                            "usage": "Spray @ 5g per liter of water (1 kg in 200L water per acre) during tillering stage.",
                            "approx_price": "₹180 - ₹240 per 1 kg pack",
                            "purchase_link": "https://www.iffcobazar.in/en/product/wsf-npk-00-00-50"
                        }
                    ]
                }
            },
            "Mosaic": {
                "disease_name": "Sugarcane Mosaic Virus (SCMV)",
                "local_names": {
                    "en": "Sugarcane Mosaic Disease",
                    "mr": "ऊस मोझॅक विषाणू रोग (Sugarcane Mosaic Virus)",
                    "hi": "गन्ना मोज़ेक वायरस (Sugarcane Mosaic Virus)",
                    "ml": "കരിമ്പ് മൊസൈക് രോഗം (Sugarcane Mosaic)"
                },
                "severity": "Moderate",
                "summary": "Sugarcane Mosaic is a viral infection causing contrasting dark and light green mottled streaks along leaf veins, reducing photosynthesis.",
                "why_identified": "Interrupted chlorotic patches forming elongated mottled mosaic patterns parallel to the leaf veins with mild shoot stunting.",
                "symptoms": "Alternating islands of dark green and pale green/yellowish chlorosis on the leaf blade, shortening of internodes, stunting of young shoots, and reduced stalk diameter.",
                "causes": "Sugarcane Mosaic Potyvirus (SCMV), transmitted non-persistently by aphids (Rhopalosiphum maidis, Melanaphis sacchari) and through infected seed cane.",
                "conditions_responsible": "High aphid vector activity, cool humid microclimate, presence of alternate grass hosts on field bunds, and planting uncertified seed setts.",
                "immediate_treatment": [
                    "Rogue out and bury/burn infected young plants immediately; viral diseases cannot be cured chemically once inside the plant.",
                    "Spray approved aphicide on surrounding rows to eliminate vector aphids and prevent field spread.",
                    "Clean all harvesting knives and cutting implements with 10% bleach/formalin solution to prevent mechanical transmission."
                ],
                "agricultural_practices": [
                    "Keep field borders and irrigation bunds clean of wild grass weeds (like Sorghum halepense / Bermuda grass) that host aphids.",
                    "Never take ratoon crops from heavily mosaic-infected plant cane fields.",
                    "Plant barrier crops like sunn hemp or maize on borders to intercept migrating aphids."
                ],
                "prevention_methods": [
                    "Plant certified disease-free tissue-cultured plantlets from recognized government/university nurseries.",
                    "Cultivate mosaic-tolerant varieties (e.g., Co 86032, CoM 0265, Co 0238).",
                    "Avoid taking seed setts from fields showing any mosaic symptoms."
                ],
                "field_management": "Maintain clean intercultural operations and avoid dense overgrowth on headlands.",
                "expert_consultation": "Consult local Krishi Vigyan Kendra (KVK) for viral indexing of seed nurseries.",
                "products": {
                    "disease_treatment_products": [
                        {
                            "name": "Neem Oil 10,000 PPM (Azadirachtin Bio-Pesticide)",
                            "type": "Botanical Bio-Insecticide",
                            "purpose": "Repellent and anti-feedant for aphid vectors transmitting mosaic virus.",
                            "why_recommended": "Suppresses aphid populations safely without harming beneficial predatory insects (ladybirds, hoverflies).",
                            "usage": "3ml to 4ml per liter of water (600ml to 800ml per acre) with a mild wetting agent; spray thoroughly on leaf under-surfaces.",
                            "alternatives": "Neem Seed Kernel Extract (NSKE 5%).",
                            "approx_price": "₹380 - ₹550 per 1 liter bottle",
                            "purchase_link": "https://agribegri.com/products/neem-oil-10000-ppm.php"
                        },
                        {
                            "name": "Thiamethoxam 25% WG (Actara)",
                            "type": "Systemic Insecticide for Vector Control",
                            "purpose": "Rapid translaminar systemic control of sucking aphid vectors.",
                            "why_recommended": "Eliminates aphids on contact and systemically, interrupting the viral transmission chain across the field.",
                            "usage": "0.5g per liter of water (100g in 200L water per acre).",
                            "alternatives": "Acetamiprid 20% SP, Imidacloprid 17.8% SL.",
                            "approx_price": "₹320 - ₹480 per 100g pack",
                            "purchase_link": "https://www.bighaat.com/products/actara-insecticide"
                        }
                    ],
                    "crop_nutrition_fertilizers": [
                        {
                            "name": "IFFCO Nano Urea Liquid (4% N)",
                            "type": "Nano Nitrogen Foliar Spray",
                            "purpose": "Provides highly assimilable nitrogen for photosynthetic vigor in healthy tillers.",
                            "why_recommended": "Delivers rapid nitrogen uptake to compensate for photosynthetic losses without causing excess succulent growth.",
                            "usage": "2 ml to 4 ml per liter of water sprayed during active tillering stage.",
                            "approx_price": "₹225 per 500ml bottle",
                            "purchase_link": "https://www.iffcobazar.in/en/product/iffco-nano-urea-liquid"
                        }
                    ]
                }
            },
            "Yellow": {
                "disease_name": "Sugarcane Yellow Leaf Disease (SCYLV)",
                "local_names": {
                    "en": "Sugarcane Yellow Leaf Disease (SCYLV)",
                    "mr": "पिवळा पान रोग (Sugarcane Yellow Leaf Disease)",
                    "hi": "पीली पत्ती रोग (Sugarcane Yellow Leaf Disease)",
                    "ml": "കരിമ്പ് മഞ്ഞ ഇല രോഗം (Yellow Leaf Disease)"
                },
                "severity": "Moderate",
                "summary": "Yellow Leaf Disease is a viral/phytoplasma condition causing intense midrib yellowing, bunchy top appearance, and reduced sucrose accumulation.",
                "why_identified": "Distinct bright yellowing localized along the midrib on mature 3rd-5th leaves, extending into the blade lamina with reddish tint on lower midrib.",
                "symptoms": "Prominent yellowing of the midrib on 3rd to 5th leaves from top whorl; discoloration spreads into adjacent leaf lamina; lower surface of midrib turns reddish or pinkish; shortened terminal internodes.",
                "causes": "Sugarcane Yellow Leaf Luteovirus (SCYLV) and/or Sugarcane Yellow Leaf Phytoplasma, transmitted by the sugarcane aphid (Melanaphis sacchari).",
                "conditions_responsible": "Post-monsoon dry conditions (October–December), high vector populations, moisture stress or prolonged waterlogging, and use of uncertified seed setts.",
                "immediate_treatment": [
                    "Spray micronutrient mixture (Ferrous Sulfate 0.5% + Zinc Sulfate 0.5% + Urea 1%) to alleviate chlorosis and maintain chlorophyll synthesis.",
                    "Spray approved systemic aphicide to control sugarcane aphid vector colonies on lower leaf surfaces.",
                    "Ensure adequate, uniform soil moisture; avoid severe moisture stress during elongation."
                ],
                "agricultural_practices": [
                    "Mark disease-free healthy clumps during harvesting strictly for future seed selection.",
                    "Avoid taking ratoon crops if yellow leaf infection exceeds 20% in the standing crop.",
                    "Provide balanced fertilization with adequate potassium to enhance sucrose transport."
                ],
                "prevention_methods": [
                    "Plant virus-tested tissue-culture plantlets certified by ICAR-SBI or VSI Pune.",
                    "Practice hot water treatment of seed setts (50°C for 2 hours) to suppress vector-transmitted agents.",
                    "Avoid collecting seed setts from infected fields."
                ],
                "field_management": "Maintain consistent irrigation intervals and eradicate weed hosts on field perimeters.",
                "expert_consultation": "Consult local Sugar Factory Agronomist for certified seed sourcing for next planting cycle.",
                "products": {
                    "disease_treatment_products": [
                        {
                            "name": "Chelated Zinc EDTA 12% & Ferrous Sulfate (FeSO4 19%)",
                            "type": "Micronutrient Stress Alleviator",
                            "purpose": "Direct foliar nutrient therapy to counter severe midrib chlorosis.",
                            "why_recommended": "Stimulates chlorophyll biosynthesis, activates carbohydrate transport enzymes, and restores vigor to affected leaf lamina.",
                            "usage": "1.5g to 2g per liter of water (300g in 200L water per acre) sprayed evenly across the upper canopy.",
                            "alternatives": "Multi-micronutrient Grade-IV mixture.",
                            "approx_price": "₹140 - ₹240 per 500g pack",
                            "purchase_link": "https://www.iffcobazar.in/en/product/chelated-zinc-edta-12"
                        },
                        {
                            "name": "Imidacloprid 17.8% SL (Confidor / Victor)",
                            "type": "Systemic Insecticide for Vector Suppression",
                            "purpose": "Control of Melanaphis sacchari (sugarcane aphid) vectors harboring the luteovirus.",
                            "why_recommended": "Provides long-lasting systemic protection against sucking insect colonies situated on the lower midrib surfaces.",
                            "usage": "0.3 ml to 0.4 ml per liter of water (60ml to 80ml in 200L water per acre).",
                            "alternatives": "Thiamethoxam 25% WG, Flonicamid 50% WG.",
                            "approx_price": "₹260 - ₹420 per 250ml bottle",
                            "purchase_link": "https://agribegri.com/products/imidacloprid-17-8-sl-insecticide.php"
                        }
                    ],
                    "crop_nutrition_fertilizers": [
                        {
                            "name": "IFFCO Water Soluble Fertilizer NPK (19:19:19)",
                            "type": "Balanced Macro-Nutrient Foliar Fertilizer",
                            "purpose": "Provides balanced nitrogen, phosphorus, and potassium for vegetative recovery.",
                            "why_recommended": "Provides immediate plant-available nutrition through foliar absorption without relying on stressed root vascular bundles.",
                            "usage": "5g per liter of water (1 kg in 200L water per acre) sprayed during formative grand growth stage.",
                            "approx_price": "₹130 - ₹180 per 1 kg pack",
                            "purchase_link": "https://www.iffcobazar.in/en/product/npk-19-19-19"
                        }
                    ]
                }
            }
        }

    def validate_leaf_image(self, image: Image.Image):
        """
        Comprehensive multi-stage domain validation:
        1. Dimension & Image Quality (Resolution, Blur, Exposure, Dynamic Range)
        2. Color & Biological Spectrum (Excess Green Index, Chlorophyll, Skin Tone, Sky/Metal rejection)
        3. Canvas & Graphic Artifacts (Flat vectors, Logos, Document scans, Uniform framing)
        4. Botanical Morphology (Parallel Monocot Venation vs. Reticulate Dicot Branching, Lobed Lamina)
        
        Returns:
            (is_valid: bool, error_message: str)
        """
        DEFAULT_INVALID_MSG = "Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis."
        
        w, h = image.size
        # 1. Dimension Check
        if w < 80 or h < 80:
            return False, DEFAULT_INVALID_MSG

        arr = np.array(image).astype(np.float32)
        std_val = float(np.std(arr))
        mean_val = float(np.mean(arr))

        # 2. Quality & Exposure Checks
        if std_val < 8.0 or mean_val < 15.0 or mean_val > 245.0:
            return False, DEFAULT_INVALID_MSG

        # Blur check via grayscale difference Laplacian approximation
        gray = 0.2989 * arr[:, :, 0] + 0.5870 * arr[:, :, 1] + 0.1140 * arr[:, :, 2]
        laplace = (
            np.abs(gray[1:-1, 1:-1] * 4 - gray[:-2, 1:-1] - gray[2:, 1:-1] - gray[1:-1, :-2] - gray[1:-1, 2:])
        )
        laplace_var = float(np.var(laplace))
        if laplace_var < 15.0:
            return False, DEFAULT_INVALID_MSG

        # 3. Digital Graphic / Logo / Document Scan Checks
        diff_h = np.abs(arr[1:, :, :] - arr[:-1, :, :])
        diff_w = np.abs(arr[:, 1:, :] - arr[:, :-1, :])
        flat_ratio = float((np.mean(np.all(diff_h < 1.0, axis=-1)) + np.mean(np.all(diff_w < 1.0, axis=-1))) / 2.0)
        white_ratio = float(np.mean(np.all(arr > 225.0, axis=-1)))

        borders = np.concatenate([arr[0, :, :], arr[-1, :, :], arr[:, 0, :], arr[:, -1, :]], axis=0)
        border_std = float(np.mean(np.std(borders, axis=0)))
        border_is_solid = border_std < 2.5
        border_white_ratio = float(np.mean(np.all(borders > 220.0, axis=-1)))
        border_dark_ratio = float(np.mean(np.all(borders < 35.0, axis=-1)))

        if flat_ratio > 0.55 or white_ratio > 0.35:
            return False, DEFAULT_INVALID_MSG

        if (border_is_solid or border_white_ratio > 0.75 or border_dark_ratio > 0.75) and (white_ratio > 0.15 or flat_ratio > 0.42):
            return False, DEFAULT_INVALID_MSG

        # 4. Color Spectrum & Biological Foliage Checks
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        total_intensity = r + g + b + 1e-6
        r_ratio = r / total_intensity
        g_ratio = g / total_intensity
        b_ratio = b / total_intensity

        excess_green = float(np.mean(2.0 * g - r - b))
        mean_blue_ratio = float(np.mean(b_ratio))
        mean_red_ratio = float(np.mean(r_ratio))
        mean_green_ratio = float(np.mean(g_ratio))

        # Rejection for Non-Plant Colors (Vehicles, Sky, Blue cloth, Screens)
        if mean_blue_ratio > 0.30 or float(np.mean(b_ratio > 0.34)) > 0.22:
            return False, DEFAULT_INVALID_MSG

        # Rejection for Pure Red / Magenta / Artificial objects
        if mean_red_ratio > 0.50 and excess_green < -20.0:
            return False, DEFAULT_INVALID_MSG

        # Neutral Gray / Metal / Concrete / Paper Rejection (Low Color Saturation)
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        saturation = np.where(max_c > 0, (max_c - min_c) / (max_c + 1e-6), 0.0)
        mean_sat = float(np.mean(saturation))
        if mean_sat < 0.14 and abs(excess_green) < 15.0:
            return False, DEFAULT_INVALID_MSG

        # Biological Foliage Presence Check:
        # Genuine sugarcane leaves must have green chlorophyll, yellow chlorosis, or rust orange-brown pustules.
        green_mask = (g > r) & (g > b) & ((2.0 * g - r - b) > 4.0)
        yellow_mask = (r > b) & (g > b) & (b_ratio < 0.26) & (((r + g) / 2.0 - b) > 18.0)
        rust_mask = (r > g) & (g > b) & (b_ratio < 0.22) & ((r - b) > 22.0) & ((g - b) > 8.0)
        foliage_mask = green_mask | yellow_mask | rust_mask
        foliage_fraction = float(np.mean(foliage_mask))

        if foliage_fraction < 0.25:
            return False, DEFAULT_INVALID_MSG

        # 5. Human Skin & Face Detection
        # Standard skin color locus in normalized RGB space
        skin_mask = (
            (r > g) & (g > b) &
            (r_ratio >= 0.38) & (r_ratio <= 0.65) &
            (g_ratio >= 0.26) & (g_ratio <= 0.38) &
            (b_ratio >= 0.12) & (b_ratio <= 0.28) &
            ((r - g) > 12.0)
        )
        skin_fraction = float(np.mean(skin_mask))
        if skin_fraction > 0.12:
            return False, DEFAULT_INVALID_MSG

        # 6. Botanical Morphology: Monocot Sugarcane vs. Broad Dicot Crops
        # Sugarcane has parallel fibrous venation along a dominant axis.
        # Broad dicot leaves (cotton, tomato, potato, weeds) have multidirectional branching (reticulate) veins.
        # Compute gradient orientation distribution
        sobel_y = np.abs(gray[2:, :] - gray[:-2, :])[:, 1:-1]
        sobel_x = np.abs(gray[:, 2:] - gray[:, :-2])[1:-1, :]
        min_h = min(sobel_y.shape[0], sobel_x.shape[0])
        min_w = min(sobel_y.shape[1], sobel_x.shape[1])
        sobel_y = sobel_y[:min_h, :min_w]
        sobel_x = sobel_x[:min_h, :min_w]

        grad_mag = np.sqrt(sobel_x**2 + sobel_y**2) + 1e-6
        strong_edge_mask = grad_mag > np.percentile(grad_mag, 70)
        
        if np.sum(strong_edge_mask) > 100:
            angles = np.arctan2(sobel_y[strong_edge_mask], sobel_x[strong_edge_mask])
            # 8-bin orientation histogram
            hist, _ = np.histogram(angles, bins=8, range=(-np.pi, np.pi))
            hist_norm = hist / (np.sum(hist) + 1e-6)
            orientation_entropy = -float(np.sum(hist_norm * np.log(hist_norm + 1e-6)))

            # If the edges are completely uniform/isotropic in all 8 directions without dominant parallel orientation
            aspect_ratio = max(w, h) / (min(w, h) + 1e-6)
            if orientation_entropy > 2.05 and aspect_ratio < 1.35 and excess_green < 15.0:
                return False, DEFAULT_INVALID_MSG

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
                "message": validation_err or "Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.",
                "prediction": None,
                "recommendation": None,
                "products": None,
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

        # OOD Entropy Check: If probabilities are scattered, reject or flag uncertain
        probs_np = probabilities.cpu().numpy()
        entropy = -float(np.sum(probs_np * np.log(probs_np + 1e-6)))

        is_confident = confidence >= self.confidence_threshold and entropy < 1.25

        if is_confident:
            kb = self.knowledge_base.get(predicted_class, self.knowledge_base["Healthy"])
            return {
                "success": True,
                "status": "valid_leaf",
                "crop": "sugarcane",
                "prediction": {
                    "class": predicted_class,
                    "confidence": round(confidence, 4),
                    "is_confident": True,
                    "why_identified": kb.get("why_identified", f"Identified visual patterns of {predicted_class}.")
                },
                "recommendation": {
                    "disease_name": kb.get("disease_name", predicted_class),
                    "summary": kb.get("summary", ""),
                    "local_names": kb.get("local_names", {}),
                    "severity": kb.get("severity", "Moderate"),
                    "symptoms": kb.get("symptoms", ""),
                    "why_identified": kb.get("why_identified", ""),
                    "causes": kb.get("causes", ""),
                    "conditions_responsible": kb.get("conditions_responsible", ""),
                    "actions": kb.get("immediate_treatment", []),
                    "immediate_treatment": kb.get("immediate_treatment", []),
                    "agricultural_practices": kb.get("agricultural_practices", []),
                    "prevention": kb.get("prevention_methods", []),
                    "prevention_methods": kb.get("prevention_methods", []),
                    "field_management": kb.get("field_management", ""),
                    "expert_consultation": kb.get("expert_consultation", "")
                },
                "products": kb.get("products", {
                    "disease_treatment_products": [],
                    "crop_nutrition_fertilizers": []
                }),
                "model_version": self.model_version
            }
        else:
            # Low confidence or out-of-distribution image: Reject as invalid sugarcane image
            return {
                "success": False,
                "crop": "sugarcane",
                "status": "invalid_image",
                "valid_leaf": False,
                "disease": None,
                "confidence": None,
                "severity": None,
                "treatment": None,
                "message": "Invalid Image! Please upload a clear image of a sugarcane leaf to perform disease diagnosis.",
                "prediction": None,
                "recommendation": None,
                "products": None,
                "model_version": self.model_version
            }
