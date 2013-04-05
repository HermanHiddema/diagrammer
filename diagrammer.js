/**
 * Create a new diagram, with toolbars, output, viewport, etc.
 * and bind all the relevant code to mouse clicks.
 */

var grid = 23;

function create_diagram(width, height) {
	diagram = $('<div class="diagram"/>').html($('#template').html());
	diagram.data('width', width);
	diagram.data('height', height);
	diagram.data('tool', 'black');
	diagram.data('oddcolor', 'black');
	diagram.data('evencolor', 'white');
	diagram.data('label', 'a');
	diagram.data('movenum', '1');
	diagram.data('startnum', '1');

	labels = diagram.find('.settings.labels');
	for (var i = 97; i < 123; i++) {
		$('<div class="sprite label"><span class="letter">'+String.fromCharCode(i)+'</span></div>').appendTo(labels).on('click', 'span', function(){
			set_label($(this).closest('.diagram'), $(this).text());
			$(this).closest('.settings').slideUp();
		});
	}


	moves = diagram.find('.settings.moves');
	for (var i = 1; i < 11; i++) {
		$('<div class="sprite normal move '+(i%2?"black":"white")+'" data-char="'+(i==10?0:i)+'"><span class="number">'+i+'</span></div>').appendTo(moves).on('click', 'span', function(){
			set_movenum($(this).closest('.diagram'), $(this).closest('.move').data('char'));
			$(this).closest('.settings').slideUp();
		});
	}

	diagram.find('.viewport, .grid, .board, .overlay').css({
		'left':0,
		'top':0,
		'width': width + 'em',
		'height': height + 'em'
	});

	table = $('<table />')
	for (row = 0; row < height; row++) {
		table_row = $('<tr />');
		for (col = 0; col < width; col++) {
			cell = $('<td />').addClass('sprite empty');

			if (col==0)        { cell.addClass('left'  ); }
			if (row==0)        { cell.addClass('top'   ); }
			if (col==width-1)  { cell.addClass('right' ); }
			if (row==height-1) { cell.addClass('bottom'); }

			if (is_hoshi(col, row, width-1, height-1)) {
				cell.addClass('hoshi');
				cell.data('char', ',');
			}
			else {
				cell.addClass('normal')
				cell.data('char', '.');				
			}
			table_row.append(cell)
		}
		table.append(table_row)
	}
	diagram.find('.data').html('').append(table)
	diagram.find('div.caption').css('width', (width+1) + 'em').find('input.caption').css('width', '100%')
	diagram.find('.output').attr('rows', height+3).attr('cols', 2*width+6).attr('wrap', 'off').attr('readonly','readonly').on('click', function(){$(this).select();});

	diagram.on('click', 'td', function(){
		tool = $(this).closest('.diagram').data('tool');
		switch(tool) {
			case 'black': black($(this)); break;
			case 'white': white($(this)); break;
			case 'hoshi': hoshi($(this)); break;
			case 'circle':
			case 'cross':
			case 'triangle':
			case 'square': 
			case 'greyed': marker($(this), tool); break;
			case 'label': label($(this)); break;
			case 'move': move($(this)); break;
			case 'toggle': toggle($(this)); break;
		}
		generate_output($(this).closest('.diagram'));
	});

	diagram.on('contextmenu', 'td', function(){
		tool = $(this).closest('.diagram').data('tool');
		switch(tool) {
			case 'black': white($(this)); break;
			case 'white': black($(this)); break;
			case 'move': unmove($(this)); break;
			default: return true;
		}
		generate_output($(this).closest('.diagram'));
		return false;
	});

	diagram.on('click', '.tool', function(){
		if ($(this).hasClass('coords')) {
			generate_output($(this).closest('.diagram'))
			return
		}
		$(this).closest('.tools').find('.tool.active').removeClass('active');
		$(this).closest('.diagram').data('tool', $(this).data('tool'))
		$(this).addClass('active');
	});

	diagram.on('click', '.tool.active, .pref', function() {
		$(this).closest('li').find('.settings').slideToggle()
		return false;
	});

	diagram.on('change', ".moves.settings input.movenum", function() {
		renumber($(this).closest('.diagram'))
		$(this).closest('.settings').slideUp()
	});

	diagram.on('click', ".moves.settings .colorswitch", function(){
		$(this).find('.color').toggleClass('black white');
		switchcolor($(this).closest('.diagram'))
	});

	diagram.on('change', ".tool.coords input.coords", function() {
		generate_output($(this).closest('.diagram'));
	});

	diagram.on('click', '.close.button', function(){
	  	$(this).closest('.diagram').slideUp(500, function() {$(this).remove();});
	});

	diagram.on('keyup', 'input.caption', function(){
		generate_output($(this).closest('.diagram'))
	});

	diagram.on('click', 'button.follow', function() {
		$(this).closest('.diagram').find('.viewport').resizable('destroy');
		newdiagram = $(this).closest('.diagram').clone(true);
		newdiagram.find('.data tr td').each(function(){
			clear($(this));
		});
		newdiagram.find('.labels option').first().prop('selected', true).closest('.label').find('span').text(newdiagram.find('.labels').val());
		newdiagram.find('.moves option').first().prop('selected', true)
		generate_output(newdiagram);
		newdiagram.css('display', 'none');
		$(this).closest('.diagram').after(newdiagram);
		grid = parseInt($('<div class="board"/>').css('font-size'));

		$(this).closest('.diagram').find('.viewport').resizable({
			grid:[grid,grid],
			handles: 'n, e, s, w, ne, se, sw, nw',
			containment: 'parent',
			resize: resized
		});
		newdiagram.find('.viewport').resizable({
			grid:[grid,grid],
			handles: 'n, e, s, w, ne, se, sw, nw',
			containment: 'parent',
			resize: resized
		});
		$(this).closest('.diagram').find('.ui-resizable-se').removeClass('ui-icon ui-icon-gripsmall-diagonal-se');
		newdiagram.find('.ui-resizable-se').removeClass('ui-icon ui-icon-gripsmall-diagonal-se');
		newdiagram.slideDown(1000);
	});

	diagram.find('.viewport').resizable({
		grid:[grid,grid],
		handles: 'n, e, s, w, ne, se, sw, nw',
		containment: 'parent',
		resize: resized
	});
	diagram.find('.ui-resizable-se').removeClass('ui-icon ui-icon-gripsmall-diagonal-se');

	generate_output(diagram);

	return diagram;
}

