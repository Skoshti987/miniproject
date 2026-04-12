package com.krishsathi.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class QueryRequest {
    
    @NotBlank(message = "Query cannot be blank")
    @Size(max = 1000, message = "Query must be less than 1000 characters")
    private String query;
    
    private String language = "en";
    
    private String location;
    
    private String userId;
    
    public QueryRequest() {}
    
    public QueryRequest(String query, String language, String location, String userId) {
        this.query = query;
        this.language = language;
        this.location = location;
        this.userId = userId;
    }
    
    // Getters and Setters
    public String getQuery() {
        return query;
    }
    
    public void setQuery(String query) {
        this.query = query;
    }
    
    public String getLanguage() {
        return language;
    }
    
    public void setLanguage(String language) {
        this.language = language;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
}
