const pino = require("pino");
const cron = require("node-cron");

const { Calendar } = require("./utils/caledar");
const { F1Strategy, FootBallStrategy } = require("./utils/ics");

const Error = pino.destination({
    dest: "./logs/error.log",
});
const Log = pino.destination({
    dest: "./logs/event.log",
});
const errorLogger = pino(
    {
        base: undefined,
    },
    Error
);

const logger = pino(
    {
        base: undefined,
    },
    Log
);

async function F1() {
    const f1 = new F1Strategy();
    const calendar = await new Calendar().init();

    const events = await f1.get();
    const calendarEvents = f1.transformForCalendar(events);

    const newEvents = calendarEvents.filter((v) => v.isNew);

    const currentEvents = await calendar.getEventList({
        q: "F1",
        timeMin: new Date().toISOString(),
    });

    const targetEvents = newEvents
        .map((v) => {
            const event = currentEvents.items.find(
                (w) => w.summary === v.summary
            );

            return {
                id: event?.id,
                isUpdate: !!event,
                ...v,
            };
        })
        .filter(Boolean);
    return targetEvents;
}

async function Football(team) {
    const arsenal = new FootBallStrategy(team);
    const calendar = await new Calendar().init();

    const events = await arsenal.get();
    const calendarEvents = arsenal.transformForCalendar(events);

    const newEvents = calendarEvents.filter((v) => v.isNew);

    const currentEvents = await calendar.getEventList({
        q: "Football",
        timeMin: new Date().toISOString(),
    });

    const targetEvents = newEvents
        .map((v) => {
            const event = currentEvents.items.find(
                (w) => w.summary === v.summary
            );

            return {
                id: event?.id,
                isUpdate: !!event,
                ...v,
            };
        })
        .filter(Boolean);
    return targetEvents;
}

async function main() {
    try {
        console.log("start - ", new Date().toISOString(), "\n");
        logger.info("start");
        const calendar = await new Calendar().init();
        const f1 = await F1();
        const arsenal = await Football("arsenal");
        const psg = await Football("psg");
        const bayer = await Football("bayer");

        const targetEvents = [...f1, ...arsenal, ...psg, ...bayer];

        const result = await calendar.slowInsertEventList(targetEvents);
        console.log("fin");
    } catch (error) {
        console.log(error);
        errorLogger.error(error);
    }
}

// 6시간마다 cron 실행
// const task = cron.schedule("0 */6 * * *", main);
// task.start();

main();
