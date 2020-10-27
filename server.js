const express = require("express");
const app = express();
const githubMiddleware = require("github-webhook-middleware")({
	secret: process.env.GITHUB_SECRET,
	limit: "1mb", // <-- optionally include the webhook json payload size limit, useful if you have large merge commits.  Default is '100kb'
});

app.post("/hooks/github/", githubMiddleware, function (req, res) {
	// Only respond to github push events
	if (req.headers["x-github-event"] != "push") return res.status(200).end();

	const payload = req.body;
	const repo = payload.repository.full_name;
	const branch = payload.ref.split("/").pop();

	console.log({ payload, repo, branch });
	const textFiles = getChangedFiles(payload.commits, /.*\.txt$/);
	console.log({ textFiles });
});

app.get("/hooks/github/", function (req, res) {
	// Only respond to github push events
	console.log("Nothing to see here");
});

// The Github push event returns an array of commits.
// Each commit object has an array of added, modified and deleted files.
// getChangedFiles() returns a list of all the added and modified files
// excluding any files which are subsequently removed.
function getChangedFiles(commits, matchRegex) {
	return commits
		.reduce(function (previousCommit, currentCommit) {
			return previousCommit
				.concat(currentCommit.modified)
				.concat(currentCommit.added)
				.filter(function (value) {
					return currentCommit.removed.indexOf(value) === -1;
				});
		}, [])
		.filter(function (value, i, arr) {
			return arr.indexOf(value) >= i && matchRegex.test(value);
		});
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Listening at port ${port}`);
});
