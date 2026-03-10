package com.example.app.controller;

import com.example.app.domain.User;
import com.example.app.pkgs.json.JsonUtils;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {
    private final JdbcTemplate jdbcTemplate;

    public UserController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping
    public ResponseEntity<Void> post(
            @RequestHeader Map<String, String> headers,
            @RequestBody JsonNode data
    ) {
        User user = new User(
            headers.get("x-user-id"),
            JsonUtils.asOptionalString(data.get("roomPassphrase")),
            data.get("name").asText()
        );

        jdbcTemplate.update(
                """
                INSERT INTO users (id, room_passphrase, name)
                VALUES (?, ?, ?)
                """,
                user.id(),
                user.roomPassphrase().orElse(null),
                user.name()
        );

        return ResponseEntity.ok().build();
    }
}
