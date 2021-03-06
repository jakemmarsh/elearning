'use strict';

var express        = require('express');
var morgan         = require('morgan');
var compression    = require('compression');
var methodOverride = require('method-override');
var bodyParser     = require('body-parser');
var busboy         = require('connect-busboy');
var session        = require('express-session');
var passport       = require('passport');
var nodeJSX        = require('node-jsx');
var React          = require('react');
var Router         = require('react-router');
var DocumentTitle  = require('react-document-title');
var ReactAsync     = require('react-async');
var models         = require('./api/models');
var api            = require('./api');
var app            = express();
var server         = app.listen(process.env.PORT || 3000);
var populateDb     = require('./populateDb');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var Routes;
var Html;

/* ====================================================== */

// Require JSX files as node modules
nodeJSX.install({ extension: '.jsx' });
Routes = require('./js/Routes.jsx');
Html = require('./js/Html.jsx');

/* ====================================================== */

app.use(morgan('dev'));     // Logs all requests to the console
app.use(compression());     // Compresses response data with gzip/deflate
app.use(methodOverride());  // Simulates DELETE and PUT
app.use(bodyParser.json()); // Parses req.body json from html POST
app.use(bodyParser.urlencoded({
    extended: true
}));                        // Parses urlencoded req.body, including extended syntax
app.use(busboy());          // Parse multipart/form-data
app.set('json spaces', 0);  // Remove superfluous spaces from JSON responses
app.use(session({
  secret: process.env.SECRET,
  rolling: true,
  cookie: {
    maxAge: 1000*60*30 // only 30 minutes until user logs in
  },
  store: new SequelizeStore({ db: models.sequelize }),
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

/* ====================================================== */

// Connect to database and initialize models
if ( process.env.NODE_ENV === 'production' ) {
  models.sequelize.sync();
} else {
  models.sequelize.sync({ force: true }).done(function() {
    populateDb(models);
  });
}

/* ====================================================== */

// Add headers
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

/* ====================================================== */

// serve all asset files from necessary directories
// TODO: find a way to get rid of these wildcards?
app.use('*/lib', express.static(__dirname + '/lib'));
app.use('*/js', express.static(__dirname + '/build/js'));
app.use('*/images', express.static(__dirname + '/build/images'));
app.use('*/css', express.static(__dirname + '/build/css'));
app.use('*/fonts', express.static(__dirname + '/build/fonts'));

// Mount the API
app.use('/api', api(server));

// Serve React app for all main routes
app.get('/*' ,function(req,res) {
  Router.run(Routes, req.path, function(Handler, state) {
    var title = DocumentTitle.rewind();
    var HandlerComponent = React.createElement(Handler, { params: state.params, query: state.query });
    var HtmlComponent;

    ReactAsync.renderToStringAsync(HandlerComponent, function(err, markup/*, data*/) {
      if ( err ) {
        console.trace('error rendering to string:', err);
        res.status(500).json({ status: 500, message: err });
      } else {
        HtmlComponent = React.createElement(Html, { title: title, markup: markup });
        res.send('<!DOCTYPE html>\n' + React.renderToString(HtmlComponent));
      }
    });
  });
});