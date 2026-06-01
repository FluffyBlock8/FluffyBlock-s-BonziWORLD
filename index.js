// ========================================================================
// Server init
// ========================================================================

// Filesystem reading functions
const fs = require('fs-extra');

// Load settings
try {
        stats = fs.lstatSync('settings.json');
} catch (e) {
        // If settings do not yet exist
        if (e.code == "ENOENT") {
                try {
                        fs.copySync(
                                'settings.example.json',
                                'settings.json'
                        );
                        console.log("Created new settings file.");
                } catch(e) {
                        console.log(e);
                        throw "Could not create new settings file.";
                }
        // Else, there was a misc error (permissions?)
        } else {
                console.log(e);
                throw "Could not read 'settings.json'.";
        }
}

// Load settings into memory
const settings = require("./settings.json");
// Setup basic express server
var express = require('express');
var app = express();
if (settings.express.serveStatic)
        app.use(express.static('./build/www'));
var server = require('http').createServer(app);

// ========================================================================
// Crosscolor image proxy
// ========================================================================

const https = require('https');
const http = require('http');

function isAllowedImageUrl(url) {
    if (typeof url != "string") return false;
    var m = url.match(/^https?:\/\/([^\/?#]+)/i);
    if (!m) return false;
    var host = m[1].toLowerCase();
    var allowed = [
        /(^|\.)catbox\.moe$/,
        /(^|\.)imgbb\.com$/,
        /(^|\.)ibb\.co$/,
        /(^|\.)i\.ibb\.co$/,
        /(^|\.)imgur\.com$/,
        /(^|\.)upload\.wikimedia\.org$/,
        /(^|\.)wikimedia\.org$/,
        /(^|\.)wikipedia\.org$/,
        /(^|\.)wikia\.nocookie\.net$/,
        /(^|\.)fandom\.com$/
    ];
    for (var i = 0; i < allowed.length; i++) {
        if (allowed[i].test(host)) return true;
    }
    return false;
}

app.get('/proxy-image', function(req, res) {
    var url = req.query.url;
    if (!url || !isAllowedImageUrl(url)) {
        return res.status(403).send('Forbidden');
    }
    var transport = url.startsWith('https') ? https : http;
    transport.get(url, function(proxyRes) {
        var contentType = proxyRes.headers['content-type'] || 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        proxyRes.pipe(res);
    }).on('error', function(err) {
        res.status(502).send('Bad Gateway');
    });
});

// Init socket.io
var io = require('socket.io')(server);
var port = process.env.PORT || settings.port;

exports.io = io;

// Init sanitize-html
var sanitize = require('sanitize-html');

// Init winston loggers (hi there)
const Log = require('./log.js');
Log.init();
const log = Log.log;

// Load ban list
const Ban = require('./ban.js');
Ban.init();

// Start actually listening
server.listen(port, function () {
        console.log(
                "\n",
                "Server domain: localhost\n",
                "------------------------\n",
                "Server listening on port: " + port
        );
});
app.use(express.static(__dirname + '/public'));

// ========================================================================
// Banning functions
// ========================================================================

// ========================================================================
// Helper functions
// ========================================================================

const Utils = require("./utils.js")

// ========================================================================
// The Beef(TM)
// ========================================================================

const Meat = require("./meat.js");
Meat.beat();

// Console commands
const Console = require('./console.js');
Console.listen();