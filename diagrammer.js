/**
 * Create a new diagram, with toolbars, output, viewport, etc.
 * and bind all the relevant code to mouse clicks.
 */

function create_diagram(width, height) {
	diagram = $('<div class="diagram"/>').html($('#template').html());
	diagram.data('width', width);
	diagram.data('height', height);
	diagram.data('tool', 'black');
	diagram.data('oddcolor', 'black');
	diagram.data('evencolor', 'white');

	labels = diagram.find('select.labels');
	for (var i = 97; i < 123; i++) {
		$('<option>'+String.fromCharCode(i)+'</option>').appendTo(labels);
	}

	moves = diagram.find('select.moves');
	for (var i = 1; i < 11; i++) {
		$('<option>'+i+'</option>').attr('value', i == 10 ? 0 : i).appendTo(moves);
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
			cell = $('<td />').addClass('empty');

			if (col==width-1)  { cell.addClass('right' ); }
			else if (col==0)   { cell.addClass('left'  ); }
			else               { cell.addClass('center'); }

			if (row==height-1) { cell.addClass('bottom'); }
			else if (row==0)   { cell.addClass('top'   ); }
			else               { cell.addClass('middle'); }

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

	diagram.on('click', '.picker', function(){
		switchcolor($(this).closest('.diagram'))
	  	generate_output($(this).closest('.diagram'));
	});

	diagram.on('click', '.close.button', function(){
	  	$(this).closest('.diagram').slideUp(500, function() {$(this).remove();});
	});

	diagram.on('blur', 'input.caption', function(){
		generate_output($(this).closest('.diagram'))
	});

	diagram.on('click', 'button.follow', function() {
		newdiagram = $(this).closest('.diagram').clone(true);
		newdiagram.find('.data tr td').each(function(){
			clear($(this));
		});
		generate_output(newdiagram);
		newdiagram.css('display', 'none');
		$(this).closest('.diagram').after(newdiagram);
		newdiagram.slideDown(1000);
	});

	grid = parseInt($('<div class="board"/>').css('font-size'));

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
		return true // always tengen if available (both sides odd length)
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
	grid = parseInt($('<div class="board"/>').css('font-size'));
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

	// make overlay match viewport
	$(diagram).find('.overlay').css( {
		'width' : viewport.width  + 'em',
		'height': viewport.height + 'em',
		'border-left-width'  : viewport.left   + 'em',
		'border-right-width' : viewport.right  + 'em',
		'border-top-width'   : viewport.top    + 'em',
		'border-bottom-width': viewport.bottom + 'em',
	});

	lines = Array();

	line = diagram.find('.picker').hasClass('black') ? '$$B' : '$$W';
	line += diagram.find('input.coords').is(':checked') ? 'c' : '';
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

function label(cell) {
	if (!$(cell).hasClass('empty')) {
		alert("You can only label empty points. For stones, use markers.")
	}
	else {
		value = $(cell).closest('.diagram').find('.labels').val();
		if ($(cell).data('char') == value) {
			clear(cell);
		}
		else {
			clear(cell);
			$(cell).data('char', value);
			$(cell).append($('<span class="label">'+value+'</span>'))
		}
	}
}

function move(cell) {
	if (! cell.hasClass('empty')) {
		return;
	}
	sel = cell.closest('.diagram').find('.moves option:selected');
	clear(cell)
	cell.data('char', sel.val());
	cell.append($('<span class="move">'+(sel.val()==0?10:sel.val())+'</span>'));

	cell.removeClass('empty').addClass('move ' + (sel.val()%2 ? cell.closest('.diagram').data('oddcolor'):cell.closest('.diagram').data('evencolor')));
	sel.prop('selected', false).next().prop('selected', true);
}

function unmove(cell) {
	if (cell.hasClass('move')) {
		cell.removeClass('black white').addClass('empty');
		clear(cell);
		sel = cell.closest('.diagram').find('.moves option:selected');
		sel.prop('selected', false).prev().prop('selected', true);
	}
}

function switchcolor(diagram) {
	picker = diagram.find('.picker')
	if (picker.hasClass('black')) {
		picker.addClass('white').removeClass('black');
		diagram.data('oddcolor', 'white');
		diagram.data('evencolor', 'black');
	}
	else {
		picker.addClass('black').removeClass('white');  		
		diagram.data('oddcolor', 'black');
		diagram.data('evencolor', 'white');
	}
	diagram.find('td.move').each(function() {
		if ($(this).hasClass('black')) {
			$(this).addClass('white').removeClass('black');
		}
		else {
			$(this).addClass('black').removeClass('white');  			
		}
	});
}

/**
 * When the create button is clicked, add a new diagram to the page with the specified width/height
 */

$(document).on('click', '#create', function(){
	width = Math.max(2, Math.min(50, parseInt($('#width').val())));
	height = Math.max(2, Math.min(50, parseInt($('#height').val())));
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