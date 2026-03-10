package com.example.app.pkgs.json;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Optional;

public final class JsonUtils {
    private JsonUtils() {}

    public static Optional<String> asOptionalString(JsonNode node) {
        return (node == null || node.isNull()) ? Optional.empty() : Optional.of(node.asText());
    }
}
