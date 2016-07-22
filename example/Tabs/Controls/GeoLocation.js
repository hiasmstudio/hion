function hiGeoLocation() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Geo location',
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
	
	var Button3 = new Button({
		caption: 'Locate',
		url: ''
	});
	Button3.place(7,14,'66','28');
	this.ctl.add(Button3);
	var Label5 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label5.place(140,14,'225','28');
	this.ctl.add(Label5);
	var YaMap6 = new YaMap({});
	YaMap6.init();
	YaMap6.place(7,49,'382','221');
	this.ctl.add(YaMap6);
	var Label7 = new Label({
		caption: 'Position:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label7.place(84,14,'50','28');
	this.ctl.add(Label7);
	
	// Init section ------------------------------------
	function hub4(data4) {
		Label5.caption = data4;
		YaMap6.setCenter(data4[0],data4[1]);
		YaMap6.setPlacemark(data4[0],data4[1],data4[2],data4[3]);
	}
	Button3.addListener('click', function (event) {
		navigator.geolocation.getCurrentPosition(function(geoPos){
			var geoPosArray = [geoPos.coords.latitude, geoPos.coords.longitude];
			hub4(geoPosArray);
		});
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
