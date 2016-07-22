function BoxShadow() {
	// Global vars ------------------------------------
	var res3 = 0;
	var res4 = 0;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Box shadow generator',
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
	
	TrackBar5 = new TrackBar({
		min: 0,
		max: 30,
		step: 1,
		position: 4
	});
	var Label8 = new Label({
		caption: 'Label',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label8.place(133,133,'155','133');
	this.ctl.add(Label8);
	var Edit9 = new Edit({
		text: '',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit9.place(63,98,'323','21');
	this.ctl.add(Edit9);
	TrackBar5.place(70,70,'275','21');
	this.ctl.add(TrackBar5);
	TrackBar10 = new TrackBar({
		min: 0,
		max: 359,
		step: 1,
		position: 0
	});
	var Label12 = new Label({
		caption: '0',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label12.place(357,14,'29','21');
	this.ctl.add(Label12);
	TrackBar13 = new TrackBar({
		min: -75,
		max: 75,
		step: 1,
		position: 0
	});
	TrackBar13.place(70,42,'275','21');
	this.ctl.add(TrackBar13);
	TrackBar10.place(70,14,'275','21');
	this.ctl.add(TrackBar10);
	var Label14 = new Label({
		caption: 'Angle:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label14.place(7,14,'57','21');
	this.ctl.add(Label14);
	var Label15 = new Label({
		caption: 'Distance:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label15.place(7,42,'57','21');
	this.ctl.add(Label15);
	var Label16 = new Label({
		caption: 'Blur:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label16.place(7,70,'57','21');
	this.ctl.add(Label16);
	var Label17 = new Label({
		caption: 'Result: ',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label17.place(7,98,'50','21');
	this.ctl.add(Label17);
	
	// Init section ------------------------------------
	Math.point = function(x, y){ return {x: x, y: y}; };
	
	function hub6(data6) {
		Label8.caption = '<div style="margin-left: 55px; background-color: white; border: 1px solid gray; width: 40px; height: 40px; ' + data6 + '"></div>';
		Edit9.text = data6;
	}
	TrackBar5.addListener('input', function (event) {
		hub6('box-shadow: ' + res3 + 'px ' + res4 + 'px ' + TrackBar5.position + 'px 0px rgba(50, 50, 50, 1);');
	});
	TrackBar13.addListener('input', function (event) {
		with(Math) {
			res3 = round(sin(TrackBar10.position/180*PI)*TrackBar13.position);
		}
		with(Math) {
			res4 = round(cos(TrackBar10.position/180*PI)*TrackBar13.position);
		}
		hub6('box-shadow: ' + res3 + 'px ' + res4 + 'px ' + TrackBar5.position + 'px 0px rgba(50, 50, 50, 1);');
	});
	function hub11(data11) {
		Label12.caption = (data11).toString();
		with(Math) {
			res3 = round(sin(TrackBar10.position/180*PI)*TrackBar13.position);
		}
		with(Math) {
			res4 = round(cos(TrackBar10.position/180*PI)*TrackBar13.position);
		}
		hub6('box-shadow: ' + res3 + 'px ' + res4 + 'px ' + TrackBar5.position + 'px 0px rgba(50, 50, 50, 1);');
	}
	TrackBar10.addListener('input', function (event) {
		hub11(TrackBar10.position);
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		hub6('box-shadow: ' + res3 + 'px ' + res4 + 'px ' + TrackBar5.position + 'px 0px rgba(50, 50, 50, 1);');
	};
}

// made by hion
