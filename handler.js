var elasticsearch = require('elasticsearch');
var uuid = require('uuid/v1');
var express = require('express');
var request = require('request');
var parseString = require('xml2js').parseString;

var client = new elasticsearch.Client({
  host: 'search-universal-data-wv5jdu5cdmklgnr3b3gawbrfuu.us-west-2.es.amazonaws.com',
  log: 'info'
});

client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 5000
}, function (error) {
  if (error) {
    console.trace('elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

function fetchWaitingTimes() {
    request('http://www.universalstudioshollywood.com/waittimes/?type=all&site=USH', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var upload = [];
            parseString(body, function (err, result) {
                var items = result.rss.channel[0].item;
                for (var i = 0; i < items.length; ++i) {
                    upload.push({
                       'timeStamp': Date.now(),
                       'rideName': items[i].title[0],
                       'description': items[i].description[0]
                    });
                }
            });
            loadDataSet(upload);
        } else {
    console.log(error);
  }
    })
}

var loadDataSet = function(items) {
    for (var i = 0; i < items.length; ++i) {
        client.create({
            index: 'data',
            type: 'waitTime',
            id: uuid(),
            body: items[i]
        }, function (error, response) {
    if(error) {
      console.log(error);
    }
    console.log("Data Uploaded")
        })
    }
};

function searchTest(searchterm, callback) {
  client.search({
    index: 'data',  
    body: {
      "query": {
        "bool": {
          "must": {
            "match": {
              "keywords": searchterm
            }
          },
        }
      }
    }
  }, function (error, response) {
    console.log(response);
    if (callback) {
      callback(response);
    }
  });
}

var app = express()

app.get('/search', function (req, res) {  
  searchTest(req.query.q, function(result) {
    res.send(result);
  });
})

var wait = 100000
var waitTimer = function () {
    setInterval(function () {
        fetchWaitingTimes();
    }, wait)
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})



