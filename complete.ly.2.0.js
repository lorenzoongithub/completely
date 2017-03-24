/**
 * complete.ly 2.0
 * MIT Licensing
 * Copyright (c) 2013 Lorenzo Puccetti
 * 
 * This Software shall be used for doing good things, not bad things.
 * 
 **/

function completely(container, config = {}) {
	if (completely.firstTime === undefined) {
		completely.firstTime = false;

		// If newState is provided add/remove theClass accordingly, otherwise toggle theClass
		completely.toggleClass = (elem, theClass, newState) => {
			const matchRegExp = new RegExp('(?:^|\\s)' + theClass + '(?!\\S)', 'g');
			const add = (arguments.length > 2 ? newState : (elem.className.match(matchRegExp) === null));

			elem.className = elem.className.replace(matchRegExp, ''); // clear all
			if (add) elem.className += ' ' + theClass;
		};

		completely.addCSSRule = rules => {
			const style = document.createElement("style");
			style.appendChild(document.createTextNode("")); // WebKit hack :(
			document.head.appendChild(style);
			const sheet = style.sheet;

			rules.forEach((rule, index) => {
				try {
					if ("insertRule" in sheet) {
						sheet.insertRule(rule.selector + "{" + rule.rule + "}", index);
					} else if ("addRule" in sheet) {
						sheet.addRule(rule.selector, rule.rule, index);
					}
				} catch (e) {
					// firefox can break here          
				}
			});
		};

		// pseudo css cannot be added except by adding a rule
		completely.addCSSRule([{
			selector: '.completelyScrollbar::-webkit-scrollbar',
			rule: 'width: 5px'
		}, {
			selector: '.completelyScrollbar::-webkit-scrollbar-thumb',
			rule: 'background-color:#808080;border-radius:100px'
		}]);
	}
	
	let first, options=[];

	config.fontSize = config.fontSize || '16px';
	config.fontFamily = config.fontFamily || 'sans-serif';
	config.promptInnerHTML = config.promptInnerHTML || '';
	config.color = config.color || 'black';
	config.hintColor = config.hintColor || '#aaa';
	config.backgroundColor = config.backgroundColor || '#fff';
	config.dropDownBorderColor = config.dropDownBorderColor || '#aaa';
	config.dropDownZIndex = config.dropDownZIndex || '100'; // to ensure we are in front of everybody
	config.dropDownOnHoverBackgroundColor = config.dropDownOnHoverBackgroundColor || '#ddd';
	config.forceValid = config.forceValid !== false;
	config.firstLetterUppercase = !!config.firstLetterUppercase;
	config.maxHeight = config.maxHeight || (window.innerHeight || document.documentElement.clientHeight);
  if (config.first) first=config.first;
  if (config.options) options=config.options;
	
	const txtInput = document.createElement('input');
	txtInput.type = 'text';
	txtInput.spellcheck = false;
	txtInput.style.fontSize = config.fontSize;
	txtInput.style.fontFamily = config.fontFamily;
	txtInput.style.color = config.color;
	txtInput.style.backgroundColor = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=)";
	txtInput.style.width = '100%';
	txtInput.style.outline = '0';
	txtInput.style.border = '0';
	txtInput.style.margin = '0';
	txtInput.style.padding = '0';

	const txtHint = txtInput.cloneNode(true);
	txtHint.disabled = '';
	txtHint.style.position = 'absolute';
	txtHint.style.top = '0';
	txtHint.style.left = '0';
	txtHint.style.borderColor = 'transparent';
	txtHint.style.boxShadow = 'none';
	txtHint.style.color = config.hintColor;

	txtInput.style.backgroundColor = 'transparent';
	//txtInput.style.verticalAlign = 'top';
	txtInput.style.position = 'relative';

	txtInput.onclick = () => {
		if (dropDown.style.visibility === 'hidden') {
			txtInput.value=''; 
			rs.repaint();
		}
	}

	// try to find first in options, in not there and force use options[0]
	if (config.forceValid && options.length > 0) {
		let match = first ? options.indexOf(first) !== -1 : false;
		if (!match) first = options[0]; // replace
	}
	txtInput.value = first;
	lastValid = first;

	const wrapper = document.createElement('div');
	wrapper.style.position = 'relative';
	wrapper.style.outline = '0';
	wrapper.style.border = '0';
	wrapper.style.margin = '0';
	wrapper.style.padding = '0';

	const prompt = document.createElement('div');
	prompt.style.position = 'absolute';
	prompt.style.outline = '0';
	prompt.style.margin = '0';
	prompt.style.padding = '0';
	prompt.style.border = '0';
	prompt.style.fontSize = config.fontSize;
	prompt.style.fontFamily = config.fontFamily;
	prompt.style.color = config.color;
	prompt.style.backgroundColor = config.backgroundColor;
	prompt.style.top = '0';
	prompt.style.left = '0';
	prompt.style.overflow = 'hidden';
	prompt.innerHTML = config.promptInnerHTML;
	prompt.style.background = 'transparent';
	if (document.body === undefined) {
		throw 'document.body is undefined. The library was wired up incorrectly.';
	}
	document.body.appendChild(prompt);

	const w = prompt.getBoundingClientRect().right; // works out the width of the prompt.
	wrapper.appendChild(prompt);
	prompt.style.visibility = 'visible';
	prompt.style.left = '-' + w + 'px';
	wrapper.style.marginLeft = w + 'px';

	wrapper.appendChild(txtHint);
	wrapper.appendChild(txtInput);

	wrapper.addEventListener("focusout", () => {
		console.log('focusout');
		dropDownController.hide();
		if (config.forceValid && txtInput.value!==lastValid) rs.setText(lastValid);
	});

	const dropDown = document.createElement('div');
	dropDown.style.position = 'absolute';
	dropDown.style.visibility = 'hidden';
	dropDown.style.outline = '0';
	dropDown.style.margin = '0';
	dropDown.style.padding = '0';
	dropDown.style.textAlign = 'left';
	dropDown.style.fontSize = config.fontSize;
	dropDown.style.fontFamily = config.fontFamily;
	dropDown.style.backgroundColor = config.backgroundColor;
	dropDown.style.zIndex = config.dropDownZIndex;
	dropDown.style.cursor = 'default';
	dropDown.style.borderStyle = 'solid';
	dropDown.style.borderWidth = '1px';
	dropDown.style.borderColor = config.dropDownBorderColor;
	dropDown.style.overflowX = 'hidden';
	dropDown.style.whiteSpace = 'pre';
	completely.toggleClass(dropDown, 'completelyScrollbar', true);

	const createDropDownController = elem => {
		let rows = [];
		let ix = 0;
		let oldIndex = -1;
		let lastValid = '';

		const onMouseOver = function() {
			let index = Array.from(this.parentNode.children).indexOf(this);
			//this.style.outline = '1px solid #ddd';
			p.highlight(index);
		};
		const onMouseOut = function() {
			this.style.outline = '0';
		};
		const onMouseDown = function() {
			p.hide();
			p.onmouseselection(this.__hint);
		};

		let p = {
			hide() {
				elem.style.visibility = 'hidden';
			},
			refresh(token, array) {
				elem.style.visibility = 'hidden';
				ix = 0;
				elem.innerHTML = '';
				const vph = config.maxHeight;
				const rect = elem.parentNode.getBoundingClientRect();
				const distanceToTop = rect.top - 6; // heuristic give 6px 
				const distanceToBottom = vph - rect.bottom - 6; // distance from the browser border.

				rows = [];
				for (let i = 0; i < array.length; i++) {
					if (array[i].indexOf(token) !== 0) {
						continue;
					}
					const divRow = document.createElement('div');
					divRow.style.color = config.color;
					divRow.onmouseover = onMouseOver;
					divRow.onmouseout = onMouseOut;
					divRow.onmousedown = onMouseDown;
					divRow.__hint = array[i];
					divRow.innerHTML = token + array[i].substring(token.length);
					rows.push(divRow);
					elem.appendChild(divRow);
				}
				if (rows.length === 0) {
					return; // nothing to show.
				}
				if (rows.length === 1 && token === rows[0].__hint) {
					return; // do not show the dropDown if it has only one element which matches what we have just displayed.
				}
				dropDown.style.overflowY = rows.length === 1 ? 'hidden' : 'scroll';

				//if (rows.length<2) return; 
				if (rows.length > 0) p.highlight(0);

				if (distanceToTop > distanceToBottom * 3) { // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
					elem.style.maxHeight = distanceToTop + 'px'; // we display the dropDown on the top of the input text
					elem.style.top = '';
					elem.style.bottom = '100%';
				} else {
					elem.style.top = '100%';
					elem.style.bottom = '';
					elem.style.maxHeight = distanceToBottom + 'px';
				}
				elem.style.visibility = 'visible';
				return rows.length;
			},
			highlight(index) {
				if (oldIndex != -1 && rows[oldIndex]) {
					rows[oldIndex].style.backgroundColor = config.backgroundColor;
				}
				rows[index].style.backgroundColor = config.dropDownOnHoverBackgroundColor; // <-- should be config
				
        // make sure row scrolled to is in view
        let rectIndex = rows[index].getBoundingClientRect(), rectDropDown=dropDown.getBoundingClientRect();
        if (rectIndex.bottom > rectDropDown.bottom) rows[index].scrollIntoView(false);
        if (rectIndex.top < rectDropDown.top) rows[index].scrollIntoView();

				oldIndex = index;
			},
			move(step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
				if (elem.style.visibility === 'hidden') return ''; // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
				if (ix + step === -1 || ix + step === rows.length) return rows[ix].__hint; // NO CIRCULAR SCROLLING. 
				ix += step;
				p.highlight(ix);
				return rows[ix].__hint; //txtShadow.value = uRows[uIndex].__hint ;
			},
			onmouseselection() {} // it will be overwritten. 
		};
		return p;
	};

  function checkNotify() {
		setTimeout(() => {
		  if (config.selectionCallback && txtInput.value!=first) config.selectionCallback(txtInput.value);
		}, 30);
  }
	const dropDownController = createDropDownController(dropDown);

	dropDownController.onmouseselection = text => {
		txtInput.value = txtHint.value = leftSide + text;
		rs.onChange(txtInput.value); // <-- forcing it.
		lastValid = txtInput.value;
		scrollLeftEnd();
		registerOnTextChangeOldValue = txtInput.value; // <-- ensure that mouse down will not show the dropDown now.
		setTimeout(() => {
			txtInput.focus();
			checkNotify();
		}, 0);
	};

	wrapper.appendChild(dropDown);
	container.appendChild(wrapper);

	let spacer;
	let leftSide; // <-- it will contain the leftSide part of the textfield (the bit that was already autocompleted)

	function scrollLeftEnd() {
		txtInput.scrollLeft = txtInput.getBoundingClientRect().width;
	}

	function calculateWidthForText(text) {
		if (spacer === undefined) { // on first call only.
			spacer = document.createElement('span');
			spacer.style.visibility = 'hidden';
			spacer.style.position = 'fixed';
			spacer.style.outline = '0';
			spacer.style.margin = '0';
			spacer.style.padding = '0';
			spacer.style.border = '0';
			spacer.style.left = '0';
			spacer.style.whiteSpace = 'pre';
			spacer.style.fontSize = config.fontSize;
			spacer.style.fontFamily = config.fontFamily;
			spacer.style.fontWeight = 'normal';
			document.body.appendChild(spacer);
		}

		// Used to encode an HTML string into a plain text.
		// taken from http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
		spacer.innerHTML = String(text).replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		if (spacer.getBoundingClientRect().right > wrapper.getBoundingClientRect().width)
			return wrapper.getBoundingClientRect().width;
		else return spacer.getBoundingClientRect().right;
	}

	let rs = {
		onArrowDown() {}, // defaults to no action.
		onArrowUp() {}, // defaults to no action.
		onEnter() {}, // defaults to no action.
		onTab() {}, // defaults to no action.
		onChange() {
			if (config.firstLetterUppercase && txtInput.value.length === 1 && txtInput.value != txtInput.value.toUpperCase()) txtInput.value = txtInput.value.toUpperCase();
			rs.repaint();
			// no need for hint if it equals txtInput.value
			if (txtHint.value === txtInput.value) setTimeout(() => txtHint.value = '', 30);
		}, // defaults to repainting.
		startFrom: 0,
		options: options,
		wrapper, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
		input: txtInput, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations) 
		hint: txtHint, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
		dropDown, // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
		prompt,
		setText(text) {
			txtHint.value = '';
			txtInput.value = text;
		},
		getText() {
			return txtInput.value;
		},
		hideDropDown() {
			dropDownController.hide();
		},
		repaint() {
			const text = txtInput.value;
			const startFrom = rs.startFrom;
			const options = rs.options;
			const optionsLength = options.length;

			// breaking text in leftSide and token.
			const token = text.substring(startFrom);
			leftSide = text.substring(0, startFrom);

			// updating the hint. 
			txtHint.value = '';
			for (let i = 0; i < optionsLength; i++) {
				const opt = options[i];
				if (opt.indexOf(token) === 0) { // <-- how about upperCase vs. lowercase
					txtHint.value = leftSide + opt;
					break;
				}
			}
			if (txtHint.value === txtInput.value) txtHint.value = '';

			// moving the dropDown and refreshing it.
			dropDown.style.left = calculateWidthForText(leftSide) + 'px';

			dropDownController.refresh(token, rs.options);
		}
	};

	let registerOnTextChangeOldValue;

	/**
	 * Register a callback function to detect changes to the content of the input-type-text.
	 * Those changes are typically followed by user's action: a key-stroke event but sometimes it might be a mouse click.
	 **/
	const registerOnTextChange = (txt, callback) => {
		registerOnTextChangeOldValue = txt.value;
		const handler = () => {
			const value = txt.value;
			if (registerOnTextChangeOldValue !== value) {
				registerOnTextChangeOldValue = value;
				callback(value);
			}
		};

		//  
		// For user's actions, we listen to both input events and key up events
		// It appears that input events are not enough so we defensively listen to key up events too.
		// source: http://help.dottoro.com/ljhxklln.php
		//
		// The cost of listening to three sources should be negligible as the handler will invoke callback function
		// only if the text.value was effectively changed. 
		//  
		// 
		if (txt.addEventListener) {
			txt.addEventListener("input", handler, false);
			txt.addEventListener('keyup', handler, false);
			txt.addEventListener('change', handler, false);
		} else { // is this a fair assumption: that attachEvent will exist ?
			txt.attachEvent('oninput', handler); // IE<9
			txt.attachEvent('onkeyup', handler); // IE<9
			txt.attachEvent('onchange', handler); // IE<9
		}
	};


	registerOnTextChange(txtInput, text => { // note the function needs to be wrapped as API-users will define their onChange
		rs.onChange(text);
	});


	const keyDownHandler = e => {
		e = e || window.event;
		const keyCode = e.keyCode;

		if (keyCode == 33) {
			return;
		} // page up (do nothing)
		if (keyCode == 34) {
			return;
		} // page down (do nothing);

		if (keyCode == 27) { //escape
			if (config.forceValid) rs.setText(lastValid);
			txtHint.value = ''; // ensure that no hint is left.
			dropDownController.hide();
			txtInput.focus();
			checkNotify();
			return;
		}

		if (keyCode == 39 || keyCode == 35 || keyCode == 9) { // right,  end, tab  (autocomplete triggered)
			if (keyCode == 9) { // for tabs we need to ensure that we override the default behaviour: move to the next focusable HTML-element 
				e.preventDefault();
				e.stopPropagation();
				if (txtHint.value.length === 0) {
					rs.onTab(); // tab was called with no action.
					// users might want to re-enable its default behaviour or handle the call somehow.
				}
			}
			if (txtHint.value.length > 0) { // if there is a hint
				dropDownController.hide();
				txtInput.value = txtHint.value;
				let hasTextChanged = registerOnTextChangeOldValue != txtInput.value;
				registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again. 
				// for example imagine the array contains the following words: bee, beef, beetroot
				// user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
				if (hasTextChanged) {
					rs.onChange(txtInput.value); // <-- forcing it.
					lastValid = txtInput.value;
					scrollLeftEnd();
				}
			}
			checkNotify();
			return;
		}

		if (keyCode == 13) { // enter  (autocomplete triggered)
			if (txtHint.value.length === 0) { // if there is no hint
				if (config.forceValid) rs.setText(lastValid);
				rs.onEnter();
			} else {
				const wasDropDownHidden = (dropDown.style.visibility == 'hidden');
				dropDownController.hide();

				if (wasDropDownHidden) {
					if (config.forceValid) rs.setText(lastValid);
					txtHint.value = txtInput.value; // ensure that no hint is left.
					txtInput.focus();
					rs.onEnter();
				} else {
					txtInput.value = txtHint.value;
					let hasTextChanged = registerOnTextChangeOldValue != txtInput.value;
					registerOnTextChangeOldValue = txtInput.value; // <-- to avoid dropDown to appear again. 
					// for example imagine the array contains the following words: bee, beef, beetroot
					// user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
					if (hasTextChanged) {
						rs.onChange(txtInput.value); // <-- forcing it.
						lastValid = txtInput.value;
						scrollLeftEnd();
					}
				}
			}
			checkNotify();
			return;
		}

		if (keyCode == 40) { // down
			let m = dropDownController.move(+1);
			if (m === '') {
				rs.onArrowDown();
			}
			txtHint.value = leftSide + m;
			return;
		}

		if (keyCode == 38) { // up
			let m = dropDownController.move(-1);
			if (m === '') {
				rs.onArrowUp();
			}
			txtHint.value = leftSide + m;
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		// it's important to reset the txtHint on key down.
		// think: user presses a letter (e.g. 'x') and never releases... you get (xxxxxxxxxxxxxxxxx)
		// and you would see still the hint
		txtHint.value = ''; // resets the txtHint. (it might be updated onKeyUp)

	};

	if (txtInput.addEventListener) {
		txtInput.addEventListener("keydown", keyDownHandler, false);
	} else { // is this a fair assumption: that attachEvent will exist ?
		txtInput.attachEvent('onkeydown', keyDownHandler); // IE<9
	}

	return rs;
}
