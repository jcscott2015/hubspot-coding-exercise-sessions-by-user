/**
 * @file NodeJS HTTPS post exercise.
 * @author John C. Scott
 *
 * @requires     NPM:dotenv
 * @requires     NPM:https
 */

import 'dotenv/config';
import https from 'https';
import events, { ISessionsByUser, IEvents } from './bloc';

const hostname = process.env['HOSTNAME'] || undefined;
const dataset = process.env['DATASET_ENDPOINT'] || undefined;
const result = process.env['RESULT_ENDPOINT'] || undefined;
const userkey = process.env['USERKEY'] || undefined;
if (hostname === undefined) throw new Error('HOSTNAME is not defined in .env.');
if (dataset === undefined) throw new Error('DATASET_ENDPOINT is not defined in .env.');
if (result === undefined) throw new Error('RESULT_ENDPOINT is not defined in .env.');
if (userkey === undefined) throw new Error('USERKEY is not defined in .env.');

/**
 * NodeJS HTTPS GET stream
 * @returns Promise String || Error
 */
const httpsGet = () => {
	return new Promise((
		resolve: (value?: string) => void,
		reject: (value?: Error) => void
	) => {
		const options = {
			hostname: hostname,
			port: 443,
			path: `${dataset}?userKey=${userkey}`,
			method: 'GET'
		};

		let buffer: Uint8Array[] = [];
		const req = https.request(options, (res) => {
			res.on('data', chunk => buffer.push(chunk))
			res.on('error', err => reject(err))
			res.on('end', () => resolve(Buffer.concat(buffer).toString()));
		});

		req.on('error', error => {
			reject(error);
		});

		req.end();
	});
};

/**
 * NodeJS HTTPS POST stream
 * @param dataObj ISessionsByUser
 * @returns Promise String || Error
 */
const httpsPost = (dataObj: ISessionsByUser) => {
	const postData = JSON.stringify(dataObj);
	return new Promise((
		resolve: (value?: string) => void,
		reject: (value?: Error) => void
	) => {
		const options = {
			hostname: hostname,
			port: 443,
			path: `${result}?userKey=${userkey}`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': postData.length
			}
		};

		let buffer: Uint8Array[] = [];
		const req = https.request(options, res => {
			res.on('data', chunk => buffer.push(chunk))
			res.on('error', err => reject(err))
			res.on('end', () => resolve(Buffer.concat(buffer).toString()));
		});

		req.on('error', error => {
			reject(error);
		});

		req.write(postData);
		req.end();
	});
};

const processSolution = () => {
	httpsGet()
		.then(data => data ? JSON.parse(data) : { partners: [] })
		.then((data: { events: IEvents[] }) => {
			if (data.events && (data.events.length > 0)) {
				return events(data.events);
			} else {
				throw new Error('`partners` array in data object is empty or missing.');
			}
		})
		.then(sessionsByUserArray => {
			// console.info(JSON.stringify(sessionsByUserArray));
			httpsPost(sessionsByUserArray)
				.then(data => console.info(data))
				.catch(error => console.error(error));
		})
		.catch(error => console.error(error));
}

processSolution();