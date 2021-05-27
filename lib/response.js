var Response = function(cmd, err, args){
	this.cmd = cmd;
	this.err = err;
	this.args = args;

	if(args && typeof this.args!=='object'){
		this.args = [this.args];
	}
}

Response.AUTH = 'PJLINK';

Response.ERRORS = {
	'OK': null,
	'ERR1': 'Undefined command',
	'ERR2': 'Out of parameter',
	'ERR3': 'Unavailable time',
	'ERR4': 'Projector/Display failure',
	'ERRA': 'Authorization failed',
	'ERRM': 'Command reply mismatch',
	'ERRD': 'Not connected'
}

Response.prototype.isError = function(){
	return this.err!==null && typeof this.err!=='undefined';
}

Response.prototype.getError = function(){
	if(!this.isError()) return null;

	if(typeof this.err == 'object') return this.err;

	return Response.getError(this.err);
}

Response.getError = function(err){
	if(!err) return null;
	return new Error(err);
}

Response.prototype.hasArgs = function(){
	return this.args && this.args.length>0;
}

Response.prototype.getArgs = function(){
	return this.args;
}

Response.parse = function(data){
	if(typeof data==='object' && data.toString) data = data.toString();

	data = data.trim();//cut off trailing CR

	var cmd, args, err;

	var cmd = data.substr(0,6).toUpperCase();//header + command;
	data = data.substr(7);//skip to the data

	//the data should now contain an error if it is there
	if(Response.ERRORS.hasOwnProperty(data)){
		err = Response.ERRORS[data];
		data = null;
	}

	//handle authentication
	if(cmd==Response.AUTH){
		//more general error checking here
		if(!err){
			data = data.substr(2);//we read over the 0 or 1
		}
	}else{
		cmd = cmd.substr(2);//read the space character
	}

	if(data && data.length){
		args = data.split(' ');
	}

	return new Response(cmd,err,args);
}

Response.prototype.cmd = null;
Response.prototype.args = null;
Response.prototype.cls = 1;

module.exports = Response;
