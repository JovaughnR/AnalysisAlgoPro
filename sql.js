const mysql = require("mysql");
const bcrypt = require("bcrypt");

class Database {
	constructor(host, user, pass, db) {
		this.connection = mysql.createConnection({
			host: host,
			user: user,
			password: pass,
			database: db,
		});

		this.connection.connect(function (error) {
			error ? console.error(error) : console.log("Database connected");
		});
	}

	initializeDatabase(callback) {
		try {
			this.createDatabase();
			this.createUserTable();
			this.createAuthenticationTable();
			this.createModuleTable();
			this.createSessionDialogTable();
		} catch (error) {
			callback(err, true);
		}
		callback(null, false);
	}

	createDatabase() {
		const db = "a_of_a_student_participation";
		const sql = "create database if not exists " + db;
		this.connection.query(sql, (err, result) => {
			err
				? console.log("Error creating database:", err)
				: console.log("Database created...");
		});
	}

	createUserTable() {
		const sql = `CREATE TABLE IF NOT EXISTS user (
        user_id BIGINT PRIMARY KEY,
        first_name VARCHAR(20),
        last_name VARCHAR(20),
        email VARCHAR(35)
    )`;
		this.connection.query(sql, (err, result) => {
			err
				? console.log("Error creating table!")
				: console.log("user table created...");
		});
	}

	createAuthenticationTable() {
		const sql = `CREATE TABLE IF NOT EXISTS user_authentication (
			user_id BIGINT PRIMARY KEY,
			user_password varchar(65), 
			Foreign Key (user_id) References user(user_id)
		)`;

		this.connection.query(sql, (err, result) => {
			err
				? console.log("Error creating table!")
				: console.log("Authentication table created...");
		});
	}

	createModuleTable() {
		const sql = `CREATE TABLE IF NOT EXISTS module (
			module_code VARCHAR(10) PRIMARY KEY,
			module_name VARCHAR(35),
			lecturer_id BIGINT, 
			Foreign Key (lecturer_id) References user(user_id)
		)`;

		this.connection.query(sql, (err, result) => {
			err
				? console.log("Error creating table!")
				: console.log("Module table created...");
		});
	}

	createSessionDialogTable() {
		const sql = `CREATE TABLE IF NOT EXISTS session_dialogs (
  		module_code VARCHAR(10) PRIMARY KEY,
			message VARCHAR(5000),
			date DATE, 
			lecturer_id BIGINT,
			Foreign Key (lecturer_id) REFERENCES user(user_id),
			Foreign Key (module_code) REFERENCES module(module_code)
		)`;

		this.connection.query(sql, (err, result) => {
			err
				? console.log("Error creating table!")
				: console.log("Session Dialogs table created...");
		});
	}

	add_user(user) {
		const sql = "insert into user values ?";
		const personalInfo = [
			[user.user_id, user.first_name, user.last_name, user.email],
		];
		this.connection.query(sql, [personalInfo], (err, res) => {
			if (err) {
				console.log("Error adding user:", err);
				return;
			}
		});
		this.add_password(user.user_id, user.password);
		this.add_module(user, user.user_id);
		console.log("User added successfully:");
	}

	add_dialogs(dialog, user_id) {
		const sql = "insert into session_dialogs values ?";
		const dialogInfo = [
			[dialog.module_code, dialog.message, dialog.date, user_id],
		];
		this.connection.query(sql, [dialogInfo]);
	}

	add_password(userId, password) {
		const sql = "INSERT INTO user_authentication VALUES ?";

		bcrypt.hash(password, 10, (err, hash) => {
			if (err) {
				console.error("Error hashing password:", err);
			} else {
				const values = [[userId, hash]];
				this.connection.query(sql, [values]);
			}
		});
		console.log("Password added!");
	}

	add_module(user, lecturer_id) {
		this.connection.query("INSERT INTO module VALUES ?", [
			[[user.module_code, user.module_name, lecturer_id]],
		]);
		console.log("Module added sucessfully");
	}

	add_session_dialogs(moduleName, userId, sessiongDialog) {
		this.get_module_code(moduleName, (err, code) => {
			if (err) {
				throw new Error("Session Dialogs couldn't be added");
			} else {
				const sql = "insert into session_dialogs values ?";
				const date = new Date().toISOString.slice(0, 10);
				const values = [code, sessiongDialog, date, userId];
				this.connection.query(sql, [values]);
			}
		});
	}

	get_module_code(moduleName, callback) {
		const sql = "select module_code from module where module_name = ?";
		this.connection.query(sql, [moduleName], (err, row) =>
			err ? callback(err, null) : callback(null, row[0].module_code)
		);
	}

	get_modules(lecturer_id, callback) {
		const sql = "SELECT * FROM module WHERE lecturer_id = ?";

		this.connection.query(sql, [lecturer_id], (err, rows) => {
			if (err) {
				callback(err, null);
				throw new Error("No module match with ID:", lecturer_id);
			}
			callback(null, rows);
		});
	}

	getName(lecturer_id, callback) {
		const sql = "SELECT first_name, last_name FROM user WHERE user_id = ?";

		this.connection.query(sql, [lecturer_id], (err, rows) => {
			if (err) {
				console.error("Error fetching user:", err);
				callback(err, null);
			} else if (rows.length === 0) {
				console.error("User not found!");
				callback(null, null);
			} else {
				const name = rows[0].first_name.trim() + " " + rows[0].last_name.trim();
				callback(null, name);
			}
		});
	}

	lookUpUser(user_id, password, callback) {
		const sql =
			"SELECT user_password FROM user_authentication WHERE user_id = ?";

		this.connection.query(sql, [user_id], (err, rows) => {
			if (err) {
				callback(err, false);
				return;
			}

			if (rows.length === 0) {
				callback(null, false);
				return;
			}

			const pass = rows[0].user_password;
			bcrypt.compare(password, pass, (err, valid) => {
				if (err) {
					callback(err, null);
				}
				valid ? callback(null, true) : callback(null, false);
			});
		});
	}
}

module.exports = Database;

// const lecturer = {
// 	first_name: "Dr Arnett",
// 	last_name: "Campbell",
// 	email: "jovaughn4@gmail.com",
// 	user_id: 2111876,
// 	password: "hotskull",
// 	module_code: "MAT2003",
// 	module_name: "Calculus",
// };

// const db = new Database(
// 	"localhost",
// 	"root",
// 	"",
// 	"a_of_a_student_participation"
// );

// const mod = { module_code: "STA2016", module_name: "Design of Experiments" };
// const mod1 = { module_code: "MAT2003", module_name: "CALCULUS" };

// const id = 2111876;
// db.establishConnection();
// db.add_module(mod1, id);
// db.get_modules(id, (err, module) => {
// 	if (err) console.log(err);
// 	console.log(module[0].module_name);
// });

// db.getName(id, (value) => {
// 	if (!value) console.log("No name found!");
// 	else {
// 		console.log("Name:", value);
// 	}
// });

// db.show_users("module");
// db.add_user(lecturer);

// db.get_module_code("Analysis of Algorithm", (err, value) => {
// 	if (err) console.error("Error:", err);
// 	else console.log(value);
// });
