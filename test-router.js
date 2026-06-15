const express = require('express');
const app = express();
const router = express.Router();

router.get("/:videoId", (req, res) => {
    console.log("MATCHED GET /:videoId with", req.params.videoId);
    res.send("GET");
});

router.post("/generate-upload-url", (req, res) => {
    console.log("MATCHED POST /generate-upload-url");
    res.send("POST");
});

app.use(router);

const request = require('http').request;
app.listen(3000, () => {
    const req = request({
        hostname: 'localhost',
        port: 3000,
        path: '/generate-upload-url',
        method: 'POST'
    }, (res) => {
        console.log("STATUS:", res.statusCode);
        process.exit(0);
    });
    req.end();
});
