// http://steamcommunity.com/profiles/76561198071482825

var express = require( "express" ),
	fs = require( "fs" ),
	request = require( "request" ),
	xml = require( "xml2js" ),
	app = express.Router();

var RawItems = JSON.parse( fs.readFileSync( __dirname + "/manifest.json", "utf8" ) );
var ItemData = {}
var PlayerCache = {}
var VanityUrls = {}

const apikey = "-steam api key-"

try {
	PlayerCache = JSON.parse( fs.readFileSync( "playercache.json", "utf8" ) );
} catch ( e ){
	console.log( "No playercache, not loading it..." );
}

/*try { 
	VanityUrls = JSON.parse( fs.readFileSync( "vanityurls.json", "utf8" ) );
} catch ( e ){
	console.log( "No vanity url cache, not loading it..." );
}*/

for ( var i in RawItems ){
	ItemData[ RawItems[ i ].itemName ] = RawItems[ i ];
	console.log( ItemData[ RawItems[ i ].itemName ].cost );
}

function GetItemInfo( item ){
	return ItemData[ item ];
}

function SavePlayerCache(){
	// Disabled, AJAX is way better than this.
	// fs.writeFile( "playercache.json", JSON.stringify( PlayerCache ) );
	// fs.writeFile( "vanityurls.json", JSON.stringify( VanityUrls ) );
}

function GetPlayerUnits( id, res, isVanityURL ){
	request( "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=394690&key=" + apikey + "&steamid=" + id, function( err, ares, body ){
		//console.log( JSON.parse( body ) );
		if ( !err && body ){
			try {
				var dat = JSON.parse( body );
				console.log( dat )
				var cont = true
				if ( dat.playerstats ){
					if ( dat.playerstats.stats ){
						for ( var i in dat.playerstats.stats ){
							if ( dat.playerstats.stats[ i ].name == "stat_units" && cont ){
								GetPlayerInventory( id, res, dat.playerstats.stats[ i ].value, false );
								cont = false;
							}
						}
						if ( cont ){
							GetPlayerInventory( id, res, 0, false );
						}
					}
				} else if ( !isVanityURL ) {
					GetSteamID( id, res, GetPlayerUnits );
				} else {
					res.send( { "error": "Player does not own Tower Unite!" } );
				}
			} catch ( e ){
				console.log( e );
				res.send( { "error": "Couldn't load data for player." } );
			}
		}
	} );
}

function GetPlayerInventory( id, res, units, isVanityURL ){
	console.log( "http://steamcommunity.com/id/" + id + "/inventory/json/394690/2" )
	request( { url: "http://steamcommunity.com/id/" + id + "/inventory/json/394690/2", method: "GET" }, function( err, ares, body ){
		if ( !err && body ){
			try {
				var raw = JSON.parse( body );
				var tItemData = {};
				var items = {};
				var unitValue = 0;
				
				for ( var i in raw.rgDescriptions ){
					tItemData[ raw.rgDescriptions[ i ].classid ] = raw.rgDescriptions[ i ];
				}

				for ( var i in raw.rgInventory ){
					items[ i ] = tItemData[ raw.rgInventory[ i ].classid ];
					for ( k in ItemData[ items[ i ].name ] ){
						if ( k == "cost" ){
							unitValue += ItemData[ items[ i ].name ].cost;
						}
					}
				}

				setTimeout( function(){
					//console.log( items )
					if ( res ){
						res.send( { items: items, units: units, itemValue: unitValue } );
					}
				}, 500 );
			} catch ( e ) {
				console.error( e );
				GetVanityURL( id, res, units, GetPlayerInventory );
				return;
			}
		}
	} );
}

function GetVanityURL( url, res, units, cb ){
	request( "http://steamcommunity.com/profiles/" + url + "/?xml=1", function( err, ares, body ){
		if ( !err && body ){
			console.log( "Getting vaniy url for " + url );
			xml.parseString( body, function( err, result ){
				if ( !err ){
					if ( result.response ){
						if ( result.response.error ){
							console.log( result.response.error )
							res.send( { "error": result.response.error } );
							return;
						}
					}
					cb( result.profile.customURL, res, units, true );
				} else {
					res.send( { "error": "No vanity URL found for this ID." } )
				}
			} )
		}
	} )
}

function GetSteamID( url, res, cb ){
	request( "http://steamcommunity.com/id/" + url + "/?xml=1", function( err, ares, body ){
		if ( !err && body ){
			console.log( "Getting steam64 for " + url );
			xml.parseString( body, function( err, result ){
				if ( !err ){
					if ( result.response ){
						if ( result.response.error ){
							console.log( result.response.error )
							res.send( { "error": result.response.error } );
							return;
						}
					}
					cb( result.profile.steamID64, res, true );
				} else {
					res.send( { "error": "No ID found for this vanity URL" } )
				}
			} )
		}
	} )
}


function PlayerHasCache( id ){
	return ( PlayerCache[ id ] );
}

app.get( "/profile/:id", function( req, res ){
	/*var id = req.params.id;

	console.log( id );
	console.log( VanityUrls );

	// Caching allows us to instantly serve data to players who request it. Using this method they'll have a slightly out of date version the first time they visit the page, but on refresh they'll get the most recent picture.
	if ( PlayerHasCache( id ) ){
		res.send( PlayerCache[ id ] );
		CachePlayerInventory( id );
	} else if ( PlayerHasCache( VanityUrls[ id ] ) ) {
		res.send( PlayerCache[ VanityUrls[ id ] ] );
		CachePlayerInventory( VanityUrls[ id ] );
	} else {
		CachePlayerInventory( id );
		res.send( "This player has no data right now, check back in a few seconds." );
	}*/

	res.send( fs.readFileSync( __dirname + "/inventory.html", "utf8" ).replace( "var id = \"\"", "var id = \"" + req.params.id + "\"" ) );
} )

app.get( "/data/:id", function( req, res ){ // AJAX url, returns most recent data. Disable saving?
	GetPlayerUnits( req.params.id, res )
} )

app.get( "/", function( req, res ){
	res.send( fs.readFileSync( __dirname + "/index.html", "utf8" ) );
} );

/*app.listen( 3000, function(){
	console.log( "Loaded!" );
} )*/

module.exports = app;
