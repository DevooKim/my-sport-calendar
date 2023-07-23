const checksum = require("checksum");
const fs = require("fs");

/**
 * sync 로직
 * 1. ics에서 summary와 start를 추출
 * 2. `${summary}${start}`를 checksum으로 변환
 * 3. checksum.json에 존재하는지 확인
 * 4. 존재하면 pass
 * 4-1. 존재하지 않는다면 summary로 캘린더 검색
 * 4-1-a. 캘린더에 존재하면 patch
 * 4-1-b. 캘린더에 존재하지 않으면 insert
 */
class Checksum {
    #allowKeys = ["f1", "arsenal", "psg", "bayer"];
    constructor(key) {
        if (!this.#allowKeys.includes(key))
            throw new Error(`Invalid key: ${key}`);
        this.dir = `./data/checksum-${key}.json`;
    }

    init() {
        if (!fs.existsSync(this.dir)) {
            fs.writeFileSync(this.dir, "{}", "utf8");
        }
        this.cache = JSON.parse(fs.readFileSync(this.dir, "utf8"));
        return this;
    }

    isNewEvent(summary, startDate) {
        const target = `${summary}${startDate}`;
        const hash = checksum(target);

        if (!this.cache[hash]) {
            this.cache[hash] = new Date();

            return true;
        }
        return false;
    }

    save() {
        fs.writeFileSync(this.dir, JSON.stringify(this.cache), "utf8");
    }
}

module.exports = {
    Checksum,
};
