/****************************************************************************************
*  use this formula to get a random entry                                               *
*  console.log(this.entry['red'][Math.floor(Math.random() * this.entry['red'].length)]);*
*****************************************************************************************/

var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
//Define events
//eventEmiter.on('getInput');
//end Define events

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//Dictionary object for loading, updating and accessing Eliza's knowledge.
var Dictionary = function(){
    this.ownedFilenames = [];
    this.entry = {};
    
    this.load = function(filesList)
    {
		var temp = [];
        for(var i = 0; i < filesList.length; i++)
        {
            var JSONarray = JSON.parse(fs.readFileSync("dictionaries/" + filesList[i]));
            temp = temp.concat(JSONarray);
            this.ownedFilenames.push(filesList[i]);
        }
		this.updateDictionary(temp);
    };
    this.append = function(fileName)
    {
        var JSONarray;
        fs.readFile("dictionaries/" + fileName, function(err, data)
        {
			var temp = [];
            JSONarray = JSON.parse(data);
            temp = temp.concat(JSONarray);
            dict.ownedFilenames.push(fileName);
			dict.updateDictionary(temp);
			console.log("I just got smarter!");
        });
    };
	this.updateDictionary = function(JSONarray)
	{
		for(var i = 0; i < JSONarray.length; i++)
		{
			this.entry[JSONarray[i].key] = JSONarray[i].value;
		}
	};
}

//Timer object for Eliza to prompt users
var Timer = function(){
	this.start = function(inputTimer){
		inputTimer = setTimeout(function(){
		var promptUser = dict.entry['noInput'][Math.floor(Math.random()*dict.entry['noInput'].length)];
		promptUser = promptUser.replace("<name>", name);
		console.log(promptUser)
		}, 20000);
	};
	this.stop = function(inputTimer)
	{
		clearTimeout(inputTimer);
	};
}

var parse = function(userInputString)
{
	return "placeholder Eliza response";
}
//Start Eliza

//initialize variables
dict = new Dictionary();
timer = new Timer();
var quit = false;
var name = "";
var coffee = "";
var coffeeTimer;
var promptTimer;
var askedForCoffee = false;

//synchronous load of dictionary
dict.load(fs.readdirSync('dictionaries'));

//prompt for name
rl.question('I\'m Eliza. What is your name?\n', (answer) => {
  name = answer;
  
  //generate greeting / first question.
  greeting = dict.entry['opener'][Math.floor(Math.random() * dict.entry['opener'].length)];
  greeting = greeting.replace("<name>", name);
    
	//start coffee interval timer
	coffeeTimer = setInterval(function(){
		askedForCoffee = true;
		coffee = dict.entry['coffee'][Math.floor(Math.random()*dict.entry['coffee'].length)];
		coffee = coffee.replace("<name>", name);
		console.log(coffee);
    }, 180000);
    
	//enter the conversation loop
	converse(greeting);
});

var converse = function(elizaSays)//the main logic loop
{
	//timer.start(promptTimer)
	rl.question(elizaSays + '\n', (answer) => {
		timer.stop(promptTimer);
		if(answer == 'quit'){
			console.log("quitting...");
			clearInterval(coffeeTimer);
			rl.close();
		}
		else if(answer == 'maybe' && askedForCoffee == true){
			console.log("Okay, no cream...");
			clearInterval(coffeeTimer);
			converse("Now, what were we talking about?");
		}
		else{
			askedForCoffee= false;
			elizaSays = parse(answer);
			converse(elizaSays)
		}
	});
}