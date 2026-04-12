package com.krishsathi.model;

import java.util.List;

public class QueryResponse {
    
    private String answer;
    private List<Source> sources;
    private String confidence;
    private boolean escalated;
    private String escalationReason;
    private String queryId;
    
    public QueryResponse() {}
    
    public QueryResponse(String answer, List<Source> sources, String confidence, boolean escalated, String escalationReason, String queryId) {
        this.answer = answer;
        this.sources = sources;
        this.confidence = confidence;
        this.escalated = escalated;
        this.escalationReason = escalationReason;
        this.queryId = queryId;
    }
    
    // Getters and Setters
    public String getAnswer() {
        return answer;
    }
    
    public void setAnswer(String answer) {
        this.answer = answer;
    }
    
    public List<Source> getSources() {
        return sources;
    }
    
    public void setSources(List<Source> sources) {
        this.sources = sources;
    }
    
    public String getConfidence() {
        return confidence;
    }
    
    public void setConfidence(String confidence) {
        this.confidence = confidence;
    }
    
    public boolean isEscalated() {
        return escalated;
    }
    
    public void setEscalated(boolean escalated) {
        this.escalated = escalated;
    }
    
    public String getEscalationReason() {
        return escalationReason;
    }
    
    public void setEscalationReason(String escalationReason) {
        this.escalationReason = escalationReason;
    }
    
    public String getQueryId() {
        return queryId;
    }
    
    public void setQueryId(String queryId) {
        this.queryId = queryId;
    }
    
    public static class Source {
        private String title;
        private String url;
        private String date;
        private String type;
        
        public Source() {}
        
        public Source(String title, String url, String date, String type) {
            this.title = title;
            this.url = url;
            this.date = date;
            this.type = type;
        }
        
        // Getters and Setters
        public String getTitle() {
            return title;
        }
        
        public void setTitle(String title) {
            this.title = title;
        }
        
        public String getUrl() {
            return url;
        }
        
        public void setUrl(String url) {
            this.url = url;
        }
        
        public String getDate() {
            return date;
        }
        
        public void setDate(String date) {
            this.date = date;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
    }
}
