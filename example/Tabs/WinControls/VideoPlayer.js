function hiVideoPlayer() {
	// Global vars ------------------------------------
	var timerId2 = 0;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Video player demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '340',
		height: '275',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var VideoPlayer4 = new VideoPlayer({
		url: 'http://www.w3schools.com/html/mov_bbb.ogg',
		controls: 1,
		autoplay: 0
	});
	VideoPlayer4.place(14,14,'312','171');
	this.ctl.add(VideoPlayer4);
	var Label7 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label7.place(147,231,'64','14');
	this.ctl.add(Label7);
	var Button9 = new Button({
		caption: 'Play',
		url: ''
	});
	Button9.place(98,196,'73','28');
	this.ctl.add(Button9);
	var Button10 = new Button({
		caption: 'Pause',
		url: ''
	});
	Button10.place(182,196,'73','28');
	this.ctl.add(Button10);
	
	// Init section ------------------------------------
	VideoPlayer4.addListener('ended', function (event) {
		alert('Video was finished');
	});
	Button9.addListener('click', function (event) {
		VideoPlayer4.play();
	});
	Button10.addListener('click', function (event) {
		VideoPlayer4.pause();
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		timerId2 = setInterval(function() {
			switch(VideoPlayer4.paused() ? 1 : 0) {
				case 0:
					Label7.caption = '';
					break;
				case 1:
					Label7.caption = '';
					break;
			}
		}, 1000);
	};
}

// made by hion