/**
	Is this a hoshi point?
	x,y,width and height are all 0 based, so the upper left corner of 19x19 is 0,0 on a size 18,18 board
*/

function is_hoshi(x, y, width, height) {
	if (width < 4 || height < 4) {
		return false;
	}
	if (2*x == width && 2*y == height && width == height) {
		return true // tengen on square boards
	}
	w = false;
	h = false;
	if ((width > 10 && (x == 3 || width-x == 3)) || (width > 13 && width == 2*x)) {
		w = true;
	}
	if (width > 6 && width < 11 && (x == 2 || width-x == 2 )) {
		w = true;
	}
	if ((height > 10 && (y == 3 || height-y == 3)) || (height > 13 && height == 2*y)) {
		h = true;
	}
	else if (height > 6 && height < 11 && (y == 2 || height-y == 2)) {
		h = true;
	}
	return h && w;
}

/**
 * Generate the SLtext output
 */

function generate_output(diagram) {
	diagram.find('.settings:visible').not(':animated').slideUp(); // hide visible menus that are not already sliding up
	viewport = {
		width:  Math.round(parseInt(diagram.find('.viewport').css('width'))/grid),
		height: Math.round(parseInt(diagram.find('.viewport').css('height'))/grid),
		left:   Math.round(parseInt(diagram.find('.viewport').css('left'))/grid),
		top:    Math.round(parseInt(diagram.find('.viewport').css('top'))/grid),
	}
	viewport.right = diagram.data('width') - viewport.width - viewport.left,
	viewport.bottom = diagram.data('height') - viewport.height - viewport.top,

	edges = {
		north: parseInt(diagram.find('.viewport').css('top') ) == 0,
		west:  parseInt(diagram.find('.viewport').css('left')) == 0,
		east:  parseInt(diagram.find('.viewport').css('left')) + parseInt(diagram.find('.viewport').css('width') ) == parseInt(diagram.find('.grid').css('width')),
		south: parseInt(diagram.find('.viewport').css('top') ) + parseInt(diagram.find('.viewport').css('height')) == parseInt(diagram.find('.grid').css('height'))
	}

	// coordinates only work if at least two perpendicular edges are selected
	coords = diagram.find('input.coords').is(':checked')  && (edges.north || edges.south) && (edges.west || edges.east);

	// make overlay match viewport
	diagram.find('.overlay').css( {
		'width' : viewport.width  + 'em',
		'height': viewport.height + 'em',
		'border-left-width'  : viewport.left   + 'em',
		'border-right-width' : viewport.right  + 'em',
		'border-top-width'   : viewport.top    + 'em',
		'border-bottom-width': viewport.bottom + 'em',
	});

	lines = Array();

	line = '$$'
	line += diagram.data("oddcolor") == 'black' ? 'B' : 'W';

	if (coords) {
		line += 'c';
		if (edges.south) {
			if (edges.east && !edges.west) {
				line += diagram.data('width');
			}
			numpos = '0 -' + (60-viewport.height) + 'em';
		}
		else {
			if (edges.west) {
				size = diagram.data('height');
			}
			else {
				size = Math.max(parseInt(diagram.data('width')), parseInt(diagram.data('height')));
			}
			line += size
			size = parseInt(size);
			numpos = '0 -' + (60-size) + 'em'
		}

		diagram.find('.numbers').css({
			'height': viewport.height + 'em',
			'background-position': numpos,
		}).show();
		diagram.find('.letters').css({
			'width': (viewport.width) + 'em',
			'background-position':  (0 - viewport.left - 1) + 'em 0',		
		}).show();

	}
	else {
		$(diagram).find('.letters, .numbers').hide();		
	}

	if (diagram.data('startnum') != '1') {
		line += 'm' + diagram.data('startnum');
	}
	line += ' ' + diagram.find('input.caption').val();

	lines.push(line);

	if (edges.north || edges.south) {
		hedge = Array(viewport.width).join('--') + '-'
		if (edges.west) {
			hedge = '+-' + hedge;
		}
		if (edges.east) {
			hedge += '-+';					
		}
		hedge = '$$ ' + hedge;
	} 

	if (edges.north) {
		lines.push(hedge);
	}

	for (r = viewport.top; r < viewport.height + viewport.top; r++) {
		line = '$$'
		if (edges.west) { 
			line += ' |'; 
		}
		for (c = viewport.left; c < viewport.width + viewport.left; c++) {
			cell = diagram.find('.data table')[0].rows[r].cells[c];
			line += ' ' + $(cell).data('char');
		}
		if (edges.east) {
			line += ' |';
		}
		lines.push(line)
	}
	if (edges.south) {
		lines.push(hedge);
	}
	diagram.find('.output').text(lines.join("\n"));
}

function resized() {
	generate_output($(this).closest('.diagram'));
}

function clear(cell) {
	$(cell).removeClass('triangle circle square cross greyed')
	$(cell).html(''); // remove any previous label or move	
	if ($(cell).hasClass('empty')) {
		$(cell).data('char', $(cell).hasClass('hoshi')?',':'.');
	}
	else {
		$(cell).data('char', $(cell).hasClass('black') ? 'X' : 'O');
	}
}

/** 
 * cycles empty -> black -> white -> empty
 */

function black(cell) {
	clear(cell);
	if ($(cell).hasClass('empty')) { 
		$(cell).removeClass('empty').addClass('black').data('char', 'X');
	}
	else if ($(cell).hasClass('black')) {
		$(cell).removeClass('black').addClass('white').data('char', 'O');
	}
	else if ($(cell).hasClass('white')) {
		$(cell).removeClass('white').addClass('empty').data('char', $(cell).hasClass('hoshi') ? ',' : '.');
	}
}

/** 
 * cycles empty -> white -> black -> empty
 */

function white(cell) {
	clear(cell);
	if ($(cell).hasClass('empty')) { 
		$(cell).removeClass('empty').addClass('white').data('char', 'O');
	}
	else if ($(cell).hasClass('white')) {
		$(cell).removeClass('white').addClass('black').data('char', 'X');
	}
	else if ($(cell).hasClass('black')) {
		$(cell).removeClass('black').addClass('empty').data('char', $(cell).hasClass('hoshi') ? ',' : '.');
	}
}

function hoshi(cell) {
	cell.toggleClass('hoshi');
	cell.toggleClass('normal');
	if (cell.hasClass('empty')) {
		cell.data('char', $(cell).hasClass('hoshi') ? ',' : '.');
	}
}

function marker(cell, mark) {
	if ($(cell).hasClass(mark)) {
		clear(cell);
	}
	else {
		clear(cell);
		$(cell).addClass(mark)
		if ($(cell).hasClass('empty')) {
			switch(mark) {
				case 'circle':   $(cell).data('char', "C"); break; 
				case 'cross':    $(cell).data('char', "M"); break;
				case 'triangle': $(cell).data('char', "T"); break;
				case 'square':   $(cell).data('char', "S"); break;
				case 'greyed':   $(cell).data('char', "?"); break;
			}
		}
		else {
			switch(mark) {
				case 'circle':   $(cell).data('char', $(cell).hasClass('black') ? 'B' : 'W'); break; 
				case 'cross':    $(cell).data('char', $(cell).hasClass('black') ? 'Z' : 'P'); break;
				case 'triangle': $(cell).data('char', $(cell).hasClass('black') ? 'Y' : 'Q'); break;
				case 'square':   $(cell).data('char', $(cell).hasClass('black') ? '#' : '@'); break;
			}
		}
	}
}

