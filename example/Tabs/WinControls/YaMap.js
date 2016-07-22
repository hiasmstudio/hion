function hiYaMap() {
	// Global vars ------------------------------------
	var strArray11 = '29.979167\n31.134167\nПирамида Хеопса'.split("\n");
	var strArray17 = '-14.688333\n-75.122778\nГеоглифы Наски'.split("\n");
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Form',
		icon: '',
		destroy: true,
		resize: 0,
		width: '639',
		height: '479',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var YaMap2 = new YaMap({});
	YaMap2.init();
	YaMap2.place(147,35,'473','403');
	this.ctl.add(YaMap2);
	var Edit6 = new Edit({
		text: '',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit6.place(175,7,'169','21');
	this.ctl.add(Edit6);
	var Edit8 = new Edit({
		text: '',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit8.place(371,7,'169','21');
	this.ctl.add(Edit8);
	var Label9 = new Label({
		caption: 'X:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label9.place(154,7,'15','21');
	this.ctl.add(Label9);
	var Label10 = new Label({
		caption: 'Y:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label10.place(357,7,'15','21');
	this.ctl.add(Label10);
	var Button12 = new Button({
		caption: 'Пирамида Хеопса',
		url: ''
	});
	Button12.place(14,35,'122','28');
	this.ctl.add(Button12);
	var Button15 = new Button({
		caption: 'Геоглифы Наски',
		url: ''
	});
	Button15.place(14,70,'122','28');
	this.ctl.add(Button15);
	
	// Init section ------------------------------------
	function hub3(data3) {
		Edit6.text = data3[0];
		Edit8.text = data3[1];
	}
	YaMap2.addListener('coords', function (event) {
		hub3(event);
	});
	function hub14(data14) {
		YaMap2.setCenter(data14[0],data14[1]);
		YaMap2.setPlacemark(data14[0],data14[1],data14[2],data14[3]);
	}
	Button12.addListener('click', function (event) {
		hub14(strArray11);
	});
	Button15.addListener('click', function (event) {
		hub14(strArray17);
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
