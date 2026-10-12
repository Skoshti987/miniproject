import os
import io
import requests
import unittest
from PIL import Image, ImageDraw

BACKEND_URL = "http://127.0.0.1:5000/api/disease/predict"
ML_URL = "http://127.0.0.1:5001/predict"

def send_image(url, image_bytes, filename="test.jpg"):
    files = {"image": (filename, image_bytes, "image/jpeg" if filename.endswith(".jpg") else "image/png")}
    response = requests.post(url, files=files)
    return response

class TestSugarcaneDiseaseValidation(unittest.TestCase):

    def test_case_1_college_logo(self):
        """1. The exact college logo image that reproduced this bug."""
        logo_path = "test_college_logo.png"
        self.assertTrue(os.path.exists(logo_path))
        with open(logo_path, "rb") as f:
            img_bytes = f.read()

        # Test ML Service directly
        res_ml = send_image(ML_URL, img_bytes, "college_logo.png").json()
        self.assertEqual(res_ml.get("status"), "invalid_image")
        self.assertFalse(res_ml.get("valid_leaf"))
        self.assertIsNone(res_ml.get("disease"))

        # Test Express Backend
        res_backend = send_image(BACKEND_URL, img_bytes, "college_logo.png").json()
        self.assertEqual(res_backend.get("status"), "invalid_image")
        self.assertFalse(res_backend.get("valid_leaf"))
        self.assertIsNone(res_backend.get("disease"))
        self.assertFalse(res_backend.get("success"))
        print("\n[PASS] Case 1: College logo successfully rejected")

    def test_case_2_document_scan_or_crest(self):
        """2. A different logo or document scan."""
        doc_path = "test_document_scan.png"
        self.assertTrue(os.path.exists(doc_path))
        with open(doc_path, "rb") as f:
            img_bytes = f.read()

        res_backend = send_image(BACKEND_URL, img_bytes, "document_scan.png").json()
        self.assertEqual(res_backend.get("status"), "invalid_image")
        self.assertFalse(res_backend.get("valid_leaf"))
        print("[PASS] Case 2: Document scan successfully rejected")

    def test_case_3_unrelated_object_car_or_person(self):
        """3. A person or unrelated object."""
        person_path = "test_person_silhouette.png"
        self.assertTrue(os.path.exists(person_path))
        with open(person_path, "rb") as f:
            img_bytes = f.read()

        res_backend = send_image(BACKEND_URL, img_bytes, "person.png").json()
        self.assertEqual(res_backend.get("status"), "invalid_image")
        self.assertFalse(res_backend.get("valid_leaf"))
        print("[PASS] Case 3: Unrelated object (person silhouette) successfully rejected")

    def test_case_4_non_sugarcane_plant_leaf(self):
        """4. A non-sugarcane plant leaf (broad dicot leaf)."""
        leaf_path = "test_broad_dicot_leaf.png"
        self.assertTrue(os.path.exists(leaf_path))
        with open(leaf_path, "rb") as f:
            img_bytes = f.read()

        res_backend = send_image(BACKEND_URL, img_bytes, "dicot_leaf.png").json()
        # Should be rejected as invalid or flagged uncertain
        is_rejected_or_uncertain = (
            res_backend.get("status") == "invalid_image" or 
            res_backend.get("valid_leaf") == False or 
            res_backend.get("is_uncertain") == True
        )
        self.assertTrue(is_rejected_or_uncertain)
        print("[PASS] Case 4: Non-sugarcane leaf properly rejected or flagged uncertain")

    def test_case_5_clear_genuine_sugarcane_leaf(self):
        """5. A clear, genuine sugarcane leaf."""
        healthy_path = "ml/dataset/test/Healthy/healthy (110).jpeg"
        self.assertTrue(os.path.exists(healthy_path))
        with open(healthy_path, "rb") as f:
            img_bytes = f.read()

        res_backend = send_image(BACKEND_URL, img_bytes, "healthy.jpg").json()
        self.assertTrue(res_backend.get("success"))
        self.assertEqual(res_backend.get("prediction", {}).get("class"), "Healthy")
        self.assertGreater(res_backend.get("prediction", {}).get("confidence"), 0.8)
        print(f"[PASS] Case 5: Genuine sugarcane leaf correctly diagnosed Healthy ({res_backend['prediction']['confidence']:.2%})")

    def test_case_6_all_supported_disease_classes(self):
        """6. Genuine examples of every disease class supported by existing model."""
        classes = ["Healthy", "Mosaic", "Red Rot", "Rust", "Yellow"]
        for cls in classes:
            folder = os.path.join("ml/dataset/test", cls)
            valid_files = [f for f in os.listdir(folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            self.assertTrue(len(valid_files) > 0, f"No files in {folder}")
            first_img = valid_files[0]
            with open(os.path.join(folder, first_img), "rb") as f:
                img_bytes = f.read()

            res = send_image(BACKEND_URL, img_bytes, f"{cls}.jpeg").json()
            self.assertTrue(res.get("success"), f"Failed on class {cls}: {res}")
            self.assertIsNotNone(res.get("prediction", {}).get("class"))
            print(f"  - Tested {cls} sample: predicted {res['prediction']['class']} with {res['prediction']['confidence']:.2%}")
        print("[PASS] Case 6: All disease classes successfully process genuine leaves")

    def test_case_7_dark_leaf_image(self):
        """7. A dark or unusable leaf image."""
        img = Image.new("RGB", (224, 224), color=(10, 15, 10))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        res = send_image(BACKEND_URL, buf.getvalue(), "dark_leaf.jpg").json()
        self.assertEqual(res.get("status"), "invalid_image")
        self.assertFalse(res.get("valid_leaf"))
        print("[PASS] Case 7: Dark leaf image successfully rejected")

    def test_case_8_corrupted_image(self):
        """8. A corrupt image."""
        corrupt_bytes = b"NOT_AN_IMAGE_RANDOM_CORRUPT_BYTES_XYZ123"
        res = send_image(BACKEND_URL, corrupt_bytes, "corrupt.jpg")
        data = res.json()
        self.assertFalse(data.get("success"))
        print("[PASS] Case 8: Corrupt image gracefully rejected with error message")

    def test_case_9_invalid_after_valid(self):
        """9. An invalid image uploaded after a previously successful prediction."""
        # 1. Send valid
        with open("ml/dataset/test/Healthy/healthy (110).jpeg", "rb") as f:
            res_valid = send_image(BACKEND_URL, f.read(), "healthy.jpeg").json()
        self.assertTrue(res_valid.get("success"))
        self.assertEqual(res_valid.get("prediction", {}).get("class"), "Healthy")

        # 2. Immediately send invalid logo
        with open("test_college_logo.png", "rb") as f:
            res_invalid = send_image(BACKEND_URL, f.read(), "logo.png").json()
        self.assertEqual(res_invalid.get("status"), "invalid_image")
        self.assertIsNone(res_invalid.get("disease"))
        self.assertFalse(res_invalid.get("success"))
        print("[PASS] Case 9: Invalid image sent after valid prediction is strictly rejected")

    def test_case_10_valid_after_invalid(self):
        """10. A valid leaf uploaded after an invalid image."""
        # 1. Send invalid logo
        with open("test_college_logo.png", "rb") as f:
            res_invalid = send_image(BACKEND_URL, f.read(), "logo.png").json()
        self.assertEqual(res_invalid.get("status"), "invalid_image")

        # 2. Immediately send valid leaf
        with open("ml/dataset/test/Rust/rust (108).jpeg", "rb") as f:
            res_valid = send_image(BACKEND_URL, f.read(), "rust.jpeg").json()
        self.assertTrue(res_valid.get("success"))
        self.assertEqual(res_valid.get("prediction", {}).get("class"), "Rust")
        print(f"[PASS] Case 10: Valid leaf uploaded after invalid image correctly diagnosed ({res_valid['prediction']['confidence']:.2%})")

if __name__ == "__main__":
    unittest.main()
