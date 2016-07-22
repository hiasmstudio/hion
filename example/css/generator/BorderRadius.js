function BorderRadius() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Border radius generator',
		icon: '',
		destroy: true,
		resize: 0,
		width: '400',
		height: '300',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	TrackBar3 = new TrackBar({
		min: 0,
		max: 50,
		step: 1,
		position: 0
	});
	TrackBar4 = new TrackBar({
		min: 0,
		max: 20,
		step: 1,
		position: 1
	});
	var Label7 = new Label({
		caption: 'Label',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label7.place(133,133,'155','133');
	this.ctl.add(Label7);
	var Edit8 = new Edit({
		text: '',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit8.place(63,98,'323','21');
	this.ctl.add(Edit8);
	TrackBar4.place(70,42,'275','21');
	this.ctl.add(TrackBar4);
	TrackBar3.place(70,14,'275','21');
	this.ctl.add(TrackBar3);
	var Label9 = new Label({
		caption: 'Radius:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label9.place(7,14,'57','21');
	this.ctl.add(Label9);
	var Label10 = new Label({
		caption: 'Size:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label10.place(7,42,'57','21');
	this.ctl.add(Label10);
	var Label11 = new Label({
		caption: 'Result: ',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label11.place(7,98,'50','21');
	this.ctl.add(Label11);
	
	// Init section ------------------------------------
	function hub5(data5) {
		Label7.caption = '<div style="margin-left: 55px; background-color: white; border: 1px solid gray; width: 40px; height: 40px; ' + data5 + '"></div>';
		Edit8.text = data5;
	}
	TrackBar4.addListener('input', function (event) {
		hub5('border-radius: ' + TrackBar3.position + 'px; border: ' + TrackBar4.position + 'px solid red;');
	});
	TrackBar3.addListener('input', function (event) {
		hub5('border-radius: ' + TrackBar3.position + 'px; border: ' + TrackBar4.position + 'px solid red;');
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		hub5('border-radius: ' + TrackBar3.position + 'px; border: ' + TrackBar4.position + 'px solid red;');
	};
}

// made by hion
