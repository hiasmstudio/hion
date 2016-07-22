function hiAnimationDemo() {
	// Global vars ------------------------------------
	var arrSplit5 = 0;
	var val6 = 0;
	var res11 = 0;
	var arr13 = [];
	var timerId14 = 0;
	var res19 = 0;
	var val21 = 0;
	var counter22 = 0;
	var res25 = 0;
	var res27 = 0;
	var counter28 = 0;
	var res29 = 0;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Animation demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '403',
		height: '310',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Edit4 = new Edit({
		text: 'Hion!!!',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit4.place(266,7,'120','21');
	this.ctl.add(Edit4);
	var PaintBox16 = new Canvas({});
	PaintBox16.place(14,35,'373','240');
	this.ctl.add(PaintBox16);
	TrackBar30 = new TrackBar({
		min: 2,
		max: 10,
		step: 1,
		position: 10
	});
	TrackBar30.place(112,7,'142','21');
	this.ctl.add(TrackBar30);
	var Label32 = new Label({
		caption: 'Particles gravity',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label32.place(14,7,'92','21');
	this.ctl.add(Label32);
	
	// Init section ------------------------------------
	Math.point = function(x, y){ return {x: x, y: y}; };
	
	function hub12(data12) {
		arr13 = [];
		var arr9 = data12;
		for(var i9 in arr9) {
			res11 = [0,0];
			arr13.push(res11);
		}
	}
	Edit4.addListener('change', function (event) {
		arrSplit5 = Edit4.text.split('');
		val6 = arrSplit5;
		hub12(val6);
	});
	function hub18(data18) {
		res19 = Math.point(arr13[i17][0], arr13[i17][1]);
		var text = data18;
		PaintBox16.canvas.font = '12px Arial';
		var x = res19.x;
		var y = res19.y;
		PaintBox16.canvas.fillText(text, x, y);
	}
	function drawCanvas16() {
		PaintBox16.clear();
		var arr17 = val6;
		for(var i17 in arr17) {
			hub18(arr17[i17]);
		}
	}
	PaintBox16.addListener('mousemove', function (event) {
		var args16 = [event.layerX, event.layerY, event.button, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		val21 = args16;
	});
	function oncounter22() {
	}
	PaintBox16.addListener('mouseover', function (event) {
		counter22 += 1;
		if(counter22 > 100) {
			counter22 = 0;
		}
		oncounter22();
	});
	PaintBox16.addListener('mouseout', function (event) {
		counter22 = 0;
		oncounter22();
	});
	function hub15(data15) {
		drawCanvas16();
		for(var i24 = 1; i24 < arr13.length; i24 += 1) {
			res25 = arr13[i24][0] += (arr13[i24 - 1][0] - arr13[i24][0])/Math._k,arr13[i24][1] += (arr13[i24 - 1][1] - arr13[i24][1])/Math._k;
		}
		if(counter22 > 0) {
			res27 = arr13[0][0] += (val21[0] - arr13[0][0])/10,arr13[0][1] += (val21[1] - arr13[0][1])/10;
		}
		else {
			counter28 += 2;
			if(counter28 > 359) {
				counter28 = 0;
			}
			res29 = arr13[0][0] += (170 + Math.sin(counter28/180*Math.PI)*60 - arr13[0][0])/5,arr13[0][1] += (120 + Math.cos(counter28/180*Math.PI)*60 - arr13[0][1])/5;
		}
	}
	function hub2(data2) {
		arrSplit5 = Edit4.text.split('');
		val6 = arrSplit5;
		hub12(val6);
		timerId14 = setInterval(function() {
			hub15();
		}, 10);
	}
	Math._k = '10';
	TrackBar30.addListener('input', function (event) {
		Math._k = TrackBar30.position;
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		hub2();
	};
}

// made by hion
