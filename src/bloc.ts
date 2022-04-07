/**
 * @file Business Logic for processing sessions data.
 * @author John C. Scott
 */

export interface IEvents {
	url: string;
	visitorId: string;
	timestamp: number;
};

interface ISession {
	duration: number;
	pages: string[];
	startTime: number;
};

export interface ISessionsByUser {
	sessionsByUser: {
		[key: string]: ISession[];
	}
};

interface IHashTable {
	[key: string]: [
		number, string
	][];
}

let hashTable: IHashTable = {};

/**
 * Build hash object from events -- 0(n)
 * @param events: IEvents[]
 */
const events = (events: IEvents[]): ISessionsByUser => {
	events.forEach(ev => {
		if (hashTable[ev.visitorId]) {
			hashTable[ev.visitorId].push([ev.timestamp, ev.url]);
		} else {
			hashTable[ev.visitorId] = [[ev.timestamp, ev.url]]
		}
	});
	return sessionsByUser();
};

/**
 * Build sessionsByUser object
 * @returns ISessionsByUser
 */
const sessionsByUser = (): ISessionsByUser => {
	let sessionsByUser: ISessionsByUser = {
		sessionsByUser: {}
	};
	Object.keys(hashTable).forEach(visitorId => {
		let sessionHash: ISession[] = [];
		findSequences(hashTable[visitorId]).forEach(s => {
			if (s.length > 1) { // a sequence
				const startTime = s[0][0];
				const endTime = s[s.length - 1][0];
				const duration = endTime - startTime;
				sessionHash.push({
					duration: duration,
					pages: s.map(p => p[1]),
					startTime: startTime
				});
			} else { // not a sequence
				sessionHash.push({
					duration: 0,
					pages: s.map(p => p[1]),
					startTime: s[0][0]
				});
			}
		});

		sessionsByUser['sessionsByUser'][visitorId] = sessionHash;
	});
	return sessionsByUser;
};

/**
 * Find events that are sequential.
 * @param events [number, string][]
 * @param gap integer - default is 600000, or 10 minutes
 * @returns [number, string][][]
 */
const findSequences = (events: [number, string][], gap = 600000) => {
	let ret = [];
	let temp = [];

	const sortedEvents = events.sort((a, b) => a[0] - b[0]);
	for (let i = 0; i < sortedEvents.length; i++) {
		if (i == 0) {
			// add the first element and continue
			temp.push(sortedEvents[i]);
			continue;
		}
		if ((sortedEvents[i][0] - sortedEvents[i - 1][0]) > gap) {
			// if the current is not sequential
			// add the current temporary array to arrays result
			ret.push(temp);

			// clear the temporary array and start over
			temp = [];
		}
		temp.push(sortedEvents[i]);
	}
	ret.push(temp);
	return ret;
};

export default events;