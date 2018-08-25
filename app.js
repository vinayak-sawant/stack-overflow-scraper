var http = require("http");
var express = require('express');
var mysql = require('mysql');
var app = express();
var bodyParser = require('body-parser');
const FS = require('fs');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
const CHEERIO = require('cheerio');
const JSONFRAME = require('jsonframe-cheerio');
const REQUEST = require('request');
var path    = require("path");

app.use('/resources', express.static('resources'));

var connection = mysql.createConnection({
    //properties
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'stack_overflow_scraper'
});

connection.connect(function(error) {
    if (!!error) {
        console.log('Error');
    } else{
        console.log('Connected');
    }
});

// Running Server Details.
var server = app.listen(8082, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("The scraper app listening at %s:%s Port", host, port)
});
 
// Routes
// Entry point of app (form to get tags)
app.get('/app', function (req, res) {
  res.sendFile(path.join(__dirname+'/resources/pages/app.html'));
});
 
 // Route to scrape the data using cheerio and jsonframe
app.post('/scrape', urlencodedParser, function (req, resp){

                        connection.query("DROP TABLE IF EXISTS `ids`",function(error, rows, fields) {
                            // callback...
                            if (!!error) {
                            console.log('Error in the query drop 1', error);
                            } else{
                                console.log('Successful query');
                            }
                        });

                        connection.query("DROP TABLE IF EXISTS `lang`",function(error, rows, fields) {
                            // callback...
                            if (!!error) {
                            console.log('Error in the query drop 2', error);
                            } else{
                                console.log('Successful query');
                            }
                        });

                        connection.query("DROP TABLE IF EXISTS `questions`",function(error, rows, fields) {
                            // callback...
                            if (!!error) {
                            console.log('Error in the query drop 3', error);
                            } else{
                                console.log('Successful query');
                            }
                        });

                        

                        connection.query("CREATE TABLE IF NOT EXISTS questions(QUES_ID INT NOT NULL , question VARCHAR(100), user VARCHAR(30), score INT, votes INT, answers INT, views INT, PRIMARY KEY (QUES_ID) )",function(error, rows, fields) {
                        // callback...
                        if (!!error) {
                        console.log('Error in the create 1', error);
                        } else{
                            console.log('Successful query');
                            }
                        });

                        connection.query("CREATE TABLE IF NOT EXISTS lang(language VARCHAR(20), questionstagged INT,PRIMARY KEY (language) )",function(error, rows, fields) {
                        // callback...
                        if (!!error) {
                        console.log('Error in the create 2', error);
                        } else{
                            console.log('Successful query');
                            }
                        });

                        connection.query("CREATE TABLE IF NOT EXISTS ids(language VARCHAR(20), QUES_ID INT, FOREIGN KEY (QUES_ID) REFERENCES questions(QUES_ID),FOREIGN KEY (language) REFERENCES lang(language))",function(error, rows, fields) {
                        // callback...
                        if (!!error) {
                        console.log('Error in the create 3', error);
                        } else{
                            console.log('Successful query');
                            }
                        });

    var counterSet = new Set();
    var inputArray = JSON.parse(req.body.tags);
    inputArray.forEach(function(element, index) {
        REQUEST('http://stackoverflow.com/questions/tagged/'+element, function (error, response, html) {
            if (error) {
                            console.log("error!!!!");
                        }
            let $ = CHEERIO.load(html);
            JSONFRAME($);
            let frame = {
                questions: {
                    _s: "#questions .question-summary",
                    _d: [{
                        "votes": ".statscontainer .stats .vote .votes .vote-count-post strong",
                        "answers": ".statscontainer .stats .status strong",
                        "views": ".statscontainer .views",
                        "title": ".summary h3 a",
                        "tags": [".summary .tags a"],
                        "url": ".question-hyperlink @ href",
                        "user": {
                            "name": ".summary .started .user-info .user-details a",
                            "profile-link": ".summary .started .user-info .user-details a @ href",
                            "reputation": ".summary .started .user-info .user-details .-flair .reputation-score"
                        },
                        "date asked": ".summary .started .user-info .user-action-time .relativetime"
                    }]
                }
            }
            let questionsList = $('body').scrape(frame, { string: true });
            let questions = JSON.parse(questionsList);
            let totalQuestions = Object.keys(questions.questions).length;

            connection.query("INSERT INTO lang (language,questionstagged) VALUES('"+element+"','"+totalQuestions+"')",function(error, rows, fields) {
                    // callback...
                    if (!!error) {
                    console.log('Error in the query 3', error);
                    } else{
                        console.log('Successful query lang');
                    }
                });

            for ( let i = 0; i < totalQuestions; i++)
            {

                let res = questions.questions[i].url.split("/");
                connection.query("INSERT INTO questions (QUES_ID,question,user,score,votes,answers,views) VALUES('"+res[2]+"','"+mysql_real_escape_string(questions.questions[i].title)+"', '"+questions.questions[i].user.name+"','"+questions.questions[i].user.reputation+"','"+questions.questions[i].votes+"','"+questions.questions[i].answers+"','"+parseInt(questions.questions[i].views)+"')",function(error, rows, fields) {
                    // callback...
                    if (!!error) {
                    console.log('Error in the query 1', error);
                    } else{
                        connection.query("INSERT INTO ids (language,QUES_ID) VALUES('"+element+"','"+res[2]+"')",function(error, rows, fields) {
                        // callback...
                        if (!!error) {
                        console.log('Error in the query 2', error);
                        } else{
                            console.log('Successful query ids');
                            counterSet.add(index);
                            if (i === (totalQuestions-1) && counterSet.size === inputArray.length) {
                                console.log('redirecting to TREE!!!');
                                resp.sendFile(path.join(__dirname+'/resources/pages/menu.html'));   
                            }
                        }
                    });
                    }
                });
            }
        });
    }); 
});

