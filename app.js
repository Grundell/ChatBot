var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
var intents = new builder.IntentDialog();
server.post('/api/messages', connector.listen());

var options = {
  url: 'https://confetti-api.herokuapp.com/login',
  method: 'POST',
  headers: {
     "content-type": "application/json",
    },
  json: {
    "email": "max.grundell@gmail.com",
    "password": "Stornall3"
  }
};

var auth = 'Basic ' + new Buffer('3754-1481732585960:k9PZndXeI69+NnzcK95QCIM2GASzmvHoZTN5Nuegijk=').toString('base64');
  
var userSession;

// var postObject = {
//   url: 'https://confetti-api.herokuapp.com/admin/tickets',
//   method: 'POST',
//   headers: {
//      "content-type": "application/json",
//      "Authorization": auth
//     },
//   json:{
//   "ticket": {
//     "name": "Max Oscar Grundell",
//     "email": "max.grundell@northernasset.se",
//     "status": "attending",
//     "values": {
//       "field-company": "Northern Asset Consulting AB"
//     },
//     "dontSendConfirmation": false,
//     "event": "5053"
//   }
// }
// }

// Creating bot. 
var bot = new builder.UniversalBot(connector);

bot.dialog('/', [
    function(session) {
        session.beginDialog('/profile', session.userData.profile);
    },
    function(session, result) {
        session.userData.profile = result.response;
         request(options, function (error, response, body) {
            if (!error) {
                var postObject = {
                        url: 'https://confetti-api.herokuapp.com/admin/tickets',
                        method: 'POST',
                        headers: {
                            "content-type": "application/json",
                            "Authorization": auth
                            },
                        json:{
                            "ticket": {
                                "name": session.userData.profile.name,
                                "email": session.userData.profile.email,
                                "status": "attending",
                                "values": {
                                            "field-company": session.userData.profile.company
                                          },
                                "dontSendConfirmation": false,
                                "event": "5053"
                            }
                        }
                    }
                    console.log(postObject);
                // request(postObject, function(error, response, body){
                //      console.log('error:', error);
                //      console.log('repsonse', response);
                //      console.log('body', body);
                // });
           //   console.log('response from confetti:', body) // Print the shortened url.
            } 
            if (error){
                console.log('the erorr:', error, '\n resposnse', response, '\n body' );
            }
            });
        session.send('Hello %(name)s! \n You\'re with %(company)s, and your email is %(email)s', session.userData.profile);
    }
]);

bot.dialog('/profile', [
    function name(session, args, next){
        session.dialogData.profile = args || {};
        if(!session.dialogData.profile.name){
            builder.Prompts.text(session, 'Hi there, what\'s your name?');
        } else {
            next();
        }
    },
    function (session, results, next){
        if(results.response){
            session.dialogData.profile.name = results.response;
        }
        if(!session.dialogData.profile.company){
            builder.Prompts.text(session, "Cool what company are you working for?");
        } else {
            next();
        }
    },
    function (session, results, next){
        if(results.response){
            session.dialogData.profile.company = results.response;
        }
        if(!session.dialogData.profile.email){
            console.log(session.dialogData.profile.name)
            session.send('Splendid, %(name)s', session.dialogData.profile)
            builder.Prompts.text(session, "Can i ask for your email?");
        } else {
            next();
        }
    },
    function(session, results, next){
        if(results.response){
            session.dialogData.profile.email = results.response;
        } 
        if(!session.dialogData.profile.approved){
            session.send('So I will sign you up for our lauch party under: %(name)s! \n You\'re with %(company)s, and your email is %(email)s', session.dialogData.profile);
            builder.Prompts.text(session, 'Is that correct?');
        } else {
            next();
        }
    },
    function(session, results, next){
        if(results.response == 'yes' || results.response == 'Yes' || results.response == 'Ja' ){
            next();
        } else {
            builder.Prompts.text('Okay, what was inccorect?');
        }
    },
    function(session, results){
        if(results.response){
            name();
            //session.dialogData.profile.approved = results.response;
        }
        session.endDialogWithResult({response: session.dialogData.profile});
    }
]);