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
	username: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
});

const logSchema = new mongoose.Schema({
	username: { type: String, required: true },
	count: { type: Number, required: true },
	log: [exerciseSchema],
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);
const Log = mongoose.model("Log", logSchema);

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

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
