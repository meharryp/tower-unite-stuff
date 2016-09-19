var cproc = require( "child_process" ),
	query = require( "game-server-query" ),
	fs = require( "fs" ),
	http = require( "http" ),
	ini = require( "ini" ),
	os = require( "os" ),
	discord = require( "discord.io" );

var follower = new discord( {
	token: "-discord api token-"
	autorun: true
} );

follower.on( "ready", function(){
	follower.acceptInvite( "0u5a7wPKJRUbCX5Z" );
} );

// Change this to the ID of your discord channel. Please, on behalf of everyone using a public discord channel, use a private one that you own.
const outChan = "161960672102580225";
const commandChan = "166608731310653440";
const adminChat = "166969603472359426";
const chat2 = "168297246683561984";

// You!
const owner = "94173951659343872"

// We're relying on quering working here, since 2 crash detection methods will end up with 2 of the same process running at random points.

var child;
var cmds = {};

const RANK_ROOT = 4;
const RANK_ADMIN = 3;
const RANK_MODERATOR = 2;
const RANK_MEMBER = 1;
const RANK_GUEST = 0;

var roleLookup = {}
roleLookup[ RANK_ROOT ] = "Owner"
roleLookup[ RANK_ADMIN ] = "Admin"
roleLookup[ RANK_MODERATOR ] ="Moderator"
roleLookup[ RANK_MEMBER ] = "Member"
roleLookup[ RANK_GUEST ] = "@everyone"

var users = {}
users[ owner ] = RANK_ROOT;

fs.stat( "users.json", function( err, stat ){
	if ( err || !stat.isFile() ){
		fs.writeFileSync( "users.json", JSON.stringify( users ) );
	} else {
		users = JSON.parse( fs.readFileSync( "users.json", "utf8" ) );
	}
} );

function ProcessMessage( dat ){
	console.log( dat.toString() );

	var toSend = dat.toString().split( "\n" );

	for ( var i in toSend ){
		if ( toSend[ i ].match( "(\\[Say\\]).+" ) ){
			var str = toSend[ i ].match( "(\\[Say\\]).+" )[ 0 ].substring( 6, toSend[ i ].match( "(\\[Say\\]).+" )[ 0 ].length );
			follower.sendMessage( {
				to: commandChan,
				message: str,
			} );
			var user = str.match( ".+(:)" )[ 0 ].replace( ":", "" );
			str = str.match( "(:).+" )[ 0 ].substring( 2, str.length )
			
			// Yeah sort of stumped here, name stealing is too big of an issue right now. Let's hope there's some way to distinguish between users in the future. For now we're sticking with just discord user IDs.
			// RANK_GUEST are the only permissions that should work on a server. Good job that's the default.
			console.log( str );
			var out = RunCommand( str.split( " " )[ 0 ], str.split( " " ), user, str.replace( str.split( " " )[ 0 ], "" ) ) // When steamid based things come out this might need changing so steamid detection can work.
			if ( out ){
				follower.sendMessage( { 
					to: commandChan,
					message: "[" + user + "] " + out
				} );
			}		
		} else if ( toSend[ i ].match( "(\\[PlayerJoin\\]).+" ) ) {
			var str = toSend[ i ].match( "(\\[PlayerJoin\\]).+" )[ 0 ].substring( 13, toSend[ i ].match( "(\\[PlayerJoin\\]).+" )[ 0 ].length );

			follower.sendMessage( {
				to: commandChan,
				message: "**" + str + "**",
			} );
		} else if ( toSend[ i ].match( "(\\[PlayerLeave\\]).+" ) ) {
			var str = toSend[ i ].match( "(\\[PlayerLeave\\]).+" )[ 0 ].substring( 14, toSend[ i ].match( "(\\[PlayerLeave\\]).+" )[ 0 ].length );

			follower.sendMessage( {
				to: commandChan,
				message: "**" + str + "**",
			} );
		} else if ( toSend[ i ].match( "(LogMedia" ) ){
			var dat = ini.parse( toSend[ i ] );

			follower.sendMessage( {
				to: commandChan,
				message: "**Video requested:** *" + dat.title + "*\n" + dat.url;
			} );
		}

		//follower.sendMessage( {
		//	to: outChan,
		//	message: toSend[ i ],
		//} );
	};
}
var spawn = function(){
	fs.chmodSync( "AdditionalSettings.ini", 0644 );

	var cfg = ini.parse( fs.readFileSync( "./AdditionalSettings.ini", "utf8" ) );
	var DefaultGame = ini.parse( fs.readFileSync( "/home/tu/server/Tower/Config/DefaultGame.ini", "utf8" ) );

	cfg[ "/Script/TowerNetworking" ].DedicatedServerOptions.ServerTitle = "[EU] [" + DefaultGame[ "/Script/EngineSettings" ].GeneralProjectSettings.ProjectVersion + "] Harry's Super Cool Server | Active Admins | tu.meharryp.xyz";

	fs.writeFileSync( "AdditionalSettings.ini", ini.encode( cfg ) );
	fs.chmodSync( "AdditionalSettings.ini", 0444 );

	child = cproc.spawn( "./TowerServer-Linux-Shipping", [ "-GAMEINI=AdditionalSettings.ini" ] );
	child.stdout.on( "data", ProcessMessage );
};

