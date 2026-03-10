-- ラウンドごとの goal を保存（pastResults で過去のお題を表示するため）
CREATE TABLE round_goals (
    room_passphrase VARCHAR(255) NOT NULL REFERENCES rooms(passphrase),
    round INT NOT NULL,
    goal VARCHAR(255) NOT NULL,
    PRIMARY KEY (room_passphrase, round)
);
