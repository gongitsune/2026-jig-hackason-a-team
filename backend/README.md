# バックエンド（Spring Boot）

Neon / Docker PostgreSQL 対応のシンプルな Spring Boot ボイラープレートです。

## クイックスタート

```bash
# 1. DB 起動
docker compose up -d

# 2. アプリ起動
./mvnw spring-boot:run
```

- ヘルスチェック: http://localhost:8080/actuator/health
- サンプル API: http://localhost:8080/api/health

## ドキュメント

- [技術選定](./docs/技術選定.md)
- [セットアップガイド](./docs/セットアップガイド.md)

## 技術スタック

- Java 21 / Spring Boot 3.2 / Maven
- PostgreSQL（ローカル: Docker / 本番: Neon）
- Spring Data JPA
