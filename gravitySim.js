var gravitySim = new function() {

	// Check whether the device is mobile
	var isMobile = !!navigator.userAgent.toLowerCase()
		.match( /ipod|ipad|iphone|android/gi );

	// Global settings for world height, maximum velocity allowed, and maximum number of balls allowed
	const HEIGHT = 100;
	const VELOCITYMAX = 3000;
	const BALLMAX = 10;

	// Object to track the user constants set by the user and ranges allowed
	var settings = {
		size: {
			val: 0,
			min: 1,
			max: 300
		},
		elasticity: {
			val: 0,
			min: 0,
			max: 1
		},
		mass: {
			val: 0,
			min: 1,
			max: 300
		},
		gravity: {
			val: 0,
			min: 0,
			max: 1000
		},
		drag: {
			val: 0,
			min: 0,
			max: 100
		},
		color: {
			val: '',
		}
	}

	//Dimensions of the world
	var world = {
		width: window.innerWidth,
		height: window.innerHeight
	}

	// Declare variables used
	var canvas;
	var context;
	var startButton;
	var panels;
	var message;
	var title;
	var settings;
	var frameTime;
	var lastTime;
	var resetBalls;
	var resetGame;
	var balls = [];
	var environmentList;
	var playing = false;

	// Declar mouse variables
	var mouseX = window.innerWidth;
	var mouseY = window.innerHeight;
	var mouseIsDown = false;

	// Function called when the game begins
	this.init = function() {

		// Get the element IDs for the various elements
		canvas = document.getElementById( 'background' );
		startButton = document.getElementById( 'startButton' );
		panels = document.getElementById( 'panels' );
		message = document.getElementById( 'message' );
		title = document.getElementById( 'title' );
		settingsDiv = document.getElementById( 'settings' );
		resetBalls = document.getElementById( 'reset-balls' );
		resetGame = document.getElementById( 'reset-game' );

		// Set the values for the pre-defined environments
		environmentList = {
			Moon: {
				drag: '0',
				gravity: '18',
				link: 'Images/Moon.jpg'
			},
			Earth: {
				drag: '5',
				gravity: '100',
				link: 'Images/Earth.jpg'
			},
			Jupiter: {
				drag: '30',
				gravity: '240',
				link: 'Images/Jupiter.jpg'
			},
			Ocean: {
				drag: '80',
				gravity: '100',
				link: 'Images/Ocean.jpg'
			},
			Space: {
				drag: '0',
				gravity: '0',
				link: 'Images/Space.jpg'
			}
		}

		if ( canvas && canvas.getContext ) {
			// Get information needed to draw on the canvas
			context = canvas.getContext( '2d' );

			// Set up the events to listen for and the function to call
			document.addEventListener( 'mousemove', documentMouseMoveHandler, false ); // Any mouse movement
			document.addEventListener( 'mousedown', documentMouseDownHandler, false ); // Left-click pressed
			document.addEventListener( 'mouseup', documentMouseUpHandler, false ); // Left-click released
			canvas.addEventListener( 'touchstart', documentTouchStartHandler, false ); // Touchscreen pressed
			document.addEventListener( 'touchmove', documentTouchMoveHandler, false ); // Touchscreen moved after pressing
			document.addEventListener( 'touchend', documentTouchEndHandler, false ); // Touchscreen released
			window.addEventListener( 'resize', windowResizeHandler, false ); // Window resized
			startButton.addEventListener( 'click', startButtonClickHandler, false ); // Start button pressed
			resetBalls.addEventListener( 'click', resetBallsClickHandler, false ); // Reset balls button pressed
			resetGame.addEventListener( 'click', resetGameClickHandler, false ); // Reset game button pressed

			// Run the window resize function just to make sure the window is correct
			windowResizeHandler();

			// Run the animation function
			animate();
		}
	}

	// Function to retrieve the user inputs
	function getSettings() {
		settings.size.val = $( '#ball-size' ).val();
		settings.elasticity.val = $( '#elasticity' ).val() / 100; // divide by 100 here to make value between 0 and 1 for later calculatioins
		settings.mass.val = $( '#mass' ).val();
		settings.gravity.val = $( '#gravity' ).val();
		settings.drag.val = $( '#drag' ).val();
		settings.color.val = $( '#color' ).val();

		//Function to make sure user inputs aren't outside the min and max if there is a min and max set
		for ( var set in settings ) {
			if ( settings[ set ].hasOwnProperty( 'min' ) ) {
				settings[ set ].val = ( settings[ set ].val > settings[ set ].max ) ? settings[ set ].max : ( settings[ set ].val < settings[ set ].min ) ? settings[ set ].min : settings[ set ].val;
			}
		}
	}

	// Function for handling collisions between two balls
	function collision( p, q ) {

		// Calculate the collision angle between the two balls
		var theta_collision = Math.atan2( ( p.position.y - q.position.y ), ( p.position.x - q.position.x ) );

		// Change the position of the ball two the collision point so the balls don't occupy the same space
		p.position.x = q.position.x + Math.cos( theta_collision ) * ( p.size / 2 + q.size / 2 );
		p.position.y = q.position.y + Math.sin( theta_collision ) * ( p.size / 2 + q.size / 2 );

		// Calculate the current magnitudes of the velocities
		var p_Velocity = Math.sqrt( Math.pow( p.velocity.x, 2 ) + Math.pow( p.velocity.y, 2 ) );
		var q_Velocity = Math.sqrt( Math.pow( q.velocity.x, 2 ) + Math.pow( q.velocity.y, 2 ) );

		// Calculate the current angles of motion
		var p_Angle = Math.atan2( p.velocity.y, p.velocity.x );
		var q_Angle = Math.atan2( q.velocity.y, q.velocity.x );

		// Calculate the new magnitudes of the velocities
		var p_New_Velocity_y = p_Velocity * Math.sin( p_Angle - theta_collision );
		var q_New_Velocity_y = q_Velocity * Math.sin( q_Angle - theta_collision );
		var p_New_Velocity_x = ( ( p.mass - q.mass * p.elasticity ) * p_Velocity * Math.cos( p_Angle - theta_collision ) + ( q.mass * p.elasticity + q.mass ) * q_Velocity * Math.cos( q_Angle - theta_collision ) ) / ( p.mass + q.mass );
		var q_New_Velocity_x = ( ( p.mass + p.mass * q.elasticity ) * p_Velocity * Math.cos( p_Angle - theta_collision ) + ( q.mass - p.mass * q.elasticity ) * q_Velocity * Math.cos( q_Angle - theta_collision ) ) / ( p.mass + q.mass );

		// Calculate the new x and y velocities for both balls
		p.velocity.x = ( Math.cos( theta_collision ) * p_New_Velocity_x + Math.cos( theta_collision + Math.PI / 2 ) * p_New_Velocity_y );
		p.velocity.y = ( Math.sin( theta_collision ) * p_New_Velocity_x + Math.sin( theta_collision + Math.PI / 2 ) * p_New_Velocity_y );
		q.velocity.x = ( Math.cos( theta_collision ) * q_New_Velocity_x + Math.cos( theta_collision + Math.PI / 2 ) * q_New_Velocity_y );
		q.velocity.y = ( Math.sin( theta_collision ) * q_New_Velocity_x + Math.sin( theta_collision + Math.PI / 2 ) * q_New_Velocity_y );
	}

	// Function for when the start button is clicked
	function startButtonClickHandler( event ) {

		// Only take affect if the game isn't currently being played
		if ( playing === false ) {
			playing = true;

			// Set the pre-configured environment based on the user input
			setEnvironment( $( "#sel1" ).val() );

			// Reset the balls array
			balls = [];

			// Remove the intro screen
			panels.style.display = 'none';
		}
	}

	// Function for when the reset balls button is clicked
	function resetBallsClickHandler( event ) {

		// If the game is being played, reset the balls array
		if ( playing === true ) {
			balls = [];
		}
	}

	// Function for when the reset game button is clicked
	function resetGameClickHandler( event ) {

		// If the game is being played, stop the game, reset the balls array, and display the intro screen
		if ( playing === true ) {
			playing = false;
			balls = [];
			panels.style.display = 'inline-block';
		}
	}

	// Function for when the mouse is moved
	function documentMouseMoveHandler( event ) {

		// Log the mouse x and y positions
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	// Function for when the left-click is released
	function documentMouseUpHandler( event ) {
		mouseIsDown = false;
	}

	// Function for when the left-click is pressed
	function documentMouseDownHandler( event ) {
		mouseIsDown = true;

		// If the game is being played and the mouse isn't on the settings bar
		if ( playing && mouseY > settingsDiv.offsetHeight ) {
			var ballClicked = false;

			// Compare the current position to the position of all balls to see if a ball was clicked
			for ( let i = 0, n = balls.length; i < n; i++ ) {
				let p = balls[ i ];
				if ( Math.sqrt( Math.pow( p.position.y - mouseY, 2 ) + Math.pow( p.position.x - mouseX, 2 ) ) <= ( p.size / 2 ) ) {
					ballClicked = true;
					p.clicked = true;
				}

				// If a ball wasn't clicked, create a new balls
			}
			if ( !ballClicked ) {
				balls.push( new Ball() );
			}

			// If there are too many balls, delete the oldest ball
			if ( balls.length > BALLMAX ) {
				balls.shift();
			}
		}
	}

	// Function for when a touchscreen is pressed
	function documentTouchStartHandler( event ) {
		if ( event.touches.lenght == 1 ) {
			event.preventDefault();
			mouseX = event.touches[ 0 ].pageX;
			mouseY = event.touches[ 0 ].pageY;
		}
	}

	// Function for when a touchscreen is moved
	function documentTouchMoveHandler( event ) {
		if ( event.touches.length == 1 ) {
			event.preventDefault();

			mouseX = event.touches[ 0 ].pageX;
			mouseY = event.touches[ 0 ].pageY;
		}
	}

	// Function for when a touchscreen is released
	function documentTouchEndHandler( event ) {}

	// Function for when the window is resized
	function windowResizeHandler() {

		// Adjust the dimensions of the world and canvas
		world.width = window.innerWidth;
		world.height = window.innerHeight;
		canvas.width = world.width;
		canvas.height = world.height;
	}

	// Function to actually creat the animation
	function animate() {

		// Run the function to get the user settings
		getSettings();

		// Log the time of the current frame and the previous frame
		lastTime = frameTime;
		frameTime = new Date().getTime();

		context.clearRect( 0, 0, canvas.width, canvas.height );

		// Iterate through all balls to adjust their values and draw them
		for ( i = 0, n = balls.length; i < n; i++ ) {
			p = balls[ i ];

			// Log the previous velocities and positions
			p.velocityLast.y = p.velocity.y;
			p.velocityLast.x = p.velocity.x;
			p.positionLast.y = p.position.y;
			p.positionLast.x = p.position.x;

			// If the mouse was released, the current ball isn't being dragged by the mouse
			if ( !mouseIsDown ) {
				p.clicked = false;
			}

			// If the ball is being dragged by the mouse, make its position the position of the mouse and its velocity the velocity of the mouse
			if ( p.clicked ) {
				p.position.y = mouseY;
				p.position.x = mouseX;
				p.velocity.y = ( p.position.y - p.positionLast.y ) / ( ( frameTime - lastTime ) / 1000 );
				p.velocity.x = ( p.position.x - p.positionLast.x ) / ( ( frameTime - lastTime ) / 1000 );

				// If the ball is not being dragged by the mouse
			} else {

				//  Change the velocities if they are outside the allowed range
				p.velocity.y = ( Math.abs( p.velocity.y ) > VELOCITYMAX ) ? VELOCITYMAX * Math.sign( p.velocity.y ) : p.velocity.y;
				p.velocity.x = ( Math.abs( p.velocity.x ) > VELOCITYMAX ) ? VELOCITYMAX * Math.sign( p.velocity.x ) : p.velocity.x;

				//  Calculate the new positions based on the velocities
				p.position.x += p.velocity.x * ( frameTime - lastTime ) / 1000;
				p.position.y += p.velocity.y * ( frameTime - lastTime ) / 1000;

				// If the ball has collided with a window border, bounce it back
				if ( p.position.y >= world.height - p.size / 2 ) {
					p.position.y = world.height - p.size / 2;
					p.velocity.y *= -1 * p.elasticity;
				}
				if ( p.position.y <= 0 + p.size / 2 ) {
					p.position.y = 0 + p.size / 2;
					p.velocity.y *= -1 * p.elasticity;
				}
				if ( p.position.x >= world.width - p.size / 2 ) {
					p.position.x = world.width - p.size / 2;
					p.velocity.x *= -1 * p.elasticity;
				}
				if ( p.position.x <= 0 + p.size / 2 ) {
					p.position.x = 0 + p.size / 2;
					p.velocity.x *= -1 * p.elasticity;
				}

				// Iterate through all other balls to check if there is a collision
				for ( var j = 0; j < balls.length; j++ ) {
					q = balls[ j ];

					// If the ball is not being compared to itself and the balls have collided, run the collision function
					if ( j !== i && Math.sqrt( Math.pow( p.position.y - q.position.y, 2 ) + Math.pow( p.position.x - q.position.x, 2 ) ) <= ( p.size / 2 + q.size / 2 ) ) {
						collision( p, q );
					}
				}

				// Calculate the new velocities based on the gravity and drag settings
				p.velocity.y += ( settings.gravity.val - settings.drag.val * p.velocity.y / 100 ) * ( world.height / HEIGHT ) * ( frameTime - lastTime ) / 1000;
				p.velocity.x -= ( settings.drag.val * p.velocity.x / 100 ) * ( world.height / HEIGHT ) * ( frameTime - lastTime ) / 1000;
			}

			// Draw the ball
			context.fillStyle = p.color;
			context.strokeStyle = 'black';
			context.lineWidth = 2;
			context.beginPath();
			context.arc( p.position.x, p.position.y, p.size / 2, 0, Math.PI * 2, true );
			context.fill();
			context.stroke();
		}
		requestAnimFrame( animate );
	}

	// Function that creates a new ball object
	function Ball() {
		this.position = {
			x: mouseX,
			y: mouseY
		}
		this.positionLast = {
			x: 0,
			y: 0
		}
		this.velocity = {
			x: 0,
			y: 0
		}
		this.velocityLast = {
			x: 0,
			y: 0
		}
		this.size = settings.size.val;
		this.elasticity = settings.elasticity.val;
		this.mass = settings.mass.val;
		this.clicked = true;
		this.color = settings.color.val;
	}

	// Function for settinig the pre-configured environments
	function setEnvironment( environment ) {
		let env = environment;
		if ( env !== 'Default' ) {

			// Set the background to a picture
			$( 'body' ).css( {
				'background-image': 'url(' + environmentList[ env ].link + ')',
				'height': '100%',
				'background-position': 'center',
				'background-repeat': 'no-repeat',
				'background-size': 'cover'
			} );

			// Set the gravity and drag
			$( '#gravity' ).attr( {
				'value': environmentList[ env ].gravity
			} );
			$( '#drag' ).attr( {
				'value': environmentList[ env ].drag
			} );
			gravitySetting = environmentList[ env ].Gravity;
			dragSetting = environmentList[ env ].drag;
		}
	}
}




// shim with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function( /* function */ callback, /* DOMElement */ element ) {
			window.setTimeout( callback, 1000 / 60 );
		};
} )();

// Run the initialize function
gravitySim.init();
