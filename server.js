var express = require("express");
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var path = require("path");
var validate = require('url-validator');




// get environment variables
var port = process.env.PORT || 8080;
var mongodb = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/urlshort';

// Connect to MongoDB.
mongoose.connect(mongodb);
var db = mongoose.connection;


var Schema = mongoose.Schema;
var urlSchema = mongoose.Schema ({
    "url": {
        type: String,
        required: true,
        index: true

    },
    "shortened": {
        type: String,
    }
});
var UrlInput = mongoose.model('UrlInput', urlSchema);

function saveUrl(data) {
    var url = new UrlInput(data);
    url.save(function (err) {
        if (err) return handleError(err);
        // saved!
        console.log('saved!');
    })
}


  function shorten(url_input) {
    return 'https://afternoon-waters-31321.herokuapp.com/' + Math.floor(Math.random() * 100000);
  }

  function saveToDb(inputurl, shorturl) {
    var entry = { 'url': inputurl, 'shortened': shorturl };
    saveUrl(entry);
  }

  function handleError(err){
     console.log('Mongoose connection error: ' + err);
     process.exit(1);
  }


// if connection throws an error
db.on('error', function (err) {
  console.log('Mongoose connection error: ' + err);
  process.exit(1);
});


// only start server if able to successfully connect to mongo database
db.on('connected', function () {
  console.log('Connected to mongoose database...');

  var app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(__dirname + "/public")); //server index.html






  app.get('/new/:url*', function (req, res) {
    if (!req.body) return res.sendStatus(400);
    var params = '';
    for (i in req.params) {
      params = (i, req.params[i]) + params;
    }
    var urlo = validate(params);
    if (urlo !== false) {
      var shortened = shorten(urlo);  // create shortened url
      saveToDb(urlo, shortened);  // save to input url and shortened url to DB
      return res.json({ "original_url": urlo, "shortened_url": shortened });
    }
    else {
      return res.json({ "error": "URL invalid" });
    }
  });


  app.get('/:url', function (req, res) {
    var urloutput = 'https://afternoon-waters-31321.herokuapp.com/' + req.params.url;
    UrlInput.findOne({ 'shortened' : urloutput}).exec().then(function(found) {
        if (found) {
            res.redirect(found.url);
        } else {
            res.send({error: "No short url found for given input"});
        }
    });
  });


  //start server
  app.listen(port, function () {
    console.log('Server listening on port ' + port + '...');
  });

});