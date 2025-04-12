const REGISTERS = 11;
const MEMORIES = 99;

const FONTSIZE_SENSITIVITY = 3;

var memoryEventTimeout = null;
var memory = new Array(REGISTERS + MEMORIES).fill(0);
var safeParseInt = (str) => {
	if (isNaN(str)) {
		return null;
	}
	let val = parseInt(str);
	if (val > 255 || val < 0) {
		return null;
	}
	return val
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
var setMemoryCookies = () => {
	document.cookie = `SCRIPT=${btoa(document.querySelector("#inputCode").value)}`;
	document.cookie = `MEMORY=${btoa(JSON.stringify(memory))}`;
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
	setMemoryCookies();
};
var visualSetChanges = () => {
	document.querySelectorAll(".register>input").forEach((v) => {
		let idx = parseInt(v.outerHTML.replace(/.+?Input(\d+).+/, "$1"));
		v.value = memory[idx];
	});
	document.querySelectorAll(".memory>input").forEach((v) => {
		let idx = parseInt(v.outerHTML.replace(/.+?Input(\d+).+/, "$1"));
		v.value = memory[REGISTERS + idx];
	});
	setMemoryCookies();
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
var saveCode

class Instruction {
	type;
	destination;
	source;
	source2;
	value;
	label;
}

var instructions = [];
var pointer = 0;
var comparison = null;

var branch = (val) => {
	for (let i = 0; i < instructions.length; i++) {
		if (instructions[i].label == val) {
			pointer = i - 1;
		}
	}
};

var step = () => {
	let instruction = instructions[pointer];

	switch (instruction.type) {
		case "LDR":
			memory[instruction.destination] = memory[instruction.value + REGISTERS];
			break;
		case "STR":
			memory[instruction.value + REGISTERS] = memory[instruction.destination];
			break;
		case "ADD":
			memory[instruction.destination] = memory[instruction.source] + (instruction.value != null ? instruction.value : memory[instruction.source2]);
			break;
		case "SUB":
			memory[instruction.destination] = memory[instruction.source] - (instruction.value != null ? instruction.value : memory[instruction.source2]);
			break;
		case "MOV":
			memory[instruction.destination] = instruction.value != null ? instruction.value : memory[instruction.source];
			break;
		case "CMP":
			comparison = memory[instruction.destination] - (instruction.value != null ? instruction.value : memory[instruction.source]);
			break;
		case "B":
			branch(instruction.value);
			break;
		case "BEQ":
			if (comparison == 0) {
				branch(instruction.value);
			}
			break;
		case "BNE":
			if (comparison != 0) {
				branch(instruction.value);
			}
			break;
		case "BLT":
			if (comparison < 0) {
				branch(instruction.value);
			}
			break;
		case "BGT":
			if (comparison > 0) {
				branch(instruction.value);
			}
			break;
		case "AND":
			memory[instruction.destination] = memory[instruction.source] & (instruction.value != null ? instruction.value : memory[instruction.source2]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
		case "ORR":
			memory[instruction.destination] = memory[instruction.source] | (instruction.value != null ? instruction.value : memory[instruction.source2]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
		case "EOR":
			memory[instruction.destination] = memory[instruction.source] ^ (instruction.value != null ? instruction.value : memory[instruction.source2]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
		case "MVN":
			memory[instruction.destination] = ~(instruction.value != null ? instruction.value : memory[instruction.source]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
		case "LSL":
			memory[instruction.destination] = memory[instruction.source] << (instruction.value != null ? instruction.value : memory[instruction.source2]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
		case "LSR":
			memory[instruction.destination] = memory[instruction.source] >> (instruction.value != null ? instruction.value : memory[instruction.source2]);
			memory[instruction.destination] = memory[instruction.destination] & 255;
			break;
	}

	pointer++;

	visualSetChanges();
};

var checkSyntax = (val) => {
	let currentStr = "";
	let currentInstruction = 0;
	let phase = 0;
	let maxPhase = 10;
	let seperators = [" ", "\t", "\n"];
	let error = -1;

	instructions = [];

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

					if (["HALT"].includes(currentStr)) {
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
					if (["B", "BEQ", "BNE", "BGT", "BLT"].includes(instructions[currentInstruction].type)) {
						instructions[currentInstruction].value = currentStr;
					}
					else {
						if (currentStr[0] != "R") {
							error = i;
							break;
						}
						let instrVal = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
						if (instrVal == null || instrVal >= REGISTERS) {
							error = i;
							break;
						}
						instructions[currentInstruction].destination = instrVal;
					}
				}
				else if (phase == 2) {
					if (currentStr[0] == "R") {
						let instrVal = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
						if (instrVal == null || instrVal >= REGISTERS) {
							error = i;
							break;
						}
						instructions[currentInstruction].source = instrVal;
					}
					else if (currentStr[0] == "#" && phase == maxPhase) {
						let instrVal = safeParseInt(currentStr.replace(/^#(\d+),?$/, "$1"));
						if (instrVal == null) {
							error = i;
							break;
						}
						instructions[currentInstruction].value = instrVal;
					}
					else if (["LDR", "STR"].includes(instructions[currentInstruction].type)) {
						let instrVal = safeParseInt(currentStr.replace(/^(\d+),?$/, "$1"));
						if (instrVal == null) {
							error = i;
							break;
						}
						instructions[currentInstruction].value = instrVal;
					}
					else {
						error = i;
						break;
					}
				}
				else if (phase == 3) {
					if (currentStr[0] == "R") {
						let instrVal = safeParseInt(currentStr.replace(/^R(\d+),?$/, "$1"));
						if (instrVal == null || instrVal >= REGISTERS) {
							error = i;
							break;
						}
						instructions[currentInstruction].source2 = instrVal;
					}
					else if (currentStr[0] == "#" && phase == maxPhase) {
						let instrVal = safeParseInt(currentStr.replace(/^#(\d+),?$/, "$1"));
						if (instrVal == null) {
							error = i;
							break;
						}
						instructions[currentInstruction].value = instrVal;
					}
					else {
						error = i;
						break;
					}
				}

				phase++;
				if (phase > maxPhase) {
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
			if (val[i] == "\n") {
				highlight += "<br>";
			}
		}
	}
	document.querySelector("#highlights").innerHTML = highlight;
};

cloneEnumeratedInnerElement(document.querySelector(".registers"), REGISTERS, 0);
cloneEnumeratedInnerElement(document.querySelector(".memoryLocations"), MEMORIES, REGISTERS);

document.querySelectorAll(".register>input").forEach((v) => { v.value = 0; });
document.querySelectorAll(".memory>input").forEach((v) => { v.value = 0; });

let codeInput = document.querySelector("#inputCode");

let stepBtn = document.querySelector("#stepCode");
let resetBtn = document.querySelector("#resetCode");
let resetRegBtn = document.querySelector("#resetRegCode");
let resetAllBtn = document.querySelector("#resetAllCode");
let runBtn = document.querySelector("#runCode");

let fontSliderInput = document.querySelector("#fontSize>input");
let fontSliderText = document.querySelector("#fontSize>a");
let highlightText = document.querySelector("#highlights");

let codeSaveBtn = document.querySelector("#saveCode");
let codeLoadBtn = document.querySelector("#loadCode");

fontSliderInput.onchange = () => {
	fontSliderText.innerHTML = fontSliderInput.value / FONTSIZE_SENSITIVITY;
	codeInput.style = `font-size: ${fontSliderInput.value / FONTSIZE_SENSITIVITY};`
	highlightText.style = `font-size: ${fontSliderInput.value / FONTSIZE_SENSITIVITY};`
};

stepBtn.onclick = () => {
	step();
};
resetBtn.onclick = () => {
	for (let i = 0; i < REGISTERS; i++) {
		memory[i] = 0;
	}
	pointer = 0;
	comparison = null;
	visualSetChanges();
};
resetRegBtn.onclick = () => {
	for (let i = 0; i < REGISTERS; i++) {
		memory[i] = 0;
	}
	visualSetChanges();
};
resetAllBtn.onclick = () => {
	pointer = 0;
	comparison = null;
	memory = new Array(REGISTERS + MEMORIES).fill(0);
	visualSetChanges();
};
runBtn.onclick = () => {
	pointer = 0;
	for (let i = 0; i < REGISTERS; i++) {
		memory[i] = 0;
	}
	let iterations = 0;
	while (instructions[pointer] != null && instructions[pointer].type != "HALT") {
		step();
		iterations++;
		if (iterations > 1000) {
			alert("over 1000 iterations, i think ur code is a tad off there mate.");
			break;
		}
	}
};
codeSaveBtn.onclick = () => {
    const codeContent = document.querySelector("#inputCode").value;
    const blob = new Blob([codeContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "code.txt";
    link.click();
    URL.revokeObjectURL(link.href);
};
codeLoadBtn.onclick = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".txt";
	input.onchange = (event) => {
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			codeInput.value = e.target.result;
			checkSyntax(codeInput.value + "\n");
			setMemoryCookies();
		};
		reader.readAsText(file);
	};
	input.click();
};


codeInput.oninput = () => {
	checkSyntax(codeInput.value + "\n");
	setMemoryCookies();
};

if (document.cookie.includes("SCRIPT")) {
	codeInput.value = atob(document.cookie.replace(/^.*SCRIPT=(.+);.*$/, "$1").replace(/^.*SCRIPT=(.+)$/, "$1"));
}
if (document.cookie.includes("MEMORY")) {
	memory = JSON.parse(atob(document.cookie.replace(/^.*MEMORY=(.+);.*$/, "$1").replace(/^.*MEMORY=(.+)$/, "$1")));
	visualSetChanges();
}

checkSyntax(codeInput.value + "\n");
