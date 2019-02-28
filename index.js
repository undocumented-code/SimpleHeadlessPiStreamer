const exec = require('shelljs').exec;
const fs = require('fs');
const express = require('express')
const app = express()
const port = 3000

function getConfig(key) {
	const config = JSON.parse(fs.readFileSync('config.json'));
	return config[key];
}

function setConfig(key, value) {
	const config = JSON.parse(fs.readFileSync('config.json'));
	config[key] = value;
	fs.writeFileSync('config.json', JSON.stringify(config));
}

function isRunning() {
	return exec('docker container inspect streamer', {silent: true}).code === 0;
}

function startCam(key) {
	key = key || getConfig(key);
	return exec(`docker run --privileged --name streamer -d -ti alexellis2/streaming:17-5-2017 ${key}`, {silent: true}).code === 0;
}

function stopCam() {
	return exec('docker rm -f streamer', {silent: true}).code === 0;
}

if(getConfig('shouldStartOnStart')) {
	stopCam();
	startCam(getConfig('streamkey'));
}

app.use(express.static('public'));

app.get('/api/status', (req, res) => {
	res.send({status: (isRunning() ? 'started' : 'stopped'), key: getConfig('streamkey')});
});

app.get('/api/start', (req, res) => {
	stopCam();
	const response = startCam(req.query.key);
	if(req.query.key) setConfig('streamkey', req.query.key);
	if(response) setConfig('shouldStartOnStart', true);
	res.send({response: (response ? 'ok' : 'failed'), status: (isRunning() ? 'started' : 'stopped'), key: getConfig('streamkey')});
});

app.get('/api/stop', (req, res) => {
	const response = stopCam();
	if(response) setConfig('shouldStartOnStart', false);
	res.send({response: (response ? 'ok' : 'failed'), status: (isRunning() ? 'started' : 'stopped'), key: getConfig('streamkey')});
});

app.listen(port, () => console.log(`Youtube Streamer listening on port ${port}!`))
