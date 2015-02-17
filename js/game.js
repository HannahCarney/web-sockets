var myId=0;

var ball;

var player;
var farmer;
var cursors;
var timer;
var farmersList;
var explosions;
var playerScore;
var dead = false;
var ex_sound;


var ready = false;
var eurecaServer;
//this function will handle client communication with the server
var eurecaClientSetup = function() {
  //create an instance of eureca.io client
  var eurecaClient = new Eureca.Client();
  
  eurecaClient.ready(function (proxy) {   
    eurecaServer = proxy;
  }); 


eurecaClient.exports.setId = function(id) 
  {
    //create() is moved here to make sure nothing is created before uniq id assignation
    myId = id;
    create();
    eurecaServer.handshake();
    ready = true;
  } 
  
  eurecaClient.exports.kill = function(id)
  { 
    if (farmersList[id]) {
      farmersList[id].kill();
      console.log('killing ', id, farmersList[id]);
    }
  } 
  
  eurecaClient.exports.spawnFarmer = function(i, x, y)
  {
    
    if (i == myId) return; //this is me
    
    console.log('SPAWN');
    var frm = new Farmer(i, game, player)
    farmersList[i] = frm;
  }

    eurecaClient.exports.updateState = function(id, state)
  {
    if (farmersList[id])  {
      farmersList[id].cursor = state;
      farmersList[id].farmer.x = state.x;
      farmersList[id].farmer.y = state.y;
      farmersList[id].update();
    }
  }
}



Farmer = function (index, game, player) {


    this.cursor = {
    left:false,
    right:false,
    up:false,

   
  }

  this.input = {
    left:false,
    right:false,
    up:false,
 
  }

    var x = 0;
    var y = 0;


  this.game = game;
  this.player = player;
  
 

  this.alive = true;

  this.farmer = game.add.sprite(game.rnd.integerInRange(100, 770), game.rnd.integerInRange(0, 570), 'farmer');


  this.farmer.id = index;
  game.physics.enable(this.farmer, Phaser.Physics.ARCADE);
  this.farmer.body.immovable = false;
  this.farmer.body.collideWorldBounds = true;
  this.farmer.body.bounce.setTo(0, 0);
  this.farmer.scale.set(0.08, 0.08);
  this.farmer.anchor.set(0.5, 0.5);
  game.physics.enable(this.farmer, Phaser.Physics.ARCADE);
  this.farmer.body.collideWorldBounds = true;
  this.farmer.body.bounce.setTo(0.3);

};

Ball = function(game) {
  this.game = game;
  this.balls = game.add.group();
  this.balls.enableBody = true;  
  this.balls.physicsBodyType = Phaser.Physics.ARCADE;
  game.time.events.loop(5000, this.balls, this);
  this.balls = group.create(game.world.randomX, game.world.randomY, 'flyer', 1);
  
  game.physics.enable(this.balls, Phaser.Physics.ARCADE);

  this.balls.scale.setTo(0.01, 0.01);
  this.balls.body.collideWorldBounds = true;
  this.balls.body.bounce.set(1.01);
  this.balls.body.velocity.setTo(200,200);
}

 Farmer.prototype.kill = function() {
    this.alive = false;
    this.farmer.kill();
  }

 Farmer.prototype.update = function() {

  
  var inputChanged = (
    this.cursor.left != this.input.left ||
    this.cursor.right != this.input.right ||
    this.cursor.up != this.input.up ||
    this.cursor.down != this.input.down
  );
  
  
  if (inputChanged)
  {
    //Handle input change here
    //send new values to the server   
    if (this.farmer.id == myId)
    {
      
      // send latest valid state to the server
      this.input.x = this.farmer.x;
      this.input.y = this.farmer.y;

      eurecaServer.handleKeys(this.input);
    }
  }



  if (this.cursor.left) { this.farmer.body.velocity.x -= 8; }
  else if (this.cursor.right) { this.farmer.body.velocity.x += 8; } 
  else if (this.cursor.up) { this.farmer.body.velocity.y -= 8; }
  else if (this.cursor.down) { this.farmer.body.velocity.y += 8; }

};



// Initializing game =======================================================================
var game = new Phaser.Game(1000, 500, Phaser.AUTO, 'game-mainpage', { preload: preload, create: eurecaClientSetup, update: update, render: render });

function preload() {

  game.load.image('farmer', 'images/farmer.png');
  game.load.image('flyer', 'images/zombiepig.jpg');
  game.load.spritesheet('explosion', 'images/explosion.png', 64, 64, 23);
  game.load.audio('ex_sound', 'audio/explosion.mp3');

}


function create() {
  

game.physics.startSystem(Phaser.Physics.ARCADE);
game.stage.disableVisibilityChange  = true;

  group = game.add.group();
  group.enableBody = true;  
  group.physicsBodyType = Phaser.Physics.ARCADE;
  game.time.events.loop(5000, createBall, this);

  createBall();
  createPlayer();

  //Explosion

  explosion = game.add.group();

  for (var i = 0; i < 10; i++)
  {
      var explosionAnimation = explosion.create(0, 0, 'explosion', [0], false);
      explosionAnimation.anchor.setTo(0.5, 0.5);
      explosionAnimation.animations.add('explosion');
  }


  timer = game.time.create(true);
  timer.start()


  cursors = game.input.keyboard.createCursorKeys();


 

}

function update() {
  // working


  //do not update if client not ready
  if (!ready) return;

  // ball.rotation += ball.body.velocity.x/1000;
  player.input.left = cursors.left.isDown;
  player.input.right = cursors.right.isDown;
  player.input.up = cursors.up.isDown;
  player.input.down = cursors.down.isDown;

 
    for (var i in farmersList)
    {
    if (!farmersList[i]) continue;
    var curFarmer = farmersList[i].farmer;
    for (var j in farmersList)
    {
      if (!farmersList[j]) continue;
      if (j!=i) 
      {
      
        var targetFarmer = farmersList[j].farmer;
        
        game.physics.arcade.overlap(targetFarmer, null, this);
      
      }
      if (farmersList[j].alive)
      {
        farmersList[j].update();
      }     
    }
    }
}




function render() {

    game.debug.text('Elapsed seconds: ' + this.game.time.totalElapsedSeconds(), 32, 32);

}

// Game methods ============================================================================

function createPlayer() {

  farmersList = {};
  
  player = new Farmer(myId, game, farmer)
  farmersList[myId] = player;
  farmer = player.farmer
  farmer.x=0;
  farmer.y=0;

  timer = game.time.create(true);
  timer.start()

}

function audio() {

  ex_sound = game.add.audio('ex_sound');
  ex_sound.play();

}

function createBall() {

  ball = group.create(game.world.randomX, game.world.randomY, 'flyer', 1);
  
  game.physics.enable(ball, Phaser.Physics.ARCADE);

  ball.scale.setTo(0.01, 0.01);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1.01);
  ball.body.velocity.setTo(200,200);

}

function destroySprite() {

  character.kill();
  
  var score = timer;
  playerScore = ((score._now - score._started)/1000);
  getScore(playerScore);
  console.log(score);
  var explosionAnimation = explosion.getFirstExists(false);
  explosionAnimation.reset(player.x, player.y);
  explosionAnimation.play('explosion', 30, false, true);
  audio();

}

function getScore(playerScore) {

  deathLol(playerScore)

}

 function deathLol(playerScore) {
      var score = playerScore
      console.log(playerScore)
    
      if (dead = true && score != undefined) {
          $('#score').text(score);
        }
  } 

