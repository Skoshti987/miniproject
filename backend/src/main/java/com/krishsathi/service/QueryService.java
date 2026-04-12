package com.krishsathi.service;

import com.krishsathi.model.QueryRequest;
import com.krishsathi.model.QueryResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class QueryService {
    
    public QueryResponse processQuery(QueryRequest request) {
        // This is a mock implementation
        // In production, this would integrate with:
        // 1. ASR service for voice queries
        // 2. RAG pipeline for knowledge retrieval
        // 3. LLM for answer generation
        // 4. Escalation logic for complex queries
        
        QueryResponse response = new QueryResponse();
        response.setQueryId(UUID.randomUUID().toString());
        
        // Mock answer based on query content
        String query = request.getQuery().toLowerCase();
        String answer = generateMockAnswer(query, request.getLanguage());
        
        response.setAnswer(answer);
        response.setConfidence("85%");
        response.setEscalated(false);
        
        // Mock sources
        List<QueryResponse.Source> sources = new ArrayList<>();
        sources.add(new QueryResponse.Source(
            "Krishi Bhavan Agricultural Guide 2024",
            "https://krishibhavan.kerala.gov.in/guide",
            "2024-01-15",
            "Official Document"
        ));
        sources.add(new QueryResponse.Source(
            "ICAR Crop Management Handbook",
            "https://icar.org.in/handbook",
            "2024-01-10",
            "Research Paper"
        ));
        response.setSources(sources);
        
        // Check if query should be escalated
        if (shouldEscalate(query)) {
            response.setEscalated(true);
            response.setEscalationReason("Complex query requiring expert consultation");
        }
        
        return response;
    }
    
    private String generateMockAnswer(String query, String language) {
        // This is a simplified mock response
        // In production, this would use RAG + LLM
        
        if (query.contains("rice") || query.contains("paddy")) {
            return "For rice cultivation in Kerala, the recommended practices include:\n\n" +
                   "1. Use certified seeds from Krishi Bhavan\n" +
                   "2. Maintain proper water level (2-3 cm)\n" +
                   "3. Apply fertilizers in three splits\n" +
                   "4. Monitor for common diseases like blast and sheath blight\n" +
                   "5. Follow integrated pest management practices\n\n" +
                   "The best time for transplanting is during the monsoon season (June-July).";
        } else if (query.contains("coconut")) {
            return "For coconut cultivation:\n\n" +
                   "1. Plant saplings 8-10 meters apart\n" +
                   "2. Apply organic manure regularly\n" +
                   "3. Water during dry periods\n" +
                   "4. Control pests like rhinoceros beetle\n" +
                   "5. Harvest mature nuts every 45-60 days\n\n" +
                   "Coconut palms require well-drained soil and adequate sunlight.";
        } else if (query.contains("disease") || query.contains("pest")) {
            return "For plant disease and pest management:\n\n" +
                   "1. Identify the specific disease or pest\n" +
                   "2. Use integrated pest management (IPM) approach\n" +
                   "3. Apply appropriate fungicides or pesticides as per guidelines\n" +
                   "4. Maintain proper field hygiene\n" +
                   "5. Monitor regularly for early detection\n\n" +
                   "For specific treatment recommendations, please upload clear images of the affected plants.";
        } else if (query.contains("weather") || query.contains("rain")) {
            return "Current weather conditions and agricultural advisories:\n\n" +
                   "1. Monitor weather forecasts regularly\n" +
                   "2. Avoid field operations during heavy rainfall\n" +
                   "3. Apply fertilizers during dry spells\n" +
                   "4. Protect crops from waterlogging\n" +
                   "5. Plan irrigation based on rainfall patterns\n\n" +
                   "Check the Weather section for detailed forecasts and advisories.";
        } else {
            return "Thank you for your agricultural query. Based on your question, I recommend:\n\n" +
                   "1. Consulting with your local Krishi Bhavan officer\n" +
                   "2. Checking the latest agricultural advisories\n" +
                   "3. Following recommended practices for your specific crop\n" +
                   "4. Monitoring weather conditions\n\n" +
                   "For more specific guidance, please provide more details about your crop, location, and specific concerns.";
        }
    }
    
    private boolean shouldEscalate(String query) {
        // Simple escalation logic
        String[] escalationKeywords = {
            "emergency", "urgent", "severe", "critical", "outbreak",
            "chemical", "pesticide", "fertilizer", "dosage", "spray"
        };
        
        for (String keyword : escalationKeywords) {
            if (query.contains(keyword)) {
                return true;
            }
        }
        
        return false;
    }
}
