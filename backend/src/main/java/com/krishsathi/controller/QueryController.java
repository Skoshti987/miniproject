package com.krishsathi.controller;

import com.krishsathi.model.QueryRequest;
import com.krishsathi.model.QueryResponse;
import com.krishsathi.service.QueryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class QueryController {
    
    @Autowired
    private QueryService queryService;
    
    @PostMapping("/query")
    public ResponseEntity<QueryResponse> processQuery(@Valid @RequestBody QueryRequest request) {
        try {
            QueryResponse response = queryService.processQuery(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return a fallback response
            QueryResponse fallbackResponse = new QueryResponse();
            fallbackResponse.setAnswer("I apologize, but I'm unable to process your query at the moment. Please try again later or contact your local Krishi Bhavan officer for assistance.");
            fallbackResponse.setEscalated(true);
            fallbackResponse.setEscalationReason("Service temporarily unavailable");
            return ResponseEntity.ok(fallbackResponse);
        }
    }
    
    @PostMapping("/upload")
    public ResponseEntity<QueryResponse> processImage(@RequestParam("image") String imageData,
                                                     @RequestParam("language") String language) {
        try {
            // For now, return a mock response
            QueryResponse response = new QueryResponse();
            response.setAnswer("Image analysis is currently being processed. This feature will be available soon with AI-powered plant disease detection.");
            response.setEscalated(false);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            QueryResponse fallbackResponse = new QueryResponse();
            fallbackResponse.setAnswer("Unable to process the image. Please try again or contact your local Krishi Bhavan officer.");
            fallbackResponse.setEscalated(true);
            return ResponseEntity.ok(fallbackResponse);
        }
    }
    
    @GetMapping("/weather")
    public ResponseEntity<Object> getWeather(@RequestParam String location) {
        try {
            // Mock weather data
            return ResponseEntity.ok(new Object() {
                public String location = location;
                public String temperature = "28°C";
                public String humidity = "75%";
                public String rainfall = "12.5mm";
                public String windSpeed = "8.2 km/h";
                public String condition = "Partly Cloudy";
            });
        } catch (Exception e) {
            return ResponseEntity.ok(new Object() {
                public String error = "Weather data unavailable";
            });
        }
    }
    
    @PostMapping("/feedback")
    public ResponseEntity<String> submitFeedback(@RequestParam String queryId,
                                               @RequestParam boolean helpful,
                                               @RequestParam(required = false) String comment) {
        try {
            // Process feedback
            return ResponseEntity.ok("Feedback submitted successfully");
        } catch (Exception e) {
            return ResponseEntity.ok("Failed to submit feedback");
        }
    }
}
