var util	= require('util'),
	extend  = require('extend'),
	response= require('./response');

var Command = function(cmd, args, cb){
	this.cmd = cmd || "INVA";
	if(typeof args!=='object' && typeof args!=='undefined' && args!==null){
		args = [args];
	}
	this.args = args;
	this.cb = cb;
}

Command.prototype.toString = function(){
	var str = this.cmd;

	if(this.args){
		for(var i=0; i<this.args.length; i++){
			str += ' ' + this.args[i];
		}
	}

	return str;
}

Command.prototype.handleResponse = function(resp){
	//no callback, so return
	if(!this.cb) return;
	
	if(resp.isError()){
		this.cb(resp.getError());
		return;
	}

	if(resp.cmd!=this.cmd){
		this.cb(response.getError(response.ERRORS.ERRM));
		return;
	}

	if(!resp.hasArgs()){
		this.cb();
		return;
	}


	var args = this.formatResult(resp.getArgs());
	if(util.isArray(args)){
		args.unshift(null);
	}else{
		args = [null, args];
	}

	this.cb.apply(null, args);
}

Command.prototype.formatResult = function(args){
	return args;
}

/************* POWER ************/
Command.POWER = {
	OFF: 0, ON: 1, COOLING_DOWN: 2, WARMING_UP: 3,
	STANDBY: 0
}

Command.PowerCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	if(args.length>0){
		data = args.shift();
	}
	
	Command.call(this, 'POWR', data, cb);
}

util.inherits(Command.PowerCommand, Command);

Command.PowerCommand.prototype.formatResult = function(args){
	if(args.length>0){
		return parseInt(args[0]);
	}
}


/************* INPUT ************/
Command.INPUT = {
	RGB: 1, VIDEO: 2, DIGITAL: 3, STORAGE: 4, NETWORK: 5
}

Command.InputCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();
	
	if(args.length>0){
		var input = {source: 'rgb', channel: 1}

		if(typeof args[0]=='object'){
			input = extend(input, args[0]);
		}else if(typeof args[0]=='string' && args[0].length==2){ //string code
			input.source = parseInt(args[0].substr(0,1));
			input.channel = parseInt(args[0].substr(1,1));
		}else if(typeof args[0]=='number' && args[0]>=10){ //number code
			input.channel = args[0]%10;
			input.source = (args[0]-input.channel)/10;
		}else{
			input.source = args.shift();
			if(args.length) input.channel = args.shift();
		}

		if(typeof input.source==='string'){
			input.source = Command.INPUT[input.source.toUpperCase()];
		}

		data = input.source + '' + input.channel;

	}

	Command.call(this, 'INPT', data, cb);
}
util.inherits(Command.InputCommand, Command);

Command.InputCommand.prototype.formatResult = function(args){
	if(args.length>0){
		args = args[0];
		if(typeof args==='string' && args.length>1){
			try{
				var source = parseInt(args.substr(0,1));
				var channel = parseInt(args.substr(1,1));
				return {source: source, channel: channel, code: args, name: findSourceName(source, channel)};
			}catch(e){}
		}
	}
}

var findSourceName = function(source, channel){
	for(var key in Command.INPUT){
		if(Command.INPUT[key]==source){
			return key + ' - ' + channel;
		}
	}

	return 'unknown';
}

/************* MUTE ************/

Command.MuteCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	if(args.length>0){
		var mute = {audio: false, video: false};

		if(typeof args[0]=='object'){
			mute = extend(mute, args[0]);
		}else{
			mute.video = args.shift();
			if(args.length) mute.audio = args.shift();
		}

		//if both the same
		if(mute.audio==mute.video){
			if(mute.audio){
				data = '31';
			}else{
				data = '30';
			}
		}else{
			if(mute.video){
				data = '11';
			}else{
				data = '21';
			}
		}
	}

	Command.call(this, 'AVMT', data, cb);
}

util.inherits(Command.MuteCommand, Command);

Command.MuteCommand.prototype.formatResult = function(args){
	var mute = {audio: false, video: false}
	if(args.length>0){
		args = args[0];
		if(typeof args==='string' && args.length>1){

			var c = args.substr(0,1);
			var v = (args.substr(1,1)=='1');

			switch(c){
				case '1':
					mute.video = v;
					break;
				case '2':
					mute.audio = v;
					break;
				case '3':
					mute.video = mute.audio = v;
					break;
			}
		}
	}
	return mute;
}

/************* ERRORS ************/

Command.ErrorsCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'ERST', data, cb);
}

util.inherits(Command.ErrorsCommand, Command);

Command.ErrorsCommand.prototype.formatResult = function(args){
	if(args.length>0){
		args = args[0];
		if(typeof args==='string' && args.length==6){
			if(parseInt(args)!=0){
				var err = {
					fan: args.substr(0,1),
					lamp: args.substr(1,1),
					temperature: args.substr(2,1),
					cover: args.substr(3,1),
					filter: args.substr(4,1),
					other: args.substr(5,1)
				}
				for(k in err){
					if(err.hasOwnProperty(k)){
						err[k] = (err[k]=='2'?'error':(err[k]=='1')?'warning':false);
					}
				}
				return err;
			}
		}
	}
	return null;
}

/************* LAMP ************/

Command.LampCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'LAMP', data, cb);
}

util.inherits(Command.LampCommand, Command);

Command.LampCommand.prototype.formatResult = function(args){
	var lamps = [];

	if(args.length>0 && args.length%2==0){
		for(var i=0; i<args.length; i+=2){
			var lamp = {
				hours: parseInt(args[i]),
				on: (args[i+1]=='1')
			}
			lamps.push(lamp);
		}
	}

	return [lamps];
}

/************* INPUTS ************/

Command.InputsCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'INST', data, cb);
}

util.inherits(Command.InputsCommand, Command);

Command.InputsCommand.prototype.formatResult = function(args){
	var inputs = [];

	for(var i=0; i<args.length; i++){
		var input = args[i];
		if(typeof input==='string' && input.length>1){
			try{
				var source = parseInt(input.substr(0,1));
				var channel = parseInt(input.substr(1,1));
				inputs.push(
					{source: source, channel: channel, code: input, name: findSourceName(source, channel)}
				);
			}catch(e){}
		}
	}

	return [inputs];
}

/************* Name ************/

Command.NameCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'NAME', data, cb);
}

util.inherits(Command.NameCommand, Command);

/************* MANUFACTURER ************/

Command.ManufacturerCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'INF1', data, cb);
}

util.inherits(Command.ManufacturerCommand, Command);

/************* MODEL ************/

Command.ModelCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'INF2', data, cb);
}

util.inherits(Command.ModelCommand, Command);

Command.ModelCommand.prototype.formatResult = function(args) {
    return args.join(" ");
}

/************* INFO ************/

Command.InfoCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'INFO', data, cb);
}

util.inherits(Command.InfoCommand, Command);

/************* CLASS ************/

Command.ClassCommand = function(){
	var cb;
	var data = '?';
	var args = Array.prototype.slice.call(arguments, 0);

	if(typeof args[args.length-1]==='function') cb = args.pop();

	Command.call(this, 'CLSS', data, cb);
}

util.inherits(Command.ClassCommand, Command);


module.exports = Command;
