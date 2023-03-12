// ==UserScript==
// @name         Filter Median XL Runewords
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Filter runewords at https://docs.median-xl.com/doc/items/runewords
// @author       You
// @match        https://docs.median-xl.com/doc/items/runewords
// @icon         https://www.google.com/s2/favicons?sz=64&domain=median-xl.com
// @grant GM_addStyle
// @license MIT
// ==/UserScript==

(function() {
    'use strict';
	
	let getURLText = (uri) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", uri, false);
		xhr.send();
        let el = document.createElement( 'html' );
        el.innerHTML = xhr.response
        return el
	}

    let getRunewords = () => {
		return getURLText("https://docs.median-xl.com/doc/items/runewords");
    }

    let getRunes = () => {
		return getURLText("https://docs.median-xl.com/doc/items/socketables");
    }

	let trimRune = (rune) => rune.trim().replaceAll('\'', '')
	
	let getRuneGroup = (firstRune) => {
		let runesRaw = getRunes()
		let socketables = runesRaw.querySelectorAll('td > span.item-eruneword')
		let elRune = null;
        let runes = [];

		for (let socketable of socketables.values()) {
            let rune = trimRune(socketable.innerText)
            runes.push(rune);
			
			if (rune == firstRune) {
				elRune = socketable
				break;
			}
		}

		if (!elRune) {
			console.log('Missing ' + firstRune + ' rune group')
		}

		return elRune.parentNode.parentNode.parentNode;
	}

    let getRuneNames = () => {
		let rawRunes = [
			getRuneGroup('El'),
			getRuneGroup('Ol'),
			getRuneGroup('Taha'),
			getRuneGroup('Fire'),
		];

		let runeNames = []

		for (let tbody of rawRunes) {
			let runes = tbody.childNodes.values()
			let runesTD = []

			for (let socketable of runes) {
				if (socketable.nodeName == 'TR') {
					runesTD.push(socketable)
				}
			}

			for (let socketable of runesTD) {
				if (socketable.childNodes.length < 4) {
					console.log('Missing socketable name element');
				}
				
				if (socketable.childNodes[3].childNodes.length < 2) {
					console.log('Missing socketable actual name element');
				}
				
				runeNames.push(socketable.childNodes[3].childNodes[1].innerText.trim())
			}
		}

		return runeNames;
	}

	let runeNames = getRuneNames();

	let runesWords = document.querySelectorAll('td > span.item-runeword')

	let raw = localStorage.getItem('selectedRunes')
	let selectedRunes = JSON.parse(raw ? raw : '[]');

	let showByRunes = (runes) => {
		for (let runeWord of runesWords.values()) {
			runeWord.parentNode.parentNode.style.display = "table-row"
		}
		
		if (runes.length == 0) {
			return
		}

		for (let runeWord of runesWords.values()) {
			let runes = trimRune(runeWord.innerText).split(/(?=[A-Z])/)
			let diff = runes.filter(i => !selectedRunes.includes(i))

			if (diff.length != 0) {
				runeWord.parentNode.parentNode.style.display = "none"
			}
		}
	}

	const mainDiv = document.createElement('div')
	mainDiv.id = 'myContainer'

	let showUI2 = () => {
		const grid = document.createElement('div');
		grid.className = 'grid'
		let columns = 10
		let rows = Math.ceil(runeNames.length / columns)
		let index = 0;

		for (var i = 0; i < columns; ++i) {
			var column = document.createElement('div'); // create column
			column.className = 'column';
			for (var j = 0; j < rows; ++j) {
				let nextIndex = j + i * 10

				if (nextIndex >= runeNames.length) {
					break
				}

				let runeName = runeNames[nextIndex]

				const checkBox = document.createElement('input')
				checkBox.type = "checkbox";
				checkBox.checked = selectedRunes.indexOf(runeName) != -1
				checkBox.name = runeName;
				checkBox.value = runeName;
				checkBox.id = runeName;
				checkBox.addEventListener('change', (event) => {
					if (event.currentTarget.checked) {
						selectedRunes.push(runeName);
					} else {
						selectedRunes = selectedRunes.filter(i => i != runeName)
					}
					localStorage.setItem('selectedRunes', JSON.stringify(selectedRunes));
				});

				var label = document.createElement('label')
				label.htmlFor = runeName;
				label.appendChild(document.createTextNode(runeName));

				var row = document.createElement('div'); // create row
				row.className = 'row';
				row.appendChild(checkBox);
				row.appendChild(label);
				column.appendChild(row); // append row in column
			}
			grid.appendChild(column); // append column inside grid
		}

		mainDiv.appendChild(grid)

		let button = document.createElement('button');
		button.id = 'filter-rw';
		button.innerText = 'Filter';
		button.addEventListener("click", (e) => {
			showByRunes(selectedRunes)
		}, false);


		mainDiv.appendChild(button)

		GM_addStyle ( `
			#filter-rw {
				cursor:                 pointer;
				display: block;
			}
			.grid {
				display: flex;   /* <--- required */
				flex-direction: row
			}

			.column {
				flex: 1; /* <--- required (style column to fill the same space as the other columns) */
			}

			.row {
				margin: 2px;
				font-size: 15px;
			}
			` );
	}
	showUI2()

	let addUI = () => {
		if (document.querySelector('div.text_on_the_left > hr') == null) {
			setTimeout(addUI, "1000")
		} else {
			document.querySelector('div.text_on_the_left > hr').before(mainDiv)
		}
	}

	addUI()
})();