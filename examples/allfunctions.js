var pjlink = require('..');

var beamer = new pjlink("localhost", 10000, "JBMIAProjectorLink");
beamer.powerOn(function(err){
	if(err){
		console.log('error turning on', err);
		return;
	}

	/**
		Get and set the input, choose from:
		* 1 /	'rgb' /		pjlink.INPUT.RGB
		* 2 /	'video' /	pjlink.INPUT.VIDEO
		* 3 /	'digital' /	pjlink.INPUT.DIGITAL
		* 4 /	'storage' /	pjlink.INPUT.STORAGE
		* 5 / 	'network' /	pjlink.INPUT.NETWORK
	**/
	beamer.getInput(function(err, input){
		console.log('input', err, input);
	});
	beamer.setInput({source: 'rgb', channel: 1}, function(err){
		if(err){
			console.log('error setting source', err);
			return;
		}
	});

	beamer.getMute(function(err, state){
		console.log('mute', err, state);
	});

	beamer.setMute(false, true, function(err){
		if(err) console.log('error setting mute');
	});

	beamer.getErrors(function(err, errors){
		console.log('errors', err, errors);
	});

	beamer.getLamps(function(err, lamps){
		console.log('lamp', err, lamps);
	});

	beamer.getInputs(function(err, inputs){
		console.log('inputs', err, inputs);
	});

	beamer.getName(function(err, name){
		console.log('name', err, name);
	});

	beamer.getManufacturer(function(err, manufacturer){
		console.log('manufacturer', err, manufacturer);
	});

	beamer.getModel(function(err, model){
		console.log('model', err, model);
	});

	beamer.getInfo(function(err, info){
		console.log('info', err, info);
	});

	//should always return 1
	beamer.getClass(function(err, classNumber){
		console.log('class', err, classNumber);
	});


	/**
		Four possible power states:
		* 0	/	pjlink.POWER.OFF
		* 1 /	pjlink.POWER.ON
		* 2 /	pjlink.POWER.COOLING_DOWN
		* 3 /	pjlink.POWER.WARMING_UP
	**/
	beamer.getPowerState(function(err, state){
		if(err){
			console.log(err);
			return;
		}
		console.log('power', err, state);
	});
});