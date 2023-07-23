const fs = require("fs");
const lodash = require("lodash");
const ical = require("node-ical");
require("dotenv").config();

const { Checksum } = require("./checksum");

class IcsStrategy {
    async get() {
        throw new Error("Not implemented");
    }

    transformForCalendar(eventsArray) {
        const checksum = new Checksum(this.key).init();
        const calendarEvents = lodash.sortBy(eventsArray, "start").map((v) => {
            const isNew = checksum.isNewEvent(v.summary, v.start);
            return {
                start: {
                    dateTime: v.start,
                },
                end: {
                    dateTime: v.end,
                },
                summary: v.summary,
                description: v.description,
                location: v.location,
                isNew,
            };
        });
        checksum.save();
        return calendarEvents;
    }
}

class FootBallStrategy extends IcsStrategy {
    constructor(team) {
        super();
        if (!team) throw new Error("team is required");

        this.key = team;
        this.url = process.env[`ICS_${this.key.toLowerCase()}`];
    }

    async get() {
        const events = await ical.async.fromURL(this.url);
        const regexPattern = /\s*\(.*?\)$/;
        const eventsArray = Object.values(events)
            .map((v) => ({
                summary: v.summary?.replace(regexPattern, ""),
                start: v.start,
                end: v.end,
                description: "Football",
            }))
            .filter((v) => v.summary);
        return eventsArray;
    }
}

class F1Strategy extends IcsStrategy {
    constructor() {
        super();
        this.key = "f1";
        this.url = process.env[`ICS_${this.key.toLowerCase()}`];
        this.circuitMap = JSON.parse(
            fs.readFileSync("./data/f1Circuit.json", "utf8")
        );
    }

    async get() {
        const events = await ical.async.fromURL(this.url);
        const eventsArray = Object.values(events).map((v) => ({
            summary: `🏎️${v.summary}`.replace('F1', "FORMULA 1"),
            start: v.start,
            end: v.end,
            location: this.circuitMap[v.location],
            description: "F1",
        }));
        return eventsArray;
    }
}

module.exports = {
    F1Strategy,
    FootBallStrategy,
};
