// DSTCT
// Copyright (C) 2015 Miss Sweeti.
// Not affiliated with Klei, so don't ask them for help
// See LICENSE file for more information.

var http = require("http");
var cheerio = require("cheerio");
var request = require("request");
var fs = require("fs");

function reject(res, f){
  res.writeHead(406, {"Content-Type": "text/json"});
  if( ! f ) res.end("Invalid request.");
  else res.end("Invalid request: " + f);
}

// Make my life easier
String.prototype.startsWith = function(str){
  return this.substring(0,str.length) == str;
}

// Server
http.createServer(function(req,res){
  if( req.url == "/" || req.url.startsWith("/index") ){
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(fs.readFileSync("./index.html"));
  }
  else if( req.url.startsWith("/w/") ){

    /*

      Workshop ID guidelines
      - ID must be given (duh)
      - ID must be an integer
      - ID must be >300000000 (DST wasn't invented before that screenshot)
      - ID must exist
      - ID must be a workshop collection
      - Collection must be for Don't Starve Together

    */

    if( req.url.split("/")[2] == "" ) return reject(res, "missing workshop ID");

    var id = req.url.split("/")[2];
    if( isNaN(parseInt(id)) ) return reject(res, "invalid workshop ID (must be an integer)");
    id=parseInt(id);
    if( id < 300000000 ) return reject(res, "invalid workshop ID (must be >300000000)");

    // Okay looks good so far, let's get it

    request("http://steamcommunity.com/sharedfiles/filedetails/?id=" + id, function(e,r,b){
      if( e ) return reject(res, "invalid workshop ID: " + e);

      // cheerio's turn
      $ = cheerio.load(b);

      // let's make sure this is for Don't Starve Together
      if( $(".breadcrumbs").children("a")[0].children[0].data != "Don't Starve Together" ) return reject(res, "item not for Don't Starve Together");

      // let's make sure this is a collection
      if( $(".breadcrumbs").children("a")[2].children[0].data != "Collections" ) return reject(res, "not a Collection");

      // okay, now let's get the workshop IDs
      var collection = [];
      $(".collectionItemDetails").each(function(v){
        collection.push(cheerio(this).children("a")[0].attribs.href.replace("http://steamcommunity.com/sharedfiles/filedetails/?id=", ""));
      });

      // ndun
      res.writeHead(200, {"Content-Type": "text/json"});
      res.end(JSON.stringify(collection));

    });

  }
  else {
    res.writeHead(404, {"Content-Type": "text/html"});
    res.end("Not Found");
  }
}).listen(3000);
