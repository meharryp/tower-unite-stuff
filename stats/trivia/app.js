// https://discordapp.com/oauth2/authorize?&client_id=177885009393352705&scope=bot&permissions=11280



// Hacky fix count: 3



var Discord = require( "discord.io" ),

	request = require( "request" );



var bot = new Discord( {

	token: "MTc3ODg1MTcxODg4OTQ3MjAw.Cg1D-Q.8GVPgUYL2X08-iv3UCV18wWoFxA",

	autorun: true

} );



Array.prototype.shuffle = function(){

	for ( var i = this.length - 1; i > 0; i-- ){

		var rand = Math.floor( Math.random() * ( i + 1 ) );

		var temp = this[ i ];

		this[ i ] = this[ rand ];

		this[ rand ] = temp;

	};



	return this;

};



function RetryUntil( msg, chan, game, cb ){

    bot.sendMessage( { 

        to: chan,

        message: msg

    }, 

        function( err, event ){

            if ( !err && event ){

               cb( err, event );

            } else {

                setTimeout( function(){

                    RetryUntil( msg, chan, game, cb );

                } )

            }

    } )

}



function CloneObject( obj ){

	return JSON.parse( JSON.stringify( obj ) );

}



function sortObject(obj) {

	var arr = [];

	for (var prop in obj) {

		if (obj.hasOwnProperty(prop)) {

			arr.push({

				'key': prop,

				'value': obj[prop]

			});

		}

	}

	arr.sort(function(a, b) { return b.value - a.value; });

	//arr.sort(function(a, b) { a.value.toLowerCase().localeCompare(b.value.toLowerCase()); }); //use this to sort as strings

	return arr; // returns array

}



const blankSlate = {

	inGame: false,

	timeLeft: 0,

	round: 0,

	questions: [],

	answers: [],

	correctAnswer: 0,

	userAnswers: {},

	scores: {},

	correct: 0,

}



var commandToKey = {

	[ "A" ]: 0,

	[ "B" ]: 1,

	[ "C" ]: 2,

	[ "D" ]: 3

}



console.log( commandToKey )



var channels = {};



function HandleLogic( chan, id, msg ){

	console.log( chan )

	var game = channels[ chan ];

	//console.log( channels[ chan ] );

	var command = msg.replace( ">", "" )



	if ( game.inGame ){

		console.log( commandToKey[ command.toUpperCase() ] )

		if ( commandToKey[ command.toUpperCase() ] || commandToKey[ command.toUpperCase() ] == 0 ){

			game.userAnswers[ id ] = commandToKey[ command.toUpperCase() ];

			console.log( "answer: " + command )

			channels[ chan ] = game;

		}

	} else if ( command == "trivia" ){

		game = CloneObject( blankSlate );

		request( "http://opentdb.com/api.php?amount=10", function( err, res, body ){

			if ( !err ){

				game.questions = JSON.parse( body ).results;

				//console.log( game.questions );

				game.inGame = true;

				channels[ chan ] = game;

				QuestionLogic( chan, game );

			}

		} )

	}

}



function QuestionLogic( chan, game ){

	if ( game.round + 1 > 10 ){

		var scores = "";

		

		var sorted = sortObject( game.scores )

		

		for ( var i in sorted ){

			if ( sorted[ i ].key != undefined ){

				scores += "\n<@" + sorted[ i ].key + ">: " + sorted[ i ].value;

			}

		}

		

		bot.sendMessage( {

			to: chan, 

			message: "Game over!\nScores:" + scores

		} )

		channels[ chan ] = CloneObject( blankSlate );

		return;

	}



	var question = game.questions[ game.round ];

	var answers;

	var messageID = "";

	

	if ( question.incorrect_answers ){

		answers = [ question.incorrect_answers[ 0 ], question.incorrect_answers[ 1 ], question.incorrect_answers[ 2 ], question.correct_answer ];

		game.answers = answers.shuffle();

	} else {

		game.answers = [ "false", "true" ]

	}

	

	game.timeLeft = 15;

	var str = "";



	if ( question.type == "boolean"){

		str = question.question + "\nA. " + game.answers[ 0 ] + "\nB. " + game.answers[ 1 ] + "\nTime remaining: " + ( game.timeLeft )

	} else {

		str = question.question + "\nA. " + game.answers[ 0 ] + "\nB. " + game.answers[ 1 ] + "\nC. " + game.answers[ 2 ] + "\nD. " + answers[ 3 ] + "\nTime remaining: " + ( game.timeLeft )

	}

	

	var messageID;

	

	bot.sendMessage( { 

		to: chan,

		message: str

	}, function( err, event ){

		if ( !err ){

			console.log( event );

			messageID = event.id;

		}

	} );



	channels[ chan ] = game;



	var timer = setInterval( function(){

		if ( game.timeLeft <= 0 ){

		   var peopleWhoGotItRight = ""

			

			for ( var i in channels[ chan ].userAnswers ){

				if ( game.answers[ channels[ chan ].userAnswers[ i ] ] == question.correct_answer || channels[ chan ].userAnswers[ i ] == question.correct_answer ){

					peopleWhoGotItRight += "\n<@" + i + ">";

					if ( game.scores[ i ] == undefined ){

						game.scores[ i ] = 0;

					}

					game.scores[ i ] += 1;

				}

			}

            

            RetryUntil( "Time up! The correct answer was: " + ( question.correct_answer == 0 && "false" || question.correct_answer == 1 && "true" || question.correct_answer ) + "\nHere's who got it right: " + peopleWhoGotItRight, chan, game, function( err, event ){

                setTimeout( function(){ // go to the naughty corner

                    game.round++

                    game.userAnswers = {};

                    QuestionLogic( chan, game );

                }, 5000 )

            } )

            

            clearInterval( timer );

		}

		

		var str = "";



		if ( question.type == "boolean"){

			str = question.question + "\nA. " + game.answers[ 0 ] + "\nB. " + game.answers[ 1 ] + "\nTime remaining: " + ( game.timeLeft )

		} else {

			str = question.question + "\nA. " + game.answers[ 0 ] + "\nB. " + game.answers[ 1 ] + "\nC. " + game.answers[ 2 ] + "\nD. " + answers[ 3 ] + "\nTime remaining: " + ( game.timeLeft )

		}

		

		bot.editMessage( {

			channel: chan,

			messageID: messageID,

			message: str

		} );



		game.timeLeft--;

	}, 1000 )

}



bot.on( "guildCreate", function( event ){

	var dontCreateChannel = false;

	console.log( event.d.channels )

	for ( var c in event.d.channels ){

		if ( event.d.channels[ c ].type == "text" && event.d.channels[ c ].name == "trivia" ){

			channels[ event.d.channels[ c ].id ] = CloneObject( blankSlate );

			console.log( event.d.channels[ c ] )

			dontCreateChannel = true;

		}

	}



	if ( !dontCreateChannel ){

		bot.createChannel( {

			server: event.d.id,

			type: "text",

			name: "trivia"

		}, function( err, res ){

			if ( !err ){

				channels[ res.id ] = CloneObject( blankSlate );

				console.log( res.id );

				bot.sendMessage( { 

					to: res.id,

					message: "TrivAndroid is here! Type >trivia in this channel to start a new game!"

				})

			}

		} );

	}

} );



bot.on( "message", function( user, id, chanid, msg ){

	if ( msg.substring( 0, 1 ) == ">" && channels[ chanid ] ){

		console.log( "message" )

		HandleLogic( chanid, id, msg );

	}

} );


