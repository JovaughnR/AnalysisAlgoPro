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
			error ? console.error(error) : console.log({ "Database Status": 200 });
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
