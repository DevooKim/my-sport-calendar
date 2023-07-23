const pino = require("pino");
const { google } = require("googleapis");
const { authorize } = require("./auth");
const { sleep } = require("./common");
require("dotenv").config();

const calendarId = process.env.CALENDAR_ID;

const dest = pino.destination({
    dest: "./logs/event.log",
});
const logger = pino(
    {
        base: undefined,
    },
    dest
);

class Calendar {
    constructor() {}

    async init() {
        const auth = await authorize();
        this.calendar = google.calendar({ version: "v3", auth });
        return this;
    }

    async getEventList({ q, timeMin } = {}) {
        const res = await this.calendar.events.list({
            calendarId,
            q,
            timeMin,
        });
        return res.data;
    }

    /**
     *
     * @param {Object} resource
     * @param {Object} resource.start
     * @param {Date} resource.start.dateTime
     * @param {Object} resource.end
     * @param {Date} resource.end.dateTime
     * @param {String} resource.summary 제목
     * @param {String} resource.description 설명
     * @param {String} [resource.location]
     */
    async insertEvent(resource) {
        const res = await this.calendar.events.insert({
            calendarId,
            requestBody: resource,
        });
        return res.data;
    }

    async updateEvent(resource) {
        const res = await this.calendar.events.update({
            calendarId,
            eventId: resource.id,
            requestBody: resource,
        });
        return res.data;
    }

    async slowInsertEventList(resourceList) {
        const result = [];
        for (const v of resourceList) {
            if (v.isUpdate) {
                const event = await this.updateEvent(v);
                logger.info({ summary: event.summary, status: "updated" });
                result.push({ [event.summary]: "updated" });
            } else {
                const event = await this.insertEvent(v);
                logger.info({ summary: event.summary, status: "inserted" });
                result.push({ [event.summary]: "inserted" });
            }
            await sleep(500);
        }
        return result;
    }

    async deleteEvent(eventId) {
        const res = await this.calendar.events.delete({
            calendarId,
            eventId,
        });
        return res.data;
    }
}

module.exports = {
    Calendar,
};
