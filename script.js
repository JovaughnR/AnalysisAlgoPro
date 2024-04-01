const file = Document.querySelector("#file");

const lecturer = "Dr. Arnett Campbell"; // to be set dynamically

const dialog =
	"10:42:08 From Dr. Arnett Campbell To Everyone:Based on the exercise we just did, what is the Big O efficiency of Dijkstra’s algorithm if we use a min-priority queue data structure to implement it?10:52:21 From Michellee Hawkings To Everyone: Sir its O ( V + E log V )10:59:01 From Marcus Hardy To Everyone:I think the correct answer is really O(v^2)10:53:48 From Romario Black To Everyone: O(v^2)10:57:18 From Marcus Hardy To Everyone: I would say O(n), linear10:58:12 From Rosie Donaldson To Everyone: Linear logarithmic10:59:01 From Marcus Hardy To Everyone:I think the correct answer is really O(v^2)";

/**
 * @param dialog  represents the string representation of the chat dialogs
 * @returns an object contain specific details of participants in chat session
 */
function getSessionDialogs(dialog = String) {
	const chatInfo = {};
	const pattern = /Everyone:(.*?)(?=\d{2}:\d{2}:\d{2})/;
	const namePattern = /From (.*?)(?= To)/;

	while (true) {
		const time = dialog.slice(0, 8);
		const response = dialog.match(pattern);
		const name = dialog.match(namePattern);

		// terminate the the loop once there is no response or name
		if (name === null || response === null) {
			break;
		}

		if (chatInfo[name[1]] === undefined)
			chatInfo[name[1]] = {
				time: time,
				message: [response[1]],
			};
		else {
			chatInfo[name[1]].message.push(response[1]);
		}

		dialog = dialog.slice(
			time.length + response[0].length + name[1].length + 10
		);
	}
	return chatInfo;
}

function generateStudentParticipationScore(chatInfo) {
	const participants = Object.keys(chatInfo);

	for (let participant of participants)
		if (participant !== lecturer) {
			const size = chatInfo[participant].message.length - 1;
			chatInfo[participant].score = 0.1 + size * 0.05;
		}

	/**
	 * Each particpant receive 10% for responding to question pose the lecturer
	 * in the chat and accumulate 5% for every other response
	 */
}

const chatInfo = getSessionDialogs(dialog);
generateStudentParticipationScore(chatInfo);

console.log(chatInfo);

// 10:59:01 From Marcus Hardy To Everyone:I think the correct answer is really O(v^2)
