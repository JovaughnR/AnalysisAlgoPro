const express = require("express");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const Database = require("./sql.js");

// Global variables to manage user authentication
let currentUserId = null; // Current logged in user ID
let isAuthorise = false;

// const connectionString =
// 	"Server=tcp:analysisofalgorithm.database.windows.net,1433;Initial Catalog=a_of_a_student_participation;Persist Security Info=False;User ID=jovaughnR;Password=robmAf-nopzi1-hekhap;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
// const db = new Database(connectionString);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const db = new Database(
	"localhost",
	"root",
	"",
	"a_of_a_student_participation"
);

// Multer storage configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		if (!fs.existsSync("uploads/")) {
			fs.mkdirSync("uploads/");
		}
		// Destination folder for storing uploaded files
		cb(null, "uploads/");
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

// Route to serve registration form
app.get("/register", (req, res) => {
	if (!isAuthorise) {
		res.sendFile(path.join(__dirname, "public/form.html"));
	} else {
		res.status(409).send("User is already registered");
	}
});

// Route to fetch user's name
app.get("/name", (req, res) => {
	if (isAuthorise) {
		db.getName(currentUserId, (err, name) =>
			err ? console.log(err) : res.json({ name })
		);
	} else {
		res.sendStatus(401);
	}
});

// Route to serve login form
app.get("/login", (req, res) => {
	if (!isAuthorise) {
		res.sendFile(path.join(__dirname, "public/login.html"));
	} else {
		res.status(409).send("User is already logged in");
	}
});

// Route to handle login request
app.post("/login", (req, res) => {
	const { user_id, password } = req.body;
	try {
		db.lookUpUser(user_id, password, (err, valid) => {
			if (err) throw err;
			if (valid) {
				[currentUserId, isAuthorise] = [user_id, true];
				res.redirect(200, "/");
			} else {
				res.status(401).send("Invalid user ID or password.");
			}
		});
	} catch (err) {
		res.status(500).send("An error occur during login!");
	}
});

// Route to serve homepage
app.get("/", (req, res) => {
	if (!isAuthorise) {
		res.redirect("/login");
	} else {
		res.sendFile(path.join(__dirname, "public/index.html"));
	}
});

// Route to handle logout
app.get("/logout", (req, res) => {
	[isAuthorise, currentUserId] = [false, null];
	res.sendStatus(200); // ok
});

// Route to handle user registration
app.post("/submit", (req, res) => {
	db.add_user(req.body);
	res.redirect("/login");
});

// Route to add a module
app.post("/add-module", (req, res) => {
	db.add_module(req.body, currentUserId);
	res.sendStatus(200);
});

// Route to fetch modules associated with a user
app.get("/module", (req, res) => {
	if (!isAuthorise) {
		res.status(401); // Unauthorized
	} else
		db.get_modules(currentUserId, (err, modules) =>
			err ? res.send(err) : res.json({ modules: modules })
		);
});

// Route to add session dialogs
app.post("/add-session", (req, res) => {
	const { moduleName, sessionDialog } = req.body;
	try {
		db.add_session_dialogs(moduleName, currentUserId, sessionDialog);
		res.sendStatus(200); // OK
	} catch (error) {
		res.sendStatus(500); // Internal Server Error
	}
});
// Route to handle file uploads
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

// Serve static files from the "public" directory
app.use(express.static(path.join("./public")));

// Define the port to listen on
const PORT = 8000 || process.env.PORT;

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}...`));
