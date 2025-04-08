var cloneEnumeratedInnerElement = (element, number) => {
	let html = element.innerHTML;
	element.innerHTML = "";
	for (let i = 0; i < number; i++) {
		element.innerHTML += html.replace(/\$_/g, i);
	}
};

window.onload = (() => {
	cloneEnumeratedInnerElement(document.querySelector(".registers"), 10);
	cloneEnumeratedInnerElement(document.querySelector(".memoryLocations"), 100);
});