var players = 0;

follower.on( "ready", function(){
	spawn();
	console.log( "Loading server..." )

	setInterval( function(){
		query( {
			type: "garrysmod",
			host: "tu.meharryp.xyz",
			port: 7777,
			port_query: 27015
		}, function( state ){
			if ( !state.error ){
				players = state.raw.numplayers;
			} else {
				console.log( "Shit is broken, better shutdown!" );
				child.kill();
				process.kill();
			}
		} );
	}, 60000 );
} );

follower.on( "message", function( user, id, chanid, msg ){
	if ( ( chanid == commandChan || chanid == adminChat || chanid == chat2 ) && id != follower.id ){
		var out = RunCommand( msg.split( " " )[ 0 ], msg.split( " " ), id, msg.replace( msg.split( " " )[ 0 ], "" ) );
		if ( out ){
			follower.sendMessage( { 
				to: chanid,
				message: "<@" + id + "> " + out
			} );
		};
		if ( msg.match( "(<@).+.(>)" ) ){
			var mentions = {}
			var sUser = msg.match( "(<@).+.(>)" )[ 0 ].replace( "<@", "" ).replace( ">", "" );

			try {
				fs.statSync( __dirname + "/mentions/" + sUser + ".json", function( err, stat ){
					if ( !err && stat.isFile() ){
						mentions = JSON.parse( fs.readFileSync( __dirname + "/mentions/" + sUser + ".json", "utf8" ) );
					}
				} );
			} catch( e ) {
				console.log( "No messages." )
			}

			mentions[ msg ] = false;

			fs.writeFileSync( __dirname + "/mentions/" + sUser + ".json", JSON.stringify( mentions ) );
		}
	};
} );

function RunCommand( cmd, args, user, str ){
	var cData = cmds[ cmd ];
	//console.log( cData );
	if ( cData && user.GetRank() >= cData[ 0 ] && cmd.substring( 0, 1 ) == "!" ) {
		return cData[ 1 ]( args, user, str );
	} else if ( cData && user.GetRank() < cData[ 0 ] ) {
		return "You do not have the correct permissions to use this command!";
	} else if ( cmd.substring( 0, 1 ) == "!" ) {
		return "Command not found!";
	}
	return false;
};

function AddCommand( cmd, rank, func ){
	cmds[ "!" + cmd ] = [ rank, func ];
};

String.prototype.GetRank = function() {
	if ( users[ this ] ){
		return users[ this ];
	};
	return RANK_GUEST;
};

// AddCommand( cmd, rank, func )
// cmd: String, name of command
// Function: function to be ran when command is run.
//		Function takes 2 arguments:
// 		Arguments: Table, 0 is the command, everything else is arguments
//		User: UserID of user who ran the command

AddCommand( "restart", RANK_MODERATOR, function( args, user ){
	child.kill();
	process.exit();
	return "Restarting server...";
} );

AddCommand( "ping", RANK_GUEST, function( args, user ){
	return "Pong!";
} );

AddCommand( "fancyping", RANK_ADMIN, function( args, user ){
	return "***Pong!***"
} );

AddCommand( "admin", RANK_GUEST, function( args, user, str ){
	follower.sendMessage( {
		to: adminChat,
		message: "@everyone <@" + user + ">" + " has requested an admin: " + str
	} );

	return "A staff member has been requested."
} );

AddCommand( "help", RANK_GUEST, function( args, user ){
	var toSend = "";
	for ( var i in cmds ){
		if ( cmds[ i ][ 0 ] <= user.GetRank() ){
			toSend += i + "\n";
		}
	}

	follower.sendMessage( {
		to: user,
		message: "Here is a list of commands:\n" + toSend
	} );

	return "I have PM'ed you a list of commands.";
} );

