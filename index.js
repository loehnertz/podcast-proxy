// Exports
const fs = require('fs');
const express = require('express');
const proxy = require('express-http-proxy');
const register = require('prom-client').register;
const Counter = require('prom-client').Counter;


// Constants
const PortKey = 'port';
const EpisodeHostKey = 'episodeHost';
const EpisodeBasePathKey = 'episodeBasePath';
const EpisodeBaseNameKey = 'episodeBaseName';
const EpisodeFileExtensionKey = 'episodeFileExtension';

// Initializations
const config = JSON.parse(fs.readFileSync('config.json'));

const server = express();

const counterDownloads = new Counter({
    name: 'downloads',
    help: 'Amount of downloads per episode',
    labelNames: ['episode']
});

// Enable collection of default metrics
require('prom-client').collectDefaultMetrics();


// Endpoints
server.use('/proxy/episodes/:number', proxy(config[EpisodeHostKey], {
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


// Startup
console.log('Server listening on port: ' + config[PortKey]);

server.listen(config[PortKey]);
