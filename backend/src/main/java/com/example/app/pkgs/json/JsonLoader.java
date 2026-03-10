package com.example.app.pkgs.json;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.util.ArrayList;
import java.util.List;

public final class JsonLoader {
    private JsonLoader() {}

    private static final ObjectMapper mapper = new ObjectMapper();

    public static List<String> loadStringArray(String fileName) {
        try {
            JsonNode root = mapper.readTree(
                    new ClassPathResource(fileName).getInputStream()
            );

            List<String> result = new ArrayList<>();

            for (JsonNode node : root) {
                JsonUtils.asOptionalString(node)
                        .ifPresent(result::add);
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("failed to load json: " + fileName, e);
        }
    }
}