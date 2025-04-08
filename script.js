var cloneEnumeratedInnerElement = (element, number) => {
	let html = element.innerHTML;
	element.innerHTML = "";
	for (let i = 0; i < number; i++) {
		element.innerHTML += html.replace(/\$_/g, i);
	}
};

window.onload = () => {
	cloneEnumeratedInnerElement(document.querySelector(".registers"), 11);
	cloneEnumeratedInnerElement(document.querySelector(".memoryLocations"), 99);

	let codeInput = document.querySelector("#inputCode");

	let fontSliderInput = document.querySelector("#fontSize>input");
	let fontSliderText = document.querySelector("#fontSize>a");
	let highlightText = document.querySelector("#highlights");

	fontSliderInput.onchange = () => {
		fontSliderText.innerHTML = fontSliderInput.value / 3;
		codeInput.style = `font-size: ${fontSliderInput.value / 3};`
		highlightText.style = `font-size: ${fontSliderInput.value / 3};`
	};
};
