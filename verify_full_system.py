import urllib.request
import urllib.parse
import json
import os
import glob
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

BACKEND_URL = "http://127.0.0.1:5000/api"
ML_URL = "http://127.0.0.1:5001"

def multipart_post(url, file_path, token=None):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    with open(file_path, 'rb') as f:
        file_bytes = f.read()

    filename = os.path.basename(file_path)
    content_type = 'image/png' if filename.endswith('.png') else 'image/jpeg'

    body = bytearray()
    body.extend(f'--{boundary}\r\n'.encode('utf-8'))
    body.extend(f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode('utf-8'))
    body.extend(f'Content-Type: {content_type}\r\n\r\n'.encode('utf-8'))
    body.extend(file_bytes)
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def json_request(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    payload = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_tests():
    print("====================================================")
    print("      KRISHSATHI COMPREHENSIVE VERIFICATION SUITE   ")
    print("====================================================")

    # 1. Health Checks
    print("\n--- 1. Service Health Checks ---")
    st_backend, d_backend = json_request(f"{BACKEND_URL}/")
    print(f"Backend API (5000): {st_backend} - {d_backend.get('message')}")
    assert st_backend == 200

    st_ml, d_ml = json_request(f"{ML_URL}/")
    print(f"ML Service (5001): {st_ml} - status: {d_ml.get('status')}, model_loaded: {d_ml.get('model_loaded')}")
    assert st_ml == 200 and d_ml.get('model_loaded') == True

    # 2. Authentication & User Profile
    print("\n--- 2. User Registration, Login & Profile Persistence ---")
    test_email = f"farmer_test_{int(time.time())}@krishsathi.org"
    test_password = "FarmerSecurePassword123!"

    st_signup, d_signup = json_request(f"{BACKEND_URL}/auth/signup", method='POST', data={
        "email": test_email,
        "password": test_password,
        "name": "Sayali Koshti",
        "mobileNumber": "9876543210"
    })
    print(f"User Signup: {st_signup} - Token created: {'Yes' if d_signup.get('token') else 'No'}")
    token = d_signup.get('token')
    assert st_signup == 201 and token is not None

    # Test Updating 11 Fields Profile
    profile_payload = {
        "name": "Sayali Koshti",
        "mobileNumber": "9876543210",
        "state": "Maharashtra",
        "district": "Kolhapur",
        "village": "Gokul Shirgaon",
        "farmLocation": "Gat No. 199",
        "totalLand": "12.5",
        "sugarcaneArea": "8.0",
        "sugarcaneVariety": "Co 86032 (Nayan)",
        "farmingExperience": "9",
        "language": "mr",
        "crops": ["Sugarcane", "Soybean"]
    }

    st_prof_put, d_prof_put = json_request(f"{BACKEND_URL}/profile", method='PUT', data=profile_payload, token=token)
    print(f"Profile Update (PUT): {st_prof_put} - User: {d_prof_put.get('user', {}).get('name')}, Variety: {d_prof_put.get('user', {}).get('sugarcaneVariety')}")
    assert st_prof_put == 200

    # Test Fetching Profile (GET /profile)
    st_prof_get, d_prof_get = json_request(f"{BACKEND_URL}/profile", method='GET', token=token)
    print(f"Profile Fetch (GET): {st_prof_get} - Total Land: {d_prof_get.get('user', {}).get('totalLand')} Acres, Sugarcane: {d_prof_get.get('user', {}).get('sugarcaneArea')} Acres")
    assert st_prof_get == 200 and d_prof_get.get('user', {}).get('sugarcaneArea') == '8.0'

    # 3. Sugarcane Leaf Image Validation & Disease Diagnosis
    print("\n--- 3. Sugarcane Leaf Validation & Disease Diagnosis ---")

    # A: Test College Logo (Must be rejected)
    st_logo, d_logo = multipart_post(f"{BACKEND_URL}/disease/predict", "test_college_logo.png", token=token)
    print(f"College Logo Test: status={d_logo.get('status')} | valid_leaf={d_logo.get('valid_leaf')} | message='{d_logo.get('message')}'")
    assert d_logo.get('status') == 'invalid_image' and d_logo.get('valid_leaf') == False
    assert "Invalid Image! Please upload a clear image of a sugarcane leaf" in d_logo.get('message')

    # B: Test Document Scan (Must be rejected)
    st_doc, d_doc = multipart_post(f"{BACKEND_URL}/disease/predict", "test_document_scan.png", token=token)
    print(f"Document Scan Test: status={d_doc.get('status')} | valid_leaf={d_doc.get('valid_leaf')}")
    assert d_doc.get('status') == 'invalid_image'

    # C: Test Person Silhouette (Must be rejected)
    st_person, d_person = multipart_post(f"{BACKEND_URL}/disease/predict", "test_person_silhouette.png", token=token)
    print(f"Person Silhouette Test: status={d_person.get('status')} | valid_leaf={d_person.get('valid_leaf')}")
    assert d_person.get('status') == 'invalid_image'

    # D: Test Broad Dicot Leaf (Must be rejected)
    st_dicot, d_dicot = multipart_post(f"{BACKEND_URL}/disease/predict", "test_broad_dicot_leaf.png", token=token)
    print(f"Broad Dicot Leaf Test: status={d_dicot.get('status')} | valid_leaf={d_dicot.get('valid_leaf')}")
    assert d_dicot.get('status') in ['invalid_image', 'uncertain']

    # E: Test Genuine Sugarcane Leaf - Healthy
    healthy_files = glob.glob('ml/dataset/test/Healthy/*.*')
    if healthy_files:
        st_h, d_h = multipart_post(f"{BACKEND_URL}/disease/predict", healthy_files[0], token=token)
        print(f"Genuine Healthy Leaf Test: status={d_h.get('status')} | class={d_h.get('prediction', {}).get('class')} | conf={d_h.get('prediction', {}).get('confidence')}")
        assert d_h.get('status') == 'valid_leaf'
        assert d_h.get('prediction', {}).get('class') == 'Healthy'
        assert len(d_h.get('products', {}).get('crop_nutrition_fertilizers', [])) > 0
        print(f"   -> Fertilizer product: {d_h['products']['crop_nutrition_fertilizers'][0]['name']}")

    # F: Test Genuine Sugarcane Leaf - Rust
    rust_files = glob.glob('ml/dataset/test/Rust/*.*')
    if rust_files:
        st_r, d_r = multipart_post(f"{BACKEND_URL}/disease/predict", rust_files[0], token=token)
        print(f"Genuine Rust Leaf Test: status={d_r.get('status')} | class={d_r.get('prediction', {}).get('class')} | conf={d_r.get('prediction', {}).get('confidence')}")
        assert d_r.get('status') == 'valid_leaf'
        assert d_r.get('prediction', {}).get('class') == 'Rust'
        assert len(d_r.get('products', {}).get('disease_treatment_products', [])) > 0
        print(f"   -> Curative product: {d_r['products']['disease_treatment_products'][0]['name']}")
        print(f"   -> Verified purchase link: {d_r['products']['disease_treatment_products'][0]['purchase_link']}")

    # 4. Diagnosis History & MongoDB Persistence
    print("\n--- 4. Diagnosis History & MongoDB Persistence ---")
    st_hist, d_hist = json_request(f"{BACKEND_URL}/disease/history", method='GET', token=token)
    print(f"Diagnosis History (GET): count={d_hist.get('count')}")
    assert st_hist == 200 and d_hist.get('count', 0) >= 2
    first_hist_id = d_hist['history'][0]['_id']
    print(f"   -> Most recent saved diagnosis: {d_hist['history'][0]['disease']} ({d_hist['history'][0]['severity']}) on {d_hist['history'][0]['createdAt']}")

    # 5. Sugarcane Chatbot & Domain Restriction
    print("\n--- 5. Sugarcane Chatbot & Domain Restriction ---")

    # A: Off-Domain Query (Cricket)
    st_off, d_off = json_request(f"{BACKEND_URL}/query", method='POST', data={
        "query": "Who is the captain of Indian cricket team?",
        "language": "en"
    }, token=token)
    print(f"Off-Domain Query: isOffDomain={d_off.get('isOffDomain')} | Answer='{d_off.get('answer')}'")
    assert d_off.get('isOffDomain') == True
    assert "I am KrishSathi, your Sugarcane Agricultural Assistant" in d_off.get('answer')

    # B: Sugarcane Ambiguous Yellow Leaf Query
    st_yellow, d_yellow = json_request(f"{BACKEND_URL}/query", method='POST', data={
        "query": "My sugarcane leaves are turning yellow. What should I do?",
        "language": "en"
    }, token=token)
    print(f"Sugarcane Yellow Leaf Query: Answer snippet:\n{d_yellow.get('answer')[:300]}...")
    assert "yellow" in d_yellow.get('answer').lower() or "deficiency" in d_yellow.get('answer').lower()

    # C: Chat History Persistence
    st_chathist, d_chathist = json_request(f"{BACKEND_URL}/query/history", method='GET', token=token)
    print(f"Chat History count: {d_chathist.get('count')}")
    assert d_chathist.get('count', 0) >= 1

    # 6. Dashboard Aggregation Endpoint
    print("\n--- 6. Dashboard Aggregation Endpoint (MongoDB Live Stats) ---")
    st_dash, d_dash = json_request(f"{BACKEND_URL}/dashboard/stats", method='GET', token=token)
    print(f"Dashboard Stats: totalDiagnoses={d_dash.get('stats', {}).get('totalDiagnoses')}, totalQueries={d_dash.get('stats', {}).get('totalQueries')}")
    print(f"Farming Profile in Dashboard: {d_dash.get('farmingProfile', {}).get('sugarcaneVariety')} in {d_dash.get('farmingProfile', {}).get('district')}")
    assert st_dash == 200 and d_dash.get('stats', {}).get('totalDiagnoses') >= 2

    print("\n====================================================")
    print("      ALL COMPREHENSIVE SYSTEM TESTS PASSED!       ")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
