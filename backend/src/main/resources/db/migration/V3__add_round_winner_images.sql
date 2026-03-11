-- ラウンド1位の文章から生成した画像を保存
CREATE TABLE round_winner_images (
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    round INT NOT NULL,
    image_data BYTEA NOT NULL,
    PRIMARY KEY (room_passphrase, round)
);
