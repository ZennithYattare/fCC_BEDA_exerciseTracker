/** @format */

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: "fcc_beda_exercisetracker",
	})
	.then(() => {
		console.log("Connected to the Database.");
	})
	.catch((err) => console.error(err));

const exerciseSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
	const newUser = new User({ username: req.body.username });

	await newUser
		.save()
		.then((result) => {
			res.json({
				username: result.username,
				_id: result._id,
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get("/api/users", async (req, res) => {
	await User.find({})
		.then((result) => {
			res.json(result);
		})
		.catch((err) => {
			console.log(err);
		});
});

app.post("/api/users/:_id/exercises", async (req, res) => {
	const { _id } = req.params;
	const { description, duration, date } = req.body;

	// Find the user by ID
	const user = await User.findById(_id);
	if (!user) {
		return res.status(404).send("User not found");
	}

	// Create a new exercise
	const exercise = new Exercise({
		userId: user._id,
		description,
		duration,
		date: date ? new Date(date) : undefined,
	});

	// Save the exercise to the database
	await exercise
		.save()
		.then((result) => {
			res.json({
				username: user.username,
				description,
				duration: parseInt(duration),
				_id: user._id,
				date: result.date.toDateString(),
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

app.get("/api/users/:_id/logs", (req, res) => {
	const { from, to, limit } = req.query;
	const userId = req.params._id;

	// Find the user by ID
	User.findById(userId)
		.then((user) => {
			if (!user) {
				return res.status(404).send("User not found");
			}

			// Find the exercises for the user
			Exercise.find({ userId: user._id })
				.where("date")
				.gte(from || "1970-01-01")
				.lte(to || Date.now())
				.limit(parseInt(limit))
				.exec()
				.then((exercises) => {
					// Format the exercises as a log
					const count = exercises.length;
					const log = exercises.map((exercise) => ({
						description: exercise.description,
						duration: exercise.duration,
						date: exercise.date.toDateString(),
					}));

					res.json({ username: user.username, count, log });
				})
				.catch((err) => {
					console.error(err);
					res.status(500).send("Server error");
				});
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send("Server error");
		});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
