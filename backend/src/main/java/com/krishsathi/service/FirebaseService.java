package com.krishsathi.service;

import com.google.cloud.firestore.*;
import com.krishsathi.model.QueryRequest;
import com.krishsathi.model.QueryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseService {

    @Autowired
    private Firestore firestore;

    // Collection names
    private static final String USERS_COLLECTION = "users";
    private static final String QUERIES_COLLECTION = "queries";
    private static final String IMAGES_COLLECTION = "images";
    private static final String WEATHER_COLLECTION = "weather";
    private static final String FEEDBACK_COLLECTION = "feedback";
    private static final String ESCALATIONS_COLLECTION = "escalations";
    private static final String ADVISORIES_COLLECTION = "advisories";

    // User Management
    public Map<String, Object> createOrUpdateUser(String userId, Map<String, Object> userData) {
        try {
            DocumentReference userRef = firestore.collection(USERS_COLLECTION).document(userId);
            userData.put("updatedAt", FieldValue.serverTimestamp());
            userRef.set(userData, SetOptions.merge());
            return Map.of("success", true, "id", userId);
        } catch (Exception e) {
            System.err.println("Error creating/updating user: " + e.getMessage());
            throw new RuntimeException("Failed to create/update user", e);
        }
    }

    public Map<String, Object> getUser(String userId) {
        try {
            DocumentReference userRef = firestore.collection(USERS_COLLECTION).document(userId);
            DocumentSnapshot userSnap = userRef.get().get();
            if (userSnap.exists()) {
                Map<String, Object> userData = userSnap.getData();
                userData.put("id", userSnap.getId());
                return userData;
            }
            return null;
        } catch (Exception e) {
            System.err.println("Error getting user: " + e.getMessage());
            throw new RuntimeException("Failed to get user", e);
        }
    }

    // Query Management
    public Map<String, Object> saveQuery(QueryRequest request, String response) {
        try {
            Map<String, Object> queryData = new HashMap<>();
            queryData.put("query", request.getQuery());
            queryData.put("language", request.getLanguage());
            queryData.put("location", request.getLocation());
            queryData.put("userId", request.getUserId());
            queryData.put("response", response);
            queryData.put("createdAt", FieldValue.serverTimestamp());
            queryData.put("updatedAt", FieldValue.serverTimestamp());

            DocumentReference queryRef = firestore.collection(QUERIES_COLLECTION).add(queryData).get();
            return Map.of("success", true, "id", queryRef.getId());
        } catch (Exception e) {
            System.err.println("Error saving query: " + e.getMessage());
            throw new RuntimeException("Failed to save query", e);
        }
    }

    public List<Map<String, Object>> getUserQueries(String userId, int limit) {
        try {
            Query query = firestore.collection(QUERIES_COLLECTION)
                    .whereEqualTo("userId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit);

            QuerySnapshot querySnapshot = query.get().get();
            List<Map<String, Object>> queries = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Map<String, Object> queryData = document.getData();
                queryData.put("id", document.getId());
                queries.add(queryData);
            }
            
            return queries;
        } catch (Exception e) {
            System.err.println("Error getting user queries: " + e.getMessage());
            throw new RuntimeException("Failed to get user queries", e);
        }
    }

    // Image Management
    public Map<String, Object> saveImageAnalysis(Map<String, Object> imageData) {
        try {
            imageData.put("createdAt", FieldValue.serverTimestamp());
            imageData.put("updatedAt", FieldValue.serverTimestamp());

            DocumentReference imageRef = firestore.collection(IMAGES_COLLECTION).add(imageData).get();
            return Map.of("success", true, "id", imageRef.getId());
        } catch (Exception e) {
            System.err.println("Error saving image analysis: " + e.getMessage());
            throw new RuntimeException("Failed to save image analysis", e);
        }
    }

    public List<Map<String, Object>> getUserImages(String userId, int limit) {
        try {
            Query query = firestore.collection(IMAGES_COLLECTION)
                    .whereEqualTo("userId", userId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit);

            QuerySnapshot querySnapshot = query.get().get();
            List<Map<String, Object>> images = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Map<String, Object> imageData = document.getData();
                imageData.put("id", document.getId());
                images.add(imageData);
            }
            
            return images;
        } catch (Exception e) {
            System.err.println("Error getting user images: " + e.getMessage());
            throw new RuntimeException("Failed to get user images", e);
        }
    }

    // Weather Management
    public Map<String, Object> saveWeatherData(Map<String, Object> weatherData) {
        try {
            weatherData.put("timestamp", FieldValue.serverTimestamp());
            weatherData.put("createdAt", FieldValue.serverTimestamp());

            DocumentReference weatherRef = firestore.collection(WEATHER_COLLECTION).add(weatherData).get();
            return Map.of("success", true, "id", weatherRef.getId());
        } catch (Exception e) {
            System.err.println("Error saving weather data: " + e.getMessage());
            throw new RuntimeException("Failed to save weather data", e);
        }
    }

    public List<Map<String, Object>> getWeatherData(String location, int limit) {
        try {
            Query query = firestore.collection(WEATHER_COLLECTION)
                    .whereEqualTo("location", location)
                    .orderBy("timestamp", Query.Direction.DESCENDING)
                    .limit(limit);

            QuerySnapshot querySnapshot = query.get().get();
            List<Map<String, Object>> weatherData = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Map<String, Object> data = document.getData();
                data.put("id", document.getId());
                weatherData.add(data);
            }
            
            return weatherData;
        } catch (Exception e) {
            System.err.println("Error getting weather data: " + e.getMessage());
            throw new RuntimeException("Failed to get weather data", e);
        }
    }

    // Feedback Management
    public Map<String, Object> saveFeedback(Map<String, Object> feedbackData) {
        try {
            feedbackData.put("createdAt", FieldValue.serverTimestamp());

            DocumentReference feedbackRef = firestore.collection(FEEDBACK_COLLECTION).add(feedbackData).get();
            return Map.of("success", true, "id", feedbackRef.getId());
        } catch (Exception e) {
            System.err.println("Error saving feedback: " + e.getMessage());
            throw new RuntimeException("Failed to save feedback", e);
        }
    }

    // Escalation Management
    public Map<String, Object> createEscalation(Map<String, Object> escalationData) {
        try {
            escalationData.put("status", "pending");
            escalationData.put("createdAt", FieldValue.serverTimestamp());
            escalationData.put("updatedAt", FieldValue.serverTimestamp());

            DocumentReference escalationRef = firestore.collection(ESCALATIONS_COLLECTION).add(escalationData).get();
            return Map.of("success", true, "id", escalationRef.getId());
        } catch (Exception e) {
            System.err.println("Error creating escalation: " + e.getMessage());
            throw new RuntimeException("Failed to create escalation", e);
        }
    }

    public List<Map<String, Object>> getEscalations(String status, int limit) {
        try {
            Query query = firestore.collection(ESCALATIONS_COLLECTION)
                    .whereEqualTo("status", status)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit);

            QuerySnapshot querySnapshot = query.get().get();
            List<Map<String, Object>> escalations = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Map<String, Object> escalationData = document.getData();
                escalationData.put("id", document.getId());
                escalations.add(escalationData);
            }
            
            return escalations;
        } catch (Exception e) {
            System.err.println("Error getting escalations: " + e.getMessage());
            throw new RuntimeException("Failed to get escalations", e);
        }
    }

    // Advisory Management
    public List<Map<String, Object>> getAdvisories(String crop, String location, int limit) {
        try {
            Query query = firestore.collection(ADVISORIES_COLLECTION)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit);

            QuerySnapshot querySnapshot = query.get().get();
            List<Map<String, Object>> advisories = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Map<String, Object> advisoryData = document.getData();
                advisoryData.put("id", document.getId());
                advisories.add(advisoryData);
            }
            
            return advisories;
        } catch (Exception e) {
            System.err.println("Error getting advisories: " + e.getMessage());
            throw new RuntimeException("Failed to get advisories", e);
        }
    }
}
