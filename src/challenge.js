/**
 * @author: Ashwin
 * Main worker module which creates the express app and starts listening on the provided socket
 */
(function (module) {
    'use strict';

    var http                    = require('http'),
        fs                      = require('fs'),
        cluster                 = require('cluster'),
        express                 = require('express'),
        morgan                  = require('morgan'),
        expressDomainMiddleware = require('express-domain-middleware'),
        Router                  = require('./controllers/router'),
        bodyParser              = require('body-parser'),
        util                    = require('util'),
        config                  = require('./config/challenge.json');

    var PORT            = config.port;
    var MAX_CONNECTIONS = config.max_connections;

    /**
     * The app constructor.
     * Creates an instance of express app & set's up all the middlewares, routers, and error handlers
     * @constructor
     */
    var Challenge = function () {
        var self  = this;
        self._app = express();

        // Setup access logging
        var accessLogPath   = config.log_directory + '/' + config.app_name + '_access.log';
        var accessLogStream = fs.createWriteStream(accessLogPath, {flags: 'a'});
        self._app.use(morgan(self._getAccessLogFormat(), {stream: accessLogStream}));

        // Setup template engine & view renderer
        self._app.set('views', __dirname + '/views/web');
        self._app.set('view engine', 'jade');

        self._app.use(expressDomainMiddleware); // domains middleware will attach a domain to each request
        self._app.use(bodyParser.json()); // read json input in post
        self._app.use(bodyParser.urlencoded({extended: true})); // read url encoded form data

        self._app.use('/static', express.static(__dirname + '/static_content')); // serve static files
        self._app.use('/bower', express.static(__dirname + '/bower_components')); // serve bower packages
        Router.loadRoutingTable(self._app); // Load routes

        // Express error handler. Give the current context to our error handler so that it can
        // gracefully restart the current worker in case of any uncaught exceptions
        self._app.use(function (err, req, res, next) {
            self.onError(err, req, res, next, self);
        });
    };

    /**
     * Start the web server process.
     * In cluster configuration, this is a worker
     */
    Challenge.prototype.start = function () {
        try {
            this._server                = this._app.listen(PORT);
            this._server.maxConnections = MAX_CONNECTIONS;
            console.log('Started listening on port ' + PORT);
            console.log('Please point your browser to 127.0.0.1:' + PORT +
                        ' to see the result. Please note that you\'ll need to restart the server after making changes.')
        } catch (e) {
            console.log(e);
            console.log('Something went wrong while staring the app. Please see if someone else is listening on the same port.')
        }
    };

    /**
     * Express error handler.
     * Since we are using express-domain-middleware, there'll be a domain attached to each request.
     * Errors in the same call stack & ones from async stacks will come to this handler.
     * In either cases, log it and send response to client.
     *
     * In case the error is from a domain (async callback threw an error),
     * we're killing the process to avoid going into an inconsistent state.
     *
     * @param err error object
     * @param req the request which triggered the error
     * @param res response object
     * @param next next middleware in stack
     * @param self reference to our app (context will be lost if this is triggered from outside current call stack
     *     boundary)
     */
    Challenge.prototype.onError = function (err, req, res, next, self) {
        res.status(500).send('Well, you are in trouble, aren\'t ya? See console log to see what is wrong.');
        console.log(util.inspect(err, {depth: null, colors: true}));
        if (err.domain) {
            self.stopGracefully();
        }
    };

    /**
     * Stop the app gracefully.
     * Stop accepting connections from clients, disconnect from cluster so that master can spawn a replacement, and let
     * the existing connections close.
     */
    Challenge.prototype.stopGracefully = function () {
        var self = this;
        // Stop accepting connections
        self._server.close(function (err) {
            process.exit(1);
        });
        // Disconnect from master. This will trigger an event in master.
        cluster.worker.disconnect();
    };

    /**
     * Get access log format as described @ https://github.com/expressjs/morgan
     * @returns {string}
     * @private
     */
    Challenge.prototype._getAccessLogFormat = function () {
        return ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
    };

    module.exports = Challenge;

}(module));