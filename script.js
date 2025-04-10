const REGISTERS = 11;
const MEMORIES = 99;

const FONTSIZE_SENSITIVITY = 3;

var memoryEventTimeout = null;
var memory = new Array(REGISTERS + MEMORIES).fill(0);
var safeParseInt = (str) => {
	if (isNaN(str)) {
		return null;
	}
	return parseInt(str);
};
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
	value;
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
		let val = codeInput.value + "\n";

		let currentStr = "";
		let currentInstruction = 0;
		let phase = 0;
		let maxPhase = 10;
		let seperators = [" ", "\t", "\n"];
		let error = -1;

		for (let i = 0; i < val.length; i++) {
			if (val[i] == ";") {
				seperators = ["\n"];
			}
			else if (seperators.includes(val[i])) {
				if (currentStr != "" && seperators.length > 2) {
					currentStr = currentStr.toUpperCase();
					if (phase == 0) {
						if (!instructions[currentInstruction]) {
							instructions[currentInstruction] = new Instruction();
						}

						if (currentStr[currentStr.length - 1] == ":") {
							instructions[currentInstruction].label = currentStr.slice(0, -1);
							currentStr = "";
							continue;
						}

						if (currentStr == "HALT") {
							maxPhase = 0;
						}
						else if (["B", "BEQ", "BNE", "BGT", "BLT"].includes(currentStr)) {
							maxPhase = 1;
						}
						else if (["LDR", "STR", "MOV", "CMP", "MVN"].includes(currentStr)) {
							maxPhase = 2;
						}
						else if (["ADD", "SUB", "AND", "ORR", "EOR", "LSL", "LSR"].includes(currentStr)) {
							maxPhase = 3;
						}
						else {
							error = i;
							break;
						}
						instructions[currentInstruction].type = currentStr;
					}
					else if (phase == 1) {
						if (currentStr[0] != "R") {
							error = i;
							break;
						}
						instructions[currentInstruction].destination = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
					}
					else if (phase == 2) {
						if (currentStr[0] == "R") {
							instructions[currentInstruction].source = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
						}
						else if (currentStr[0] == "#" && phase == maxPhase) {
							instructions[currentInstruction].value = safeParseInt(currentStr.replace(/^#(\d+),?$/, "$1"));
						}
						else {
							error = i;
							break;
						}
					}
					else if (phase == 3) {
						if (currentStr[0] == "R") {
							instructions[currentInstruction].source2 = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
						}
						else if (currentStr[0] == "#" && phase == maxPhase) {
							instructions[currentInstruction].value = safeParseInt(currentStr.replace(/^#(\d+),?$/, "$1"));
						}
						else {
							error = i;
							break;
						}
					}

					phase++;
					if (phase > maxPhase) {
						console.log(instructions[currentInstruction]); // log
						phase = 0;
						currentInstruction++;
					}
				}

				currentStr = "";
				seperators = [" ", "\t", "\n"];
			}
			else {
				currentStr += val[i];
			}
		}

		let highlight = "";
		for (let i = 0; i < error; i++) {
			highlight += "_";
			if ([" ", "\t", "\n"].includes(val[i])) {
				highlight = highlight.replace(/_/g, "&nbsp;");
			}
		}
		document.querySelector("#highlights").innerHTML = highlight;
	};
};
