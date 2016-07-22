function hiCore() {
	// Global vars ------------------------------------
	var res6 = 0;
	var matr8 = [];
	var arr12 = [-1,-1,-1,0,1,1,1,0];
	var res13 = 0;
	var res16 = 0;
	var matrIndex19 = [0,0];
	var counter20 = 0;
	var val24 = 0;
	var res25 = 0;
	var sourceX26 = 0;
	var res27 = 0;
	var matrIndex32 = [0,0];
	var matr33 = [];
	var res36 = 0;
	var sourceX37 = 0;
	var res38 = 0;
	var res41 = 0;
	var stack42 = [];
	var val44 = 0;
	var res47 = 0;
	var res52 = 0;
	var arr53 = [-1,-1,-1,0,1,1,1,0];
	var res62 = 0;
	var res67 = 0;
	var res70 = 0;
	var matrIndex72 = [0,0];
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Mine sweeper',
		icon: '',
		destroy: true,
		resize: 0,
		width: '357',
		height: '413',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var PaintBox21 = new Canvas({});
	PaintBox21.place(14,49,'320','320');
	this.ctl.add(PaintBox21);
	var Image30 = new UIImage({
		url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAAgCAYAAACVf3P1AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AMCEAEaz2ZoMgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAUxSURBVHja7ZtvbFNVHIafdsMR2AirDJvhtMKMDAy0AxUFVD6YGNNbMJkJDgYDIkuIH8pg2cfxgW3+gQ4jNsYFmcWQIJXhbRWCJjMqCJE/2WCCZsoYZEU6Bo4pdOtaP9SWbcB27y20Ts6TLGvP8p57evLud857dqZrbW0Nk0RMJpMOwX1LKkBTU5Mm8fHjxykuLo5LL7i/0YspEPxvDSjZbEg2m5hlQeINKIwnSJoBhfkESTWgR5bFzAqSuwQLEwqSHkI8sow45BMkzYACQdIMaLPZsP0bRmwilAgSacDbGU6YUJAQAw5lNGFCwWBS73aHski/AhFCBCOqAsZ7K0XcahFoRbdhw4awmAZBUitgfn6+JvGMGTOoq6sTeqHXrNdrTbQCQUJCiNvtFrMkSJwB3W43gUAAt9uNwWDA6/UOaBMI7voesD+SJLFmzRr8fn+szeVysW/fPpxOZ0IG9aZNGvB+q+xRpX/3+5tbh7SUsRgzcnnBVMxDGVMU9xG90xgCeseO5ZrJxK+LF3N55kzFfXz25UU+3esDQK61qPoMW26z/bGrOGM1HvQxZU8rGRe6GXW9DwCP/LIi7atv337rVV+u/PmNjY24XC7a2toAyMnJoaioCIvFMrQBPR4Pfr+fcDiMTnfzLovf78fj8VBQUHDPDRg13GAjKqVsfmSiQqE+fuv8ib2nq/ji9FusfrpWcR+x62TBIBOPHuWZqirSN23i6x07FOmPnfyTr771xz0Xdg0H+4/sb2Om82daFpk4UjGL4LgHVOn7G+3cpVZKt9vJy5mmqo/Nmzdz9epVampqCIfDlJaW4nA42DFo/vSDl1+v1xs5n9HdepHK6/UOuGTwn99f6FNITYlMfk9fQFMfulAIfV+kgnRPmqRI0/7HDbZ83EZ5iSnuz/B+QQHOwkK81dVc6+hQpJlc3wpA1gk/L61sYG7Zj6Sfu6bp+bXffESIEEufL1Kly8rKivko6iWj0XjnJThqKoPBMGTHy5YtS0gVvBv84j+E98wmAOY+uli1vv+/FvxtMHBq9WpFuqoPfud1m5G83Iy4K19vIMCx+noO79zJ9e5uXqusHFY7xn8dgOZVeejC8GzFUczvNfGDY66qMRw6c5Dm86fInzyLqQ/nqVuFysqoqKjAbrcDkJ2dzfr16+8cQmRZRpZlrFbrHTu1Wq0jxnyNvgPIZ94hRJAXTSuxZL+iug+PLOPdvZtj69YxprOT2dXVinRtvgAf7ryA7Y0TN4+0+r1Ww6i0NPIXLgTgUkuLIs2NzEjVvzw9k44nMwFIv/CXquf2BHuoa9gOwJL5S1WPu7KyEp/PR01NDQ6Hg/b2djZu3Dh8CpYkKVY+B5dUSZJGhPmOnP+cAy1bgRALHlvFUzmLNPcVTkkhOHq0Ko1ca4l99W/TQrC3l6b9+yNVZOpURRrfvMhS92DzFSacugJA57RMdfvAI3vwd11izhPPMdk4RfW4u7q6blmCo23DhhCn04nH44ntB61WK5IkJSyEDA4f0fdK0/B3rZ/EXjec3UbD2W0DwomqFKzX05OezsXZszldVJSwX6L+KXjM+PHkLVjA/BUrlG09Ch9H3xPC4mgkpSdM+5yJnCxRHiI6ujrYc9iNDh2F85ZoGv/atWtxuVyUl5cDkJuby/Lly4c3YNRg0e8ul+uWtkSlYK2oMdqwKThOtFY+exzPD6Wl0lwyneaS6Zr0E8ZNYNe6+M58zWYzZrN5+KA41A9Hyn5PMHIZ9k9x4oKp4F6SCpFbCfEg9EKvlX8APorrnD4qXdoAAAAASUVORK5CYII=',
		mode: 0
	});
	var PaintBox31 = new Canvas({});
	PaintBox31.place(14,49,'320','320');
	this.ctl.add(PaintBox31);
	var AudioPlayer59 = new AudioPlayer({
		url: '/example/Game/Minesweeper/bomb.ogg',
		controls: 1,
		autoplay: 0
	});
	AudioPlayer59.place(371,238,'270','31');
	this.ctl.add(AudioPlayer59);
	Image30.place(63,378,'160','32');
	this.ctl.add(Image30);
	var Button79 = new Button({
		caption: 'Start',
		url: ''
	});
	Button79.place(105,14,'143','28');
	this.ctl.add(Button79);
	
	// Init section ------------------------------------
	Math.point = function(x, y){ return {x: x, y: y}; };
	
	function initMatrix8() {
		matr8 = [];
		for(var x = 0; x < 20; x++) {
				var a = [];
				for(var y = 0; y < 20; y++) {
					a.push(0);
				}
				matr8.push(a);
			}
	}
	initMatrix8();
	function oncounter20() {
	}
	function initMatrix33() {
		matr33 = [];
		for(var x = 0; x < 20; x++) {
				var a = [];
				for(var y = 0; y < 20; y++) {
					a.push(0);
				}
				matr33.push(a);
			}
	}
	initMatrix33();
	function hub35(data35) {
		res36 = data35*16;
		sourceX37 = res36;
		res38 = Math.point(matrIndex32[0]*16, matrIndex32[1]*16);
		PaintBox31.canvas.drawImage(Image30.getControl(),sourceX37,0,16,16,res38.x,res38.y,16,16);
	}
	function drawCanvas31() {
		PaintBox31.clear();
		var m = matr33;
		for(var row = 0; row < m.length; row++) {
			for(var col = 0; col < m[row].length; col++) {
				matrIndex32 = [col,row];
				if(m[row][col] < 2) {
					hub35(m[row][col]);
				}
			}
		}
	}
	function hub56(data56) {
		PaintBox31.setVisible(0);
		switch(data56) {
			case 1:
				AudioPlayer59.play();
				break;
		}
	}
	function hub43(data43) {
		val44 = data43;
		var matr45 = matr33;
		var index45 = val44;
		if(index45[1] >= 0 && index45[1] < matr45.length) {
			var row45 = matr45[index45[1]];
			if(index45[0] >= 0 && index45[0] < row45.length) {
				if(row45[index45[0]] < 2) {
					res47 = matr33[val44[1]][val44[0]] = 2;
					var matr48 = matr8;
					var index48 = val44;
					if(index48[1] >= 0 && index48[1] < matr48.length) {
						var row48 = matr48[index48[1]];
						if(index48[0] >= 0 && index48[0] < row48.length) {
							if(row48[index48[0]] == 0) {
								for(var i51 = 0; i51 < 8; i51 += 1) {
									res52 = [val44[0] + arr53[i51], val44[1] + arr53[(i51 + 2) % 8]];
									stack42.push(res52);
								}
							}
							else {
								if(row48[index48[0]] == -1) {
									hub56(1);
								}
							}
						}
					}
				}
			}
		}
		popStack42();
	}
	function popStack42() {
		if(stack42.length) {
			hub43(stack42.pop());
		}
	}
	function hub78(data78) {
		if(res67 == data78) {
			hub56(0);
		}
		res67 = 0;
	}
	function hub77(data77) {
		drawCanvas31();
		var m = matr33;
		for(var row = 0; row < m.length; row++) {
			for(var col = 0; col < m[row].length; col++) {
				matrIndex72 = [col,row];
				if(m[row][col] == 1) {
					var matr74 = matr8;
					var index74 = matrIndex72;
					if(index74[1] >= 0 && index74[1] < matr74.length) {
						var row74 = matr74[index74[1]];
						if(index74[0] >= 0 && index74[0] < row74.length) {
							if(row74[index74[0]] == -1) {
								res67 = res67 + 1;
							}
						}
					}
				}
				else {
					if(m[row][col] == 2) {
						res67 = res67 + 1;
					}
				}
			}
		}
		res70 = matr33.length*matr33.length;
		hub78(res70);
	}
	function hub76(data76) {
		stack42.push(data76);
		popStack42();
		hub77(data76);
	}
	function hub75(data75) {
		res41 = [Math.floor(data75[0]/16), Math.floor(data75[1]/16)];
		if(data75[2] == 0) {
			hub76(res41);
		}
		else {
			res62 = matr33[res41[1]][res41[0]] = 1 - matr33[res41[1]][res41[0]];
			hub77(res62);
		}
	}
	PaintBox31.addListener('mousedown', function (event) {
		var args31 = [event.layerX, event.layerY, event.button, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		hub75(args31);
	});
	PaintBox31.addListener('contextmenu', function (event) {
		var args31 = [event.layerX, event.layerY, event.button, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		event.preventDefault();
		return false;
	});
	Image30.addListener('load', function (event) {
		drawCanvas31();
	});
	Image30.hide();
	function hub29(data29) {
		res25 = (data29[0]+1)*16;
		sourceX26 = res25;
		res27 = Math.point(data29[1]*16, data29[2]*16);
		val24.drawImage(Image30.getControl(),sourceX26,16,16,16,res27.x,res27.y,16,16);
	}
	function drawCanvas21() {
		PaintBox21.clear();
		val24 = PaintBox21.canvas;
		var m = matr8;
		for(var row = 0; row < m.length; row++) {
			for(var col = 0; col < m[row].length; col++) {
				var arrayValue = [m[row][col], col, row];
				hub29(arrayValue);
			}
		}
	}
	PaintBox21.addListener('contextmenu', function (event) {
		var args21 = [event.layerX, event.layerY, event.button, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		event.preventDefault();
		return false;
	});
	function hub2(data2) {
		for(var i5 = 0; i5 < Math.round(35); i5 += 1) {
			res6 = matr8[Math.round(Math.random()*19)][Math.round(Math.random()*19)] = -1;
		}
		var m = matr8;
		for(var row = 0; row < m.length; row++) {
			for(var col = 0; col < m[row].length; col++) {
				matrIndex19 = [col,row];
				if(m[row][col] == 0) {
					for(var i11 = Math.round(0); i11 < 8; i11 += 1) {
						res13 = [matrIndex19[0] + arr12[i11], matrIndex19[1] + arr12[(i11 + 2) % 8]];
						var matr18 = matr8;
						var index18 = res13;
						if(index18[1] >= 0 && index18[1] < matr18.length) {
							var row18 = matr18[index18[1]];
							if(index18[0] >= 0 && index18[0] < row18.length) {
								if(row18[index18[0]] == -1) {
									counter20 += 1;
									if(counter20 > 100) {
										counter20 = 0;
									}
									oncounter20();
								}
							}
						}
					}
					res16 = matr8[matrIndex19[1]][matrIndex19[0]] = counter20;
					counter20 = 0;
					oncounter20();
				}
			}
		}
		drawCanvas21();
	}
	function hub81(data81) {
		initMatrix33();
		initMatrix8();
	}
	function hub80(data80) {
		hub81(data80);
		hub2(data80);
		PaintBox31.setVisible(1);
		drawCanvas31();
	}
	Button79.addListener('click', function (event) {
		hub80();
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		hub2();
	};
}

// made by hion
