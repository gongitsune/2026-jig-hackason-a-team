package com.example.app.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OpenAIImageService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIImageService.class);
    private static final String API_URL = "https://api.openai.com/v1/images/generations";

    private final String apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenAIImageService(@Value("${openai.api-key:}") String apiKey) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
    }

    public boolean isAvailable() {
        return !apiKey.isEmpty();
    }

    public Optional<byte[]> generateImageFromSentence(String sentence, String goal) {
        if (!isAvailable()) {
            return Optional.empty();
        }
        try {
            String prompt = buildPrompt(sentence, goal);
            return callDallE(prompt);
        } catch (Exception e) {
            log.warn("OpenAI image generation failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String buildPrompt(String sentence, String goal) {
        if (goal != null && !goal.isBlank()) {
            return "お題「" + goal + "」に対する、以下の文章をビジュアルで表現したイラスト。ポップで親しみやすいタッチで。文章: " + sentence;
        }
        return "以下の文章をビジュアルで表現したイラスト。ポップで親しみやすいタッチで。文章: " + sentence;
    }

    private Optional<byte[]> callDallE(String prompt) throws Exception {
        String body = objectMapper.writeValueAsString(java.util.Map.of(
                "model", "dall-e-3",
                "prompt", prompt,
                "n", 1,
                "size", "1024x1024",
                "response_format", "b64_json",
                "quality", "standard"
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .timeout(java.time.Duration.ofSeconds(60))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() != 200) {
            log.warn("OpenAI API error: {} - {}", response.statusCode(), response.body());
            return Optional.empty();
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode data = root.path("data");
        if (!data.isArray() || data.isEmpty()) {
            return Optional.empty();
        }
        String b64 = data.get(0).path("b64_json").asText(null);
        if (b64 == null || b64.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(Base64.getDecoder().decode(b64));
    }
}
