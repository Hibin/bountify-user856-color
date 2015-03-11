#!/usr/bin/env nodejs

var read            = require( 'fs-readdir-recursive' )
    , fs            = require( 'fs' )
    , minimatch     = require( 'minimatch' )
    , cheerio       = require( 'cheerio' )
    , ColorThief    = require( 'color-thief' )
    , $colorThief   = new ColorThief()
    , http          = require( 'http' );

var $targetPath = process.argv[2];

var isHtml = function( $fileName ) {
    return minimatch( $fileName, '*.html' );
};

var toHex = function( $red, $green, $blue ) {
    return ( ( $blue | $green << 8 | $red << 16 ) | 1 << 24 ).toString( 16 ).slice( 1 );
};

var download = function( $url, $dest, $callback ) {
    var $file    = fs.createWriteStream( $dest );
    var $request = http.get( $url, function( $response ) {
        $response.pipe( $file );

        $file.on(
            'finish'
            , function() {
                $file.close( $callback );
            }
        );

        $file.on(
            'error'
            , function( $err ) {
                fs.unlink( $dest );

                if( $callback )
                    $callback( $err.message );
            }
        );
    });
};

var $files = read( $targetPath );

$files.forEach( function( $file ) {
    var $fileName = $targetPath + '/' + $file;

    fs.readFile( $fileName, function( $err, $data ) {
        if( $err ) throw $err;

        console.log('Processing file... ' + $fileName);

        $ = cheerio.load( $data );

        var $imgSrc    = $( 'div#productImage' ).text();
        var $imgTarget = './image-' + process.pid + '.jpg';

        //fs.unlinkSync( $imgTarget );

        download( $imgSrc, $imgTarget, function() {
            $imgSrc = $imgTarget;

            fs.exists( $imgSrc, function( $exists ) {
                if( $exists ) {
                    var $color = $colorThief.getColor( $imgSrc );
                        $color = toHex( $color[0], $color[1], $color[2] );
    
                    fs.appendFile( $fileName, "\n" + '<div id="primary_color">#' + $color + '</div>', function( $err ) {
                      if( $err ) throw $err;
    
                      console.log( $imgSrc + ' : ' + $color );
                    });
                }
            });
        } );
    });
} );
