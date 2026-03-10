import roughjs from "https://cdn.jsdelivr.net/npm/roughjs@4.6.6/+esm";

// カード要素
const updateCardSvg = (svg, card) => {
	svg.setAttribute("width", card.offsetWidth);
	svg.setAttribute("height", card.offsetHeight);
	svg.style.position = "absolute";
	svg.style.top = "0";
	svg.style.left = "0";
	svg.style.pointerEvents = "none";

	const rc = roughjs.svg(svg);
	const rect = rc.rectangle(
		5,
		5,
		card.offsetWidth - 10,
		card.offsetHeight - 10,
		{
			roughness: 2.5,
			stroke: "#555",
			strokeWidth: 2,
			hachureAngle: 60,
		},
	);

	svg.appendChild(rect);
};
const cardResizeObserver = new ResizeObserver((entries) => {
	for (const entry of entries) {
		const card = entry.target;
		const svg = card.querySelector("svg");

		if (svg) {
			svg.innerHTML = "";
			updateCardSvg(svg, card);
		}
	}
});
document.querySelectorAll(".card").forEach((card) => {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	card.appendChild(svg);

	updateCardSvg(svg, card);
	cardResizeObserver.observe(card);
});
