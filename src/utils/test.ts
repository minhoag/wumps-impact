import { Schedule, type Input } from "./schedule";

const begin = new Date();
begin.setDate(begin.getDate() - 1);

const input: Input = {
	gachaType: 301,
	select5: ["Zhongli", "The Unforged"],
	beginTime: begin,
	endTime: new Date(),
}

const schedule = new Schedule();
const data = schedule.create(input);
console.log(data)