AddCommand( "setrank", RANK_ROOT, function( args, user ) {
	var id = args[ 1 ].replace( "<@", "" ).replace( ">", "" ); // Change to regex
	var rank 

	try {
		rank = eval( args[ 2 ] );
	} catch( e ){
		return "Invalid rank!";
	}

	setTimeout( function(){
		users[ id ] = rank;
		fs.writeFileSync( "users.json", JSON.stringify( users ) );
	}, 500 );
	
	/*follower.addToRole( { 
		server: outChan,
		user: id,
		role: roleLookup[ rank ]
	} );*/

	return "set " + args[ 1 ] + " to rank " + args[ 2 ];
} );

AddCommand( "update", RANK_MODERATOR, function(){
	var updateSlave = cproc.spawn( "./update.sh" );
	updateSlave.stdout.on( "data", function( dat ){
		follower.sendMessage( {
			to: adminChat,
			message: dat.toString()
		} );
	} );

	updateSlave.on( "exit", function(){
		child.kill();
		process.exit();
	} );
	return "The server is now being updated."
} );

AddCommand( "stats", RANK_GUEST, function( args, user ){
	http.get( "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=394690&key=C54FEBD82F0A295E978A8401A66305FF&steamid=" + args[ 1 ], function( res ){
		var finalData = ""

		res.on( "data", function( dat ){
			finalData += dat;
			//console.log( "yolo" )
		} );

		res.on( "end", function(){
			var tab = JSON.parse( finalData );
			if ( tab.playerstats ){
				follower.sendMessage( { 
					to: commandChan,
					message: "Stats for " + args[ 1 ] + ":\nUnits: " + tab.playerstats.stats[ 2 ].value + "\nAmount of things used: " + tab.playerstats.stats[ 0 ].value
				} );
			};
		} );
	} );
} );

AddCommand( "mentions", RANK_GUEST, function( args, user ){
	var mentions = {}

	try {
		fs.statSync( __dirname + "/mentions/" + user + ".json", function( err, stat ){
			if ( !err && stat.isFile() ){
				mentions = JSON.parse( fs.readFileSync( __dirname + "/mentions/" + user + ".json", "utf8" ) );
			};
		} );
	} catch( e ){
		console.log( "No messages." )
	}

	var str = ""

	for ( var i in mentions ){
		console.log( i )
		if ( !mentions[ i ] ){
			mentions[ i ] = true;
			str += i + "\n";
		}
	}

	console.log( mentions );

	str += "If there is a mention missing here, it's proberbly an @ everyone."

	fs.writeFileSync( __dirname + "/mentions/" + user + ".json", JSON.stringify( mentions ) );

	return str;
} );

// Internal debug command that tricks the program into thinking someone on the server sent a message. You shouldn't need this unless you are testing text parsing.
AddCommand( "sampletext", RANK_ROOT, function( args, user, str ){
	ProcessMessage( "[2016.04.04-22.54.59:725][199]LogTemp:Display: [Say] meharryp | CSGฏ๎๎๎๎๎:" + str )
} );

AddCommand( "eval", RANK_ROOT, function( args, user, str ){
	var res;

	try {
		res = eval( str );
	} catch ( e ){
		res = e;
	}

	return res;
} );

AddCommand( "info", RANK_GUEST, function( args, user, str ){
	var load = os.loadavg()[ 1 ];
	var mem = ( os.totalmem() - os.freemem() ) / os.totalmem()

	return "\nPlayers: " + players + "\nLoad Average (5 minutes): " +load.toFixed( 2 ) + "\nMemory usage: " + ( mem * 100 ).toFixed( 1 ) + "%";
} );

// Webserver past this point. Delete for public release (optional module maybe?)
// Not using apache because that shit is exploitable and slow as fuck

var express = require( "express" );

function LoadWebserver(){
	app = express();

	app.get( "/", function( req, res ){
		res.end( fs.readFileSync( "index.html", "utf8" ) );
	} );

	app.listen( 3000, function(){
		console.log( "Webserver is listening." );
	} );
}

try {
	LoadWebserver();
} catch ( e ) {
	console.log( "Couldn't load webserver, trying again in 60 seconds..." );
	setTimeout( LoadWebserver, 60000 );
}

process.on( "uncaughtException", function( err ){
	fs.writeFileSync( "error" + Date.now(), err );
	console.log( err );
	console.log( "Attempting to recover..." );

	if ( !bot.connected ){
		bot.connect();
	} else {
		process.exit();
	}
} )
