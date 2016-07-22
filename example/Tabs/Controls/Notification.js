function hiNotification() {
	// Global vars ------------------------------------
	var notification2 = null;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Notification example',
		icon: '',
		destroy: true,
		resize: 0,
		width: '400',
		height: '203',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Button5 = new Button({
		caption: 'Show',
		url: ''
	});
	Button5.place(84,140,'108','28');
	this.ctl.add(Button5);
	var Edit6 = new Edit({
		text: 'Title',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit6.place(84,7,'309','21');
	this.ctl.add(Edit6);
	var Memo7 = new Memo({
		text: 'Hello from HiOn!'
	});
	Memo7.place(84,35,'309','100');
	this.ctl.add(Memo7);
	var Label8 = new Label({
		caption: 'Title',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label8.place(21,7,'50','21');
	this.ctl.add(Label8);
	var Label9 = new Label({
		caption: 'Content',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label9.place(21,42,'50','14');
	this.ctl.add(Label9);
	var Button10 = new Button({
		caption: 'Close',
		url: ''
	});
	Button10.place(203,140,'108','28');
	this.ctl.add(Button10);
	
	// Init section ------------------------------------
	function showNotify2(text, content) {
		notification2 = new window.Notification(text, { body: content, icon: 'favicon.ico'});
		notification2.onclose = function(){
			alert('Notify was closed.');
		};
		notification2.onclick = function(){
			alert('Click to notify!');
		};
	}
	Button5.addListener('click', function (event) {
		if(window.Notification.permission !== "denied") {
		window.Notification.requestPermission(function (permission) {
			if (permission === "granted") {
				showNotify2(Edit6.text,Memo7.text);
			}
		});
	}
	});
	Button10.addListener('click', function (event) {
		if(notification2) {
			notification2.close();
		}
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