// route to get tree chart using d3
app.get('/tree', function (req, res) {
    connection.query("SELECT * FROM questions INNER JOIN ids ON questions.QUES_ID=ids.QUES_ID",function(error, rows, fields) {

    if (!!error) {
    console.log('Error in the query', error);
    } else{
        console.log('Successful query');
        
        var fileData = {};
        var fileDataArray = [];
        var fileDataValue = {};

        var data = JSON.parse(JSON.stringify(rows));

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                fileDataValue['question'] = data[key].question;
                fileDataValue['user'] = data[key].user;
                fileDataValue['score'] = data[key].score;
                fileDataValue['votes'] = data[key].votes;
                fileDataValue['answers'] = data[key].answers;
                fileDataValue['views'] = data[key].views;
                fileDataValue['language'] = data[key].language;
                fileDataArray.push(fileDataValue);
                fileData[data[key].QUES_ID] = fileDataArray;
                fileDataArray= [];
                fileDataValue= {};
        }
    }

        FS.writeFile('resources/json/tree.json', JSON.stringify(fileData), function (error) {
                if (error) {
                    console.log("ERROR OCCUERED IN FS");
                }
                else{
                    console.log("Successful IN FS")
                }
            });
    }
    });
  res.sendFile(path.join(__dirname+'/resources/pages/tree.html'));
});

// Route to get Bar chart using chartjs
app.get('/chart', function (req, res) {
    connection.query("SELECT * FROM lang",function(error, rows, fields) {

    if (!!error) {
    console.log('Error in the query', error);
    } else{
        console.log('Successful query');
        
        FS.writeFile('resources/json/chart.json', JSON.stringify(rows), function (error) {
                if (error) {
                    console.log("ERROR OCCUERED IN FS");
                }
                else{
                    console.log("Successful IN FS")
                }
            });
    }
    });
  res.sendFile(path.join(__dirname+'/resources/pages/chart.html'));
});

// function to escape SQL special characters
function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; 
        }
    });
}