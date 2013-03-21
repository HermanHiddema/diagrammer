var board = {
	width: 19,
	height: 19
};

var tool = 'black';
var oddcolor = 'black';
var evencolor = 'white';

function init() {
	var param = document.URL.split('#')[1];
	if (param) {
		params = param.split('x')
		board.width = Math.max(2, Math.min(50, parseInt(params[0])));
		board.height = Math.max(2, Math.min(50, parseInt(params[1])));
	}

	$('.viewport, .grid, .board, .overlay').css({
		'left':0,
		'top':0,
		'width':'' + (board.width) + 'em',
		'height': '' + (board.height) + 'em'
	});
	$('.data').html('')

	table = $('<table />')
	for (row = 0; row < board.height; row++) {
		table_row = $('<tr></tr>');
		for (col = 0; col < board.width; col++) {
			cell = $('<td></td>').addClass('empty');

			if (col==board.width-1)  { cell.addClass('right' ); }
			else if (col==0)         { cell.addClass('left'  ); }
			else                     { cell.addClass('center'); }

			if (row==board.height-1) { cell.addClass('bottom'); }
			else if (row==0)         { cell.addClass('top'   ); }
			else                     { cell.addClass('middle'); }

			if (hoshi(col, row, board.width-1, board.height-1)) {
				cell.addClass('hoshi');
				cell.attr('data', ',');
			}
			else {
				cell.addClass('normal')
				cell.attr('data', '.');				
			}
			table_row.append(cell)
		}
		table.append(table_row)
	}
	$('.data').append(table)
}

/**
	Is this a hoshi point?
	x,y,width and height are all 0 based, so the upper left corner of 19x19 is 0,0 on a size 18,18 board
*/

function hoshi(x, y, width, height) {
	if (width < 4 || height < 4) {
		return false;
	}
	if (2*x == width && 2*y == height) {
		return true // always tengen if available (both sides odd length)
	}
	w = false;
	h = false;
	if (width > 10 && (x == 3 || width-x == 3 || width == 2*x)) {
		w = true;
	}
	if (width > 6 && width < 11 && (x == 2 || width-x == 2 )) {
		w = true;
	}
	if (height > 10 && (y == 3 || height-y == 3 || height == 2*y)) {
		h = true;
	}
	else if (height > 6 && height < 11 && (y == 2 || height-y == 2)) {
		h = true;
	}
	return h && w;
}

function draw() {
	viewport = {
		width:  Math.round(parseInt($('.viewport').css('width'))/23),
		height: Math.round(parseInt($('.viewport').css('height'))/23),
		left:   Math.round(parseInt($('.viewport').css('left'))/23),
		top:    Math.round(parseInt($('.viewport').css('top'))/23),
	}
	viewport.right = board.width - viewport.width - viewport.left,
	viewport.bottom = board.height - viewport.height - viewport.top,

	edges = {
		north: parseInt($('.viewport').css('top') ) == 0,
		west:  parseInt($('.viewport').css('left')) == 0,
		east:  parseInt($('.viewport').css('left')) + parseInt($('.viewport').css('width') ) == parseInt($('.grid').css('width')),
		south: parseInt($('.viewport').css('top') ) + parseInt($('.viewport').css('height')) == parseInt($('.grid').css('height'))
	}

	// make overlay match viewport
	$('.overlay').css( {
		'width' : '' + viewport.width  + 'em',
		'height': '' + viewport.height + 'em',
		'border-left-width'  : '' + viewport.left   + 'em',
		'border-right-width' : '' + viewport.right  + 'em',
		'border-top-width'   : '' + viewport.top    + 'em',
		'border-bottom-width': '' + viewport.bottom + 'em',
	});

	lines = Array();
	lines.push(oddcolor == 'black' ? '$$B' : '$$W');
	hedge = Array(viewport.width).join('--') + '-'

	if (edges.north || edges.south) {
		if (edges.west) {
			hedge = '+-' + hedge;
		}
		if (edges.east) {
			hedge += '-+';					
		}
	} 
	hedge = '$$ ' + hedge;

	if (edges.north) {
		lines.push(hedge);
	}

	for (r = viewport.top; r < viewport.height + viewport.top; r++) {
		line = '$$'
		if (edges.west) { 
			line += ' |'; 
		}
		for (c = viewport.left; c < viewport.width + viewport.left; c++) {
			cell = $('.data table')[0].rows[r].cells[c];
			line += ' ' + $(cell).attr('data');
		}
		if (edges.east) {
			line += ' |';
		}
		lines.push(line)
	}
	if (edges.south) {
		lines.push(hedge);
	}
	$('#output').text(lines.join("\n"));
}

function resized() {
	draw();
}

function stone(cell, color) {
	if (color == 'white') {
		other = 'black';
	}
	else {
		other = 'white'
	}
	$(cell).removeClass('triangle circle square cross greyed')
	$(cell).html(''); // remove any previous label
	if ($(cell).hasClass('empty')) { 
		$(cell).removeClass('empty'); 
		$(cell).addClass(color);
		$(cell).attr('data', color == 'black' ? 'X' : 'O');
	}
	else if ($(cell).hasClass(color)) {
		$(cell).removeClass(color);
		$(cell).addClass(other);
		$(cell).attr('data', other == 'black' ? 'X' : 'O');
	}
	else if ($(cell).hasClass(other)) {
		$(cell).removeClass(other);
		$(cell).addClass('empty') 
		$(cell).attr('data', $(cell).hasClass('hoshi')? ',' : '.');
	}
}

function marker(cell, mark) {
	if ($(cell).hasClass(mark)) {
		$(cell).removeClass(mark)
		if ($(cell).hasClass('empty')) {
			$(cell).attr("data", $(cell).hasClass('hoshi')?',':'.');
		}
		else {
			$(cell).attr("data", $(cell).hasClass('black') ? 'X' : 'O');
		}
	}
	else {
		$(cell).html(''); // remove any previous label
		$(cell).removeClass('triangle circle square cross greyed move')
		$(cell).addClass(mark)
		if ($(cell).hasClass('empty')) {
			switch(tool) {
				case 'circle':   $(cell).attr("data", "C"); break; 
				case 'cross':    $(cell).attr("data", "M"); break;
				case 'triangle': $(cell).attr("data", "T"); break;
				case 'square':   $(cell).attr("data", "S"); break;
				case 'greyed':   $(cell).attr("data", "?"); break;
			}
		}
		else {
			switch(tool) {
				case 'circle':   $(cell).attr("data", $(cell).hasClass('black') ? 'B' : 'W'); break; 
				case 'cross':    $(cell).attr("data", $(cell).hasClass('black') ? 'Z' : 'P'); break;
				case 'triangle': $(cell).attr("data", $(cell).hasClass('black') ? 'Y' : 'Q'); break;
				case 'square':   $(cell).attr("data", $(cell).hasClass('black') ? '#' : '@'); break;
			}
		}
	}
}

function label(cell, label) {
	if (!$(cell).hasClass('empty')) {
		alert("You can only label empty points. For stones, use markers.")
	}
	else {
		$(cell).html(''); // remove any previous label
		$(cell).removeClass('triangle circle square cross greyed')
		if ($(cell).attr("data") == label) {
			$(cell).attr("data", $(cell).hasClass('hoshi')?',':'.')
		}
		else {
			$(cell).attr("data", label);
			$(cell).append($('<span class="label">'+label+'</span>'))
		}
	}
}
function move(cell) {
	if (! $(cell).hasClass('empty')) {
		return;
	}
	sel = $('#move option:selected');
	$(cell).removeClass('triangle circle square cross greyed')
	$(cell).attr("data", sel.val());
	$(cell).append($('<span class="move">'+(sel.val()==0?10:sel.val())+'</span>'));
	$(cell).removeClass('black white empty').addClass('move ' + (sel.val()%2?oddcolor:evencolor));
	$(sel).prop('selected', false).next().prop('selected', true);
}


$(document).on('click', 'td', function(){
	switch(tool) {
		case 'black':
		case 'white': stone($(this), tool); 
			break;
		case 'circle':
		case 'cross':
		case 'triangle':
		case 'square': 
		case 'greyed': marker($(this), tool);
			break;
		case 'label': label($(this), $('#label option:selected').val());
			break;
		case 'move': move($(this));
			break;
	}
	draw();
});

$(document).on('contextmenu', 'td', function(){
	if (tool == 'black' || tool == 'white') {
		stone($(this), tool == 'black' ? 'white' : 'black')
		draw();
		return false;
	}
	if (tool == 'move' && $(this).find('span').length > 0) {
		$(this).removeClass('black white empty move').addClass('empty');
		$(this).html('');
		$(this).attr("data", $(cell).hasClass('hoshi')?',':'.')
		sel = $('#move option:selected');
		$(sel).prop('selected', false).prev().prop('selected', true);
		draw();
		return false;
	}
});

$(document).on('click', '.tool', function(){
	$('.tool.active').removeClass('active');
  	$(this).addClass('active');
  	tool = $(this).attr('tool')
});

$(document).on('click', '.helper', function(){
  	if ($(this).hasClass('black')) {
  		$(this).addClass('white').removeClass('black');
  		oddcolor = 'white';
  		evencolor = 'black';
  	}
  	else {
  		$(this).addClass('black').removeClass('white');  		
  		oddcolor = 'black';
  		evencolor = 'white';
  	}
  	$('td.move').each(function() {
  		if ($(this).hasClass('black')) {
  			$(this).addClass('white').removeClass('black');
  		}
  		else {
  			$(this).addClass('black').removeClass('white');  			
  		}
  	});
  	draw();
});

$(document).on('click', '.showhelp', function(){
	help = $('.help')
	if (!help.is(':visible')){
		help.slideDown();
		$('.showhelp').html('Hide Help')
	}
	else {
		help.slideUp();
		$('.showhelp').html('Show Help')
	}
});

$(function() {
	init();
	$('.viewport').resizable({
		grid:[23,23],
		handles: 'n, e, s, w, ne, se, sw, nw',
		containment: 'parent',
		resize: resized
	});
	$('.ui-resizable-se').removeClass('ui-icon ui-icon-gripsmall-diagonal-se');
	$(window).bind('hashchange',function(){
		init();
		draw();
	});
	draw();
});
