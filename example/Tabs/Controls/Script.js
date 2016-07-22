function hiScript() {
	// Global vars ------------------------------------
	var script2 = {doWork1: function(data) {
  this.onEvent1("[" + data + "]");
},
doWork2: function(data) {
  
}};
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Script test',
		icon: '',
		destroy: true,
		resize: 0,
		width: '399',
		height: '109',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Edit3 = new Edit({
		text: '',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit3.place(203,21,'183','21');
	this.ctl.add(Edit3);
	var Button4 = new Button({
		caption: 'Run script',
		url: ''
	});
	Button4.place(105,56,'129','21');
	this.ctl.add(Button4);
	var Edit6 = new Edit({
		text: 'test',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit6.place(21,21,'127','21');
	this.ctl.add(Edit6);
	var Label7 = new Label({
		caption: '[',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label7.place(14,21,'8','21');
	this.ctl.add(Label7);
	var Label8 = new Label({
		caption: ']      = ',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label8.place(154,21,'43','21');
	this.ctl.add(Label8);
	
	// Init section ------------------------------------
	script2.onEvent1 = function(eventData) {
		Edit3.text = eventData;
	}
	Button4.addListener('click', function (event) {
		script2.doWork1(Edit6.text);
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