function set_label(diagram, label) {
	diagram.find('.tool.label span.current').text(label);
	diagram.data('label', label);
}

function set_movenum(diagram, num) {
	num = parseInt(num);
	start = parseInt(diagram.data('startnum'));
	if (num > 10) {
		diagram.data('movenum', '11');
		diagram.find('.tool.move').removeClass('black white').addClass('white');
		diagram.find('.tool.move>span').html('<span style="color: red">&times;</span>');
	}
	else {
		diagram.data('movenum', num);
		diagram.find('.tool.move>span').text(num == 10 ? ((9 + start) %100) : (((num-1) + start) %100));
		diagram.find('.tool.move').removeClass('black white').addClass((num % 2 ? diagram.data('oddcolor'):diagram.data('evencolor')));
	}
}


function label(cell) {
	if (!$(cell).hasClass('empty')) {
		alert("You can only label empty points. For stones, use markers.")
	}
	else {
		value = cell.closest('.diagram').data('label');
		if (cell.data('char') == value) {
			clear(cell);
		}
		else {
			clear(cell);
			cell.data('char', value);
			cell.append($('<span class="letter">'+value+'</span>'))
			next = String.fromCharCode((97 + (((value.charCodeAt(0)) % 32) % 26)))
			set_label(cell.closest('.diagram'), next);
		}
	}
}

function move(cell) {
	if (! cell.hasClass('empty')) {
		return;
	}
	diagram = cell.closest('.diagram');
	num = parseInt(diagram.data('movenum'));
	if (num == 11) {
		alert("You have reached the maximum move number. You cannot have more than 10 numbers in one diagram. To continue, you can create a follow-up diagram.")
	}
	else {
		start = parseInt(diagram.data('startnum'));
		clear(cell)
		cell.data('char', (num%10));
		cell.append($('<span class="number"/>').text(num == 0 ? ((9 + start) %100) : (((num-1) + start) %100)));
		cell.removeClass('empty').addClass('move ' + (num % 2 ? diagram.data('oddcolor'):diagram.data('evencolor')));
		set_movenum(diagram, num+1);
	}
}

function toggle(cell) {
	if (cell.data('char') != '+') {
		clear(cell);
		cell.data('char', '+');
		cell.removeClass('empty black white');
	}
	else {
		cell.addClass('empty');
		cell.data('char', cell.hasClass('hoshi') ? ',' : '.');
	}
	col = cell.parent().children().index(cell);
	cell.next().toggleClass('left');
	cell.prev().toggleClass('right');
	cell.parent().prev().children().eq(col).toggleClass('bottom')
	cell.parent().next().children().eq(col).toggleClass('top')
}

function unmove(cell) {
	if (cell.hasClass('move')) {
		set_movenum(cell.closest('.diagram'), cell.data('char'));
		cell.removeClass('black white').addClass('empty');
		clear(cell);
	}
}

function renumber(diagram) {
	start = parseInt(diagram.find('.moves.settings input.movenum').val());
	if (isNaN(start)) {
		diagram.find('.moves.settings input.movenum').val(diagram.data('startnum'))
		return;
	}
	diagram.data('startnum', start)
	diagram.find('td.move, .moves.settings div.move').each(function(){
		start = parseInt($(this).closest('.diagram').data('startnum'))
		number = parseInt($(this).data('char'))
		if (number == 0) number = 10; 
		mynum = (start + number - 1) % 100;
		if (mynum == 0) mynum = '00';
		$(this).find('span.number').text(mynum);
	})
	set_movenum(diagram, diagram.data('movenum'))
	generate_output(diagram);
}

function switchcolor(diagram) {
	newcolor = diagram.data('evencolor');
	diagram.data('evencolor', diagram.data('oddcolor'));
	diagram.data('oddcolor', newcolor);
	diagram.find('.sprite.move').each(function() {
		$(this).toggleClass('black white');
	});
	generate_output(diagram);
}

/**
 * When the create button is clicked, add a new diagram to the page with the specified width/height
 */

$(document).on('click', '#create', function(){
	width = Math.max(1, Math.min(59, parseInt($('#width').val())));
	height = Math.max(1, Math.min(59, parseInt($('#height').val())));
	diagram = create_diagram(width, height)
	diagram.css('display', 'none').appendTo($('#diagrams')).slideDown(1000);
})

$(document).on('click', '.showhelp', function(){
	if (!$('.help').is(':visible')){
		$('.help').slideDown();
		$('.showhelp').html('Hide Help')
	}
	else {
		$('.help').slideUp();
		$('.showhelp').html('Show Help')
	}
});