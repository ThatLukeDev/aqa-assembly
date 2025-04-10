const REGISTERS = 11;
const MEMORIES = 99;

const FONTSIZE_SENSITIVITY = 3;

var memoryEventTimeout = null;
var memory = new Array(REGISTERS + MEMORIES).fill(0);
var parseByte = (str) => {
	let num = parseInt(str);
	if (num < 0) {
		num = 0;
	}
	if (num > 255) {
		num = 255;
	}
	if (num != num) {
		num = 0;
	}
	return num;
};
var changeMemoryEvent = () => {
	document.querySelectorAll(".register>input").forEach((v) => {
		let num = parseByte(v.value);
		v.value = num;

		let idx = parseInt(v.outerHTML.replace(/.+?Input(\d+).+/, "$1"));
		memory[idx] = num;
	});
	document.querySelectorAll(".memory>input").forEach((v) => {
		let num = parseByte(v.value);
		v.value = num;

		let idx = parseInt(v.outerHTML.replace(/.+?Input(\d+).+/, "$1"));
		memory[REGISTERS + idx] = num;
	});
};
var cloneEnumeratedInnerElement = (element, number, offset) => {
	let html = element.innerHTML;
	element.innerHTML = "";
	for (let i = 0; i < number; i++) {
		element.innerHTML += html.replace(/\$_/g, i);
		element.oninput = () => {
			clearTimeout(memoryEventTimeout);
			memoryEventTimeout = setTimeout(changeMemoryEvent, 1000);
		}
	}
};

class Instruction {
	type;
	destination;
	source;
	source2;
	source2isValue;
	label;
}

window.onload = () => {
	cloneEnumeratedInnerElement(document.querySelector(".registers"), REGISTERS, 0);
	cloneEnumeratedInnerElement(document.querySelector(".memoryLocations"), MEMORIES, REGISTERS);

	document.querySelectorAll(".register>input").forEach((v) => { v.value = 0; });
	document.querySelectorAll(".memory>input").forEach((v) => { v.value = 0; });

	let codeInput = document.querySelector("#inputCode");

	let fontSliderInput = document.querySelector("#fontSize>input");
	let fontSliderText = document.querySelector("#fontSize>a");
	let highlightText = document.querySelector("#highlights");

	fontSliderInput.onchange = () => {
		fontSliderText.innerHTML = fontSliderInput.value / FONTSIZE_SENSITIVITY;
		codeInput.style = `font-size: ${fontSliderInput.value / FONTSIZE_SENSITIVITY};`
		highlightText.style = `font-size: ${fontSliderInput.value / FONTSIZE_SENSITIVITY};`
	};

	var instructions = [];

	codeInput.oninput = () => {
		let currentStr = "";
		let currentInstruction = 0;
		let seperators = [" ", "\t", "\n"];

		for (let i = 0; i < codeInput.value.length; i++) {
			if (codeInput.value[i] == ";") {
				seperators = ["\n"];
			}
			else if (seperators.includes(codeInput.value[i])) {
				if (currentStr != "" && seperators.length > 2) {
					console.log(currentStr);
				}

				currentStr = "";
				seperators = [" ", "\t", "\n"];
			}
			else {
				currentStr += codeInput.value[i];
			}
		}
	};
};
