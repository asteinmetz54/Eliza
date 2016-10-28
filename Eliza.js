/****************************************************************************************
*  use this formula to get a random entry                                               *
*  console.log(this.entry['red'][Math.floor(Math.random() * this.entry['red'].length)]);*
*****************************************************************************************/

var fs = require('fs');
var events = require('events');
var logReport='';
fs.watch("dictionaries/", function(e, fn){
	if(e == 'rename'){
		console.log("event type: " + e + "  file name:" + fn);
		dict.emit('fileChange', fn);
	}
	
});

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  console.log('something was typed');
});

var log = [];

//Dictionary object for loading, updating and accessing Eliza's knowledge.
var Dictionary = function(){
    this.ownedFilenames = [];
    this.entry = {};
	events.EventEmitter.call(this);
    
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
			var smrt = "I just got smarter\n";
			console.log(smrt);
			logReport += smrt;
			converse("Now, what were we talking about?");//gets us back in the event loop		
        });
    };
	this.updateDictionary = function(JSONarray)
	{
		for(var i = 0; i < JSONarray.length; i++)
		{
			//now we can link similar keys to the same response.
			//i.e. read vs reading, talk vs talking.
			if(this.entry[JSONarray[i].key] == undefined){
				multiKeyFix = [];
			 if(typeof(JSONarray[i].key) == 'string')
				 multiKeyFix.push(JSONarray[i].key)
			 else
				 multiKeyFix = JSONarray[i].key;
			 for(var j = 0; j < multiKeyFix.length; j++)
			 {
				this.entry[multiKeyFix[j]] = JSONarray[i].value;
				//decorate the objects
				this.entry[multiKeyFix[j]].responseArray = [];
				this.entry[multiKeyFix[j]].numberOfResponses = JSONarray[i].value.length;
			 }
			multiKeyFix = [];
			}
		}
	};
}
//make that custom emitter
Dictionary.prototype.__proto__ = require('events').EventEmitter.prototype;
//so far we can get random responses to keywords
//we need to implement no repeating 
var parse = function(input)
{
	//strip punctuation
	input = input.replace(/[.,\/#!$?%\^&\*;:{}=\-_`~()]/g,"");
	//remove excess spaces
	input = input.replace(/\s{2,}/g," ");
	//split into an array of words
	words = input.split(" ");
	//iterate over words and search dictionary
	for(var i = 0; i < words.length; i++){
		if(dict.entry[words[i]]){
			return chooseResponse(words[i]);
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
dict.on('fileChange', function(fn){
	dict.append(fn);
});
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
	logReport += 'I\'m Eliza. What is your name?';
	logReport += '\r\n';
  name = answer;
  
  //generate greeting / first question.
  greeting = chooseResponse('opener');//dict.entry['opener'][Math.floor(Math.random() * dict.entry['opener'].length)];
  greeting = greeting.replace("<name>", name);
    
	//start coffee interval timer
	coffeeTimer = setInterval(function(){
		askedForCoffee = true;
		coffee = chooseResponse('coffee');//dict.entry['coffee'][Math.floor(Math.random()*dict.entry['coffee'].length)];
		coffee = coffee.replace("<name>", name);
		console.log(coffee);
		logReport += coffee;
		logReport += '\r\n';
    }, 180000);
    
	//enter the conversation loop
	converse(greeting);
	
});

var converse = function(elizaSays)//the main logic loop
{
	logReport += elizaSays;
	logReport += '\r\n';
	promptTimer = setTimeout(function(){
			var promptUser = chooseResponse('!noInput');
			promptUser = promptUser.replace("<name>", name);
			console.log(promptUser);
			logReport += promptUser;
			logReport += '\r\n';
		}, 20000);
		
	rl.question(elizaSays + '\n', (answer) => {
		clearTimeout(promptTimer);
		logReport += answer;
		logReport += '\r\n';
		if(answer == 'quit'){
			console.log("quitting...");
			logReport += "quitting...";	
			clearInterval(coffeeTimer);
			rl.close();
			process.exit();
		}
		else if(answer == 'maybe' && askedForCoffee == true){
			clearInterval(coffeeTimer);
			logReport += "Now, what were we talking about?";
			logReport += '\r\n';
			converse("Now, what were we talking about?");
		}
		else if(answer == 'log'){
			var getDate = new Date();
			var date = getDate.toString();
			date = date.replace(/:/g,'_');
			console.log(date);
			var logFileName = name + '_' + date + '.log';
			fs.appendFile(logFileName, logReport, (err) =>{
				if (err)
					console.log('Error writing log file');
				else
					console.log('File successfully saved');
			});
			converse("Now, what were we talking about?");
		}
		else{
			askedForCoffee= false;
			elizaSays = parse(answer);
			converse(elizaSays)
		}
	});
}