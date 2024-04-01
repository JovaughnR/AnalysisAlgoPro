const chats = document.querySelector(".chat");
const fileUploadForm = document.querySelector("#fileUploadForm");
const ulElement = document.querySelector(".inner-sections ul");
const olElement = document.querySelector(".inner-sections ol");
const moduleButton = document.querySelector("#module");
const moduleForm = document.querySelector("#addModuleForm");
const registeredClasses = document.querySelector("#registered-classes");
const logout = document.querySelector("#logoutButton");
let username = (foundedUser = null);

(async () => {
	try {
		const response = await fetch("/module");

		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}
		const { modules } = await response.json();
		const module = modules[0].module_name;
		document.querySelector("#course").innerHTML = module;

		modules.forEach((module) => {
			const li = createLi(module.module_name);
			registeredClasses.appendChild(li);
		});

		document
			.querySelectorAll("#registered-classes > li")
			.forEach(function (module) {
				module.addEventListener("click", (e) => {
					document.querySelector("#course").innerHTML = module.textContent;
				});
			});
	} catch (error) {
		console.log(error);
	}
})();

(async () => {
	try {
		const response = await fetch("/name");
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}
		const { name } = await response.json();
		document.querySelector("#username").innerHTML = name;
		username = name;
	} catch (error) {
		console.log("Error retrieving name");
	}
})();

logout.addEventListener("click", async (e) => {
	try {
		await fetch("/logout");
		window.location.href = "/login";
	} catch (error) {
		console.log("Logout failed:", error);
	}
});

fileUploadForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const sessionInfo = getDialogs(await fetchDialogs());
	if (sessionInfo) {
		const participants = getParticipants(sessionInfo);
		// maximum number of message variabe
		let max = sessionInfo[participants[0]].message.length;

		const userMessage = (message) => {
			const div = messageDiv(message);
			div.classList.add("question");
			chats.appendChild(div);
		};

		const scoreMap = {};
		const scoreRange = new Set();

		for (let pp = 0; pp < participants.length; ++pp) {
			const participant = participants[pp];
			const length = sessionInfo[participant].message.length;
			max = length > max ? length : max;

			const message = sessionInfo[participant].message[0];
			const isUser = isUsernameMatch(participant);

			if (isUser) {
				foundedUser = participant;
				userMessage(message);
			} else {
				chats.appendChild(messageDiv(message));
			}

			if (!isUser) {
				const score = sessionInfo[participant].score;

				const item = createLi(participant);
				let studentScore = "";
				if (!scoreRange.has(score)) {
					studentScore = createLi(score + "%");
				} else {
					studentScore = createLi("");
				}
				scoreMap[item] = studentScore;
				olElement.appendChild(studentScore);
				scoreRange.add(score);
				ulElement.appendChild(item);
			}
		}

		document.querySelectorAll(".inner-sections ul li").forEach((item) => {
			const rand = Math.floor(Math.random() * 4);
			item.addEventListener("click", (e) => {
				const element = scoreMap[item];
				const student = item.innerHTML;
				const score = sessionInfo[student].score;
				const messages = sessionInfo[student].message;
				const userMessages = sessionInfo[foundedUser].message;
				generateInnerContent(
					element,
					student,
					score,
					rand,
					messages,
					userMessages
				);
			});
		});

		for (let mp = 1; mp < max; mp++)
			participants.forEach((participant) => {
				const message = sessionInfo[participant].message[mp];
				message && participant === username
					? userMessage(message)
					: chats.appendChild(messageDiv(message));
			});
	}
});

function messageDiv(message) {
	const div = document.createElement("div");
	div.classList.add("participant-message");
	div.innerHTML = message;
	return div;
}

function createLi(content) {
	const li = document.createElement("li");
	li.textContent = content;
	return li;
}

moduleButton.addEventListener("click", (e) => {
	moduleButton.style.display = "none";
	moduleForm.style.display = "flex";
});

function toggleFormVisibility() {
	moduleForm.style.display = "none";
	moduleButton.style.display = "";
}

async function fetchDialogs() {
	try {
		const form = document.querySelector("#fileUploadForm");
		const response = await fetch("/upload", {
			method: "POST",
			body: new FormData(form),
		});

		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}

		form.reset();

		const { chatDialogs } = await response.json();
		return chatDialogs;
	} catch (error) {
		console.log("Error Fetching chat Dialogs:", error);
		return null;
	}
}

/**
 * @param dialog  represents the string representation of the chat dialogs
 * @returns an object contain specific details of participants in chat session
 *
 */
function getDialogs(dialog) {
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

function getParticipants(chatInfo) {
	const participants = Object.keys(chatInfo);

	for (let participant of participants)
		if (participant !== username) {
			const size = chatInfo[participant].message.length - 1;
			chatInfo[participant].score = 10 + size * 5;
		}

	/**
	 * Each particpant receive 10% for responding to question pose the lecturer
	 * in the chat and accumulate 5% for every other response
	 */
	return participants;
}

// const chatInfo = getSessionDialogs(dialog);
// generateStudentParticipationScore(chatInfo);

// 10:59:01 From Marcus Hardy To Everyone:I think the correct answer is really O(v^2)

function generateInnerContent(
	element,
	name,
	score,
	rand,
	messages,
	userMessages
) {
	const message = messages.join(" ");
	const userMessage = userMessages.join(" ");
	const words = ["was awarded", "acquired", "gained", "obtained"];
	const headers = [
		"In answer to the query",
		"Regarding the inquiry",
		"With response to the question",
		"In reaction to the question.",
	];
	element.innerHTML = "";
	const sentence = `${headers[rand]} ${userMessage} ${name} responded with "${message}" and ${words[rand]} ${score} percent for participation.`;
	let index = 0;
	const intervalId = setInterval(function () {
		// Check if all characters have been displayed
		if (index < sentence.length) {
			element.innerHTML += sentence[index];
			index++;
		} else {
			// Clear the interval when all characters have been displayed
			clearInterval(intervalId);
		}
	}, 20);
}

function isUsernameMatch(name) {
	let n1 = (n2 = "");
	for (let char of name) {
		if (/[a-zA-Z]/.test(char)) n1 += char;
	}
	for (let char of username) {
		if (/[a-zA-Z]/.test(char)) n2 += char;
	}
	return n1 === n2 || n2.includes(n1) || n1.includes(n2);
}
