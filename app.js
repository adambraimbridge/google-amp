'use strict';
const express = require('express');
const logger = require('morgan');
const raven = require('raven');
const cookieParser = require('cookie-parser');
const assertEnv = require('@quarterto/assert-env');
const ftwebservice = require('express-ftwebservice');
const path = require('path');
const os = require('os');

const port = process.env.PORT || 5000;
const app = express();

ftwebservice(app, {
	manifestPath: path.join(__dirname, 'package.json'),
	about: {
		schemaVersion: 1,
		name: 'google-amp',
		purpose: 'Serve Google AMP pages',
		audience: 'public',
		primaryUrl: 'https://amp.ft.com',
		serviceTier: 'bronze',
		appVersion: process.env.HEROKU_SLUG_COMMIT,
		contacts: [
			{
				name: 'Richard Still',
				email: 'richard.still@ft.com',
			},
			{
				name: 'Matthew Brennan',
				email: 'matthew.brennan@ft.com',
			},
			{
				name: 'George Crawford',
				email: 'george.crawford@ft.com',
			},
		],
	},
});

let ravenClient;

if(app.get('env') === 'production') {
	assertEnv(['SENTRY_DSN']);
	ravenClient = new raven.Client(process.env.SENTRY_DSN);
	ravenClient.setExtraContext({env: process.env});
	ravenClient.setTagsContext({server_name: process.env.HEROKU_APP_NAME || os.hostname()});
	ravenClient.patchGlobal(() => process.exit(1));
}

assertEnv([
	'AWS_ACCESS_KEY',
	'AWS_SECRET_ACCESS_KEY',
	'ELASTIC_SEARCH_URL',
]);

const warnEnv = assertEnv.warn([
	'BRIGHTCOVE_ACCOUNT_ID',
	'BRIGHTCOVE_PLAYER_ID',
	'SPOOR_API_KEY',
	'API_KEY_V1',
]);

if(warnEnv) {
	ravenClient.captureMessage(warnEnv, {level: 'warning'});
}

if(app.get('env') === 'production') {
	app.use(raven.middleware.express.requestHandler(ravenClient));
	app.use((req, res, next) => {
		ravenClient.setExtraContext(raven.parsers.parseRequest(req));
		req.raven = ravenClient;
		next();
	});
}

app.use(logger(process.env.LOG_FORMAT || (app.get('env') === 'development' ? 'dev' : 'combined')));
app.use(cookieParser());

app.get('/content/:uuid', require('./server/controllers/amp-page.js'));
app.get('/api/:uuid', require('./server/controllers/jsonItem.js'));

app.all('/amp-access-mock', require('./server/controllers/access-mock.js'));
app.get('/_access_mock', (req, res) => {
	res.cookie('amp_access_mock', '1');
	res.status(200).send('Your amp_access_mock cookie was set. Please revisit the ' +
		'<a href="javascript:history.back()">previous page</a>.');
});
app.get('/_access_mock/clear', (req, res) => {
	res.clearCookie('amp_access_mock');
	res.status(200).send('Your amp_access_mock cookie was cleared. Please revisit the ' +
		'<a href="javascript:history.back()">previous page</a>.');
});

if(app.get('env') === 'development') {
	app.all('/analytics', require('./server/controllers/analytics-proxy.js'));
	app.use(require('errorhandler')());
} else if(app.get('env') === 'production') {
	app.use(raven.middleware.express.errorHandler(ravenClient));
}

app.all('/analytics/config.json', require('./server/controllers/analytics-config.js'));

app.listen(port, () => console.log('Up and running on port', port));
