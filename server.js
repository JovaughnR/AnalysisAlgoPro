const express = require("express");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const Database = require("./sql.js");

let currentUserId = null;
let isAuthorise = false;

const app = express();
const database = new Database(
	"localhost",
	"root",
	"",
	"a_of_a_student_participation"
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Multer storage configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/"); // Destination folder for storing uploaded files
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname); // Set the filename to the original filename
	},
});

// File type validation function
const fileFilter = function (req, file, cb) {
	const allowedTypes = ["text/plain", "application/pdf"]; // Allowed file MIME types
	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true); // Accept the file
	} else {
		cb(
			new Error(
				"Invalid file type. Only text files (.txt) and PDF files (.pdf) are allowed."
			)
		);
	}
};

// Multer configuration
// Initialize Multer with the storage configuration
const upload = multer({
	storage: storage,
	fileFilter: fileFilter, // Apply file type validation
});

app.get("/register", (req, res) => {
	if (!isAuthorise) {
		res.sendFile(path.join(__dirname, "public/form.html"));
	} else {
		res.status(409).send("User is already registered");
	}
});

app.get("/name", (req, res) => {
	if (isAuthorise) {
		database.getName(currentUserId, (err, name) =>
			err ? console.log(err) : res.json({ name })
		);
	} else {
		res.sendStatus(401);
	}
});

app.get("/login", (req, res) => {
	if (!isAuthorise) {
		res.sendFile(path.join(__dirname, "public/login.html"));
	} else {
		res.status(409).send("User is already logged in");
	}
});

app.post("/login", (req, res) => {
	const { user_id, password } = req.body;
	console.log(`user id: ${user_id}\npassword: ${password}`);
	try {
		console.log("Looking up");
		database.lookUpUser(user_id, password, (err, valid) => {
			if (err) throw err;
			console.log("Validation:", valid);
			if (valid) {
				[currentUserId, isAuthorise] = [user_id, true];
				res.redirect(200, "/");
			} else {
				console.log("incorrect credentials");
				res.status(401).send("Invalid user ID or password.");
			}
		});
	} catch (err) {
		console.log("An error was thrown");
		res.status(500).send("An error occur during login!");
	}
});

app.get("/", (req, res) => {
	if (!isAuthorise) {
		res.redirect("/login");
	} else {
		res.sendFile(path.join(__dirname, "public/index.html"));
	}
});

app.get("/logout", (req, res) => {
	[isAuthorise, currentUserId] = [false, null];
	res.sendStatus(200);
});

app.post("/submit", (req, res) => {
	database.add_user(req.body);
	res.redirect("/login");
});

app.post("/add-module", (req, res) => {
	database.add_module(req.body, currentUserId);
	res.sendStatus(200);
});

app.get("/module", (req, res) => {
	if (!isAuthorise) {
		res.status(401);
	} else
		database.get_modules(currentUserId, (err, modules) =>
			err ? res.send(err) : res.json({ modules: modules })
		);
});

app.post("/upload", upload.single("file"), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: "No file uploaded" });
	}
	const filePath = req.file.path;

	fs.readFile(filePath, "utf-8", (err, data) => {
		if (err) {
			res.status(500).json({ error: "Error reading file" });
			return;
		}
		// Split the file content into lines and join it
		const chatDialogs = data.split(/\r?\n/).join("");
		res.json({ chatDialogs });
	});
});

app.use(express.static(path.join("./public")));
const PORT = 8000 || process.env.PORT;

app.listen(PORT, () => {
	console.log(`server running on PORT ${PORT}`);
});
