import { GACHA_TYPE, Schedule } from "./schedule";

const schedule = new Schedule();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const params = {
	gachaType: GACHA_TYPE.Primary, //301
	beginTime: new Date(),
	endTime: tomorrow,
	select: ["Nahida"],
};

async function test() {
	const result = await schedule.create(params);
	console.log(result);
}

test();
