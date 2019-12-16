var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useUnifiedTopology', true)
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://www.businessinsider.com/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $(".tout-title").each(function(i, element) {
        // Save an empty result object
        var result = {};
        result.title = $(this)
          .children("a")
          .text();
        result.summary = $(this).parent()
          .children(".tout-copy")
          .text();
        result.link = "https://www.businessinsider.com/" + $(this)
          .children("a")
          .attr("href");

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
  
      // Send a message to the client
      res.send("Scrape Complete");
    });
  });

  // Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    // TODO: Finish the route so it grabs all of the articles
    db.Article.find({}).then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err){
      res.json(err)
    })
  });
  
// Route for grabbing a specific Article by id, populate it with it's note
  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({_id: req.params.id}).populate("note").then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err){
      res.json(err)
    })
  });

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body).then(function(dbNote){
      return db.Article.findOneAndUpdate({_id: req.params.id}, { notes: dbNote._id }, { new: true })
    }).then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err){
      res.json(err)
    })
  });

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });