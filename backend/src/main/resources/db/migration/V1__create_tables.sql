-- rooms: passphrase PK, status, round
CREATE TABLE rooms (
    passphrase VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    round INT NOT NULL DEFAULT 1,
    goal VARCHAR(255) NOT NULL DEFAULT ''
);

-- users: id PK, room_passphrase FK, name
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    room_passphrase VARCHAR(255) REFERENCES rooms(passphrase),
    name VARCHAR(255) NOT NULL
);

-- words: id PK, room_passphrase FK, user_id FK, round, value
CREATE TABLE words (
    id BIGSERIAL PRIMARY KEY,
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    round INT NOT NULL,
    value VARCHAR(255) NOT NULL
);

-- sentences: id PK, room_passphrase FK, user_id FK, round, value
CREATE TABLE sentences (
    id BIGSERIAL PRIMARY KEY,
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    round INT NOT NULL,
    value VARCHAR(255) NOT NULL
);

-- votes: id PK, room_passphrase FK, user_id FK, sentence_id FK
CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    sentence_id BIGINT NOT NULL REFERENCES sentences(id)
);

-- distributed_words: room_passphrase PK, round PK, value
CREATE TABLE distributed_words (
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    round INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    PRIMARY KEY (room_passphrase, round)
);
