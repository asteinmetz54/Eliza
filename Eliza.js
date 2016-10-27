/****************************************************************************************
*  use this formula to get a random entry                                               *
*  console.log(this.entry['red'][Math.floor(Math.random() * this.entry['red'].length)]);*
*****************************************************************************************/

var fs = require('fs');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var logReport;

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
			var smrt = "I just got smarter";
			console.log(smrt);
			logReport = smrt + "\n";
        });
    };
	this.updateDictionary = function(JSONarray)
	{
		for(var i = 0; i < JSONarray.length; i++)
		{
			this.entry[JSONarray[i].key] = JSONarray[i].value;
			//decorate the objects
			this.entry[JSONarray[i].key].responseArray = [];
			this.entry[JSONarray[i].key].numberOfResponses = JSONarray[i].value.length;
		}
	};
}

//Timer object for Eliza to prompt users
var Timer = function(){
	this.start = function(inputTimer){
		inputTimer = setInterval(function(){
			var promptUser = chooseResponse('!noInput');
			promptUser = promptUser.replace("<name>", name);
			console.log(promptUser);
			logReport = promptUser + "\n";
		}, 20000);
	};
	this.stop = function(inputTimer)
	{
		clearTimeout(inputTimer);
	};
}

//so far we can get random responses to keywords
//we need to implement no repeating 
var parse = function(input)
{
	//strip punctuation
	input = input.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	//remove excess spaces
	input = input.replace(/\s{2,}/g," ");
	//split into an array of words
	words = input.split(" ");
	//iterate over words and search dictionary
	for(var i = 0; i < words.length; i++){
		if(dict.entry[words[i]]){
			return chooseResponse(words[i]);
			//return dict.entry[words[i]][Math.floor(Math.random() * dict.entry[words[i]].length)];
		}
	}
	return chooseResponse('!stumped');
}
var chooseResponse = function(key)
{
	var response = "";
	//find an unused response for this keyword
	do{
		index = Math.floor(Math.random() * dict.entry[key].length)
	}
	while(dict.entry[key].responseArray.includes(index));
	
	response = dict.entry[key][index];
	
	//add chosen response to the response array
	dict.entry[key].responseArray.push(index);
	//check if all responses used
	if(dict.entry[key].responseArray.length == dict.entry[key].numberOfResponses)
	{
		dict.entry[key].responseArray = [];
		dict.entry[key].responseArray.push(index);//handle a corner case
	}
	
	if(response.includes("<name>")){
		response = response.replace("<name>", name);
	}
	
	return response
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


//log input commands to string
rl.on('line', (input) => {
	logReport = input + "\n";
});

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
		logReport.concat = coffee + "\n";
    }, 180000);
    
	//enter the conversation loop
	converse(greeting);
});

var converse = function(elizaSays)//the main logic loop
{
	timer.start(promptTimer)
	rl.question(elizaSays + '\n', (answer) => {
		timer.stop(promptTimer);
		if(answer == 'quit'){
			console.log("quitting...");
			logReport.concat = "quitting...";	
			clearInterval(coffeeTimer);
			rl.close();
			process.exit();
		}
		else if(answer == 'maybe' && askedForCoffee == true){
			console.log("Okay, no cream...");
			logReport.concat = "Okay, no cream...\n";
			clearInterval(coffeeTimer);
			converse("Now, what were we talking about?");
		}
		else if(answer == 'log'){
			var logFileName = '<'+ name + '>_<'+ new Date().toTimeString() + '>.log';
			fs.writeFile(logFileName, logReport, (err) =>{
				if (err)
					console.log('Error writing log file' + logReport);
				else
					console.log('File successfully saved');
			})
		}
		else{
			askedForCoffee= false;
			elizaSays = parse(answer);
			converse(elizaSays)
		}
	});
}