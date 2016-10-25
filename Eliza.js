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
var Dictionary = function()
{
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

//Start Eliza

//create our dictionary
dict = new Dictionary();
var quit = false;
var name = "";

//setup, don't care about async
//get all file names in dir dictionaries
dict.load(fs.readdirSync('dictionaries'));

//probably set timers here???
//this is an asynchronous readline so timer can run.
rl.question('I\'m Eliza. What is your name? ', (answer) => {
  name = answer;
  greeting = dict.entry['opener'][Math.floor(Math.random() * dict.entry['opener'].length)+1];
  greeting = greeting.replace("<name>", name);
  console.log(greeting);
  rl.close();
});
