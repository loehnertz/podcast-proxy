// Exports
const fs = require('fs');
const express = require('express');
const proxy = require('express-http-proxy');
const register = require('prom-client').register;
const Counter = require('prom-client').Counter;


// Constants
const Port = 3015;
const EpisodeHostKey = 'episodeHost';
const EpisodeBasePathKey = 'episodeBasePath';
const EpisodeBaseNameKey = 'episodeBaseName';
const EpisodeFileExtensionKey = 'episodeFileExtension';

// Initializations
const server = express();

const counterDownloads = new Counter({
    name: 'downloads',
    help: 'Amount of downloads per episode',
    labelNames: ['episode']
});

// Enable collection of default metrics
require('prom-client').collectDefaultMetrics();


// Helpers
const config = JSON.parse(fs.readFileSync('config.json'));


// Endpoints
server.use('/episodes/:number', proxy(config[EpisodeHostKey], {
    proxyReqPathResolver: (req) => {
        const episodeBasePath = config[EpisodeBasePathKey];
        const episodeBaseName = config[EpisodeBaseNameKey];
        const episodeFileExtension = config[EpisodeFileExtensionKey];
        const episodeNumber = req.params['number'];

        if (req.method === 'GET') counterDownloads.inc({'episode': episodeNumber});

        return (episodeBasePath + episodeBaseName + episodeNumber + episodeFileExtension);
    }
}));

server.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});

server.get('/metrics/counter', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.getSingleMetricAsString('test_counter'));
});


// Startup
console.log('Server listening on port: ' + Port);

server.listen(Port);
