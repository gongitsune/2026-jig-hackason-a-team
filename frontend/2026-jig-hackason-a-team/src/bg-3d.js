import * as THREE from "https://unpkg.com/three@0.162.0/build/three.module.js";

class Background3D {
	constructor() {
		this.container = document.createElement("div");
		this.container.id = "bg-3d-container";
		this.container.style.position = "fixed";
		this.container.style.top = "0";
		this.container.style.left = "0";
		this.container.style.width = "100%";
		this.container.style.height = "100%";
		this.container.style.zIndex = "-1";
		this.container.style.pointerEvents = "none";
		this.container.style.overflow = "hidden";
		document.body.appendChild(this.container);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xf6f7f8);

		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		this.camera.position.z = 50;

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.container.appendChild(this.renderer.domElement);

		this.words = [
			"ICHIBUN",
			"GRAND PRIX",
			"一文",
			"単語",
			"センス",
			"ひらめき",
			"爆笑",
			"接戦",
			"優勝",
			"投票",
			"? !",
			"WOW",
			"GREAT",
		];
		this.wordObjects = [];

		this.init();
		this.animate();

		window.addEventListener("resize", () => this.onWindowResize());
	}

	createWordTexture(text) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		const fontSize = 64;
		context.font = `bold ${fontSize}px "Lexend", "sans-serif"`;

		const metrics = context.measureText(text);
		canvas.width = metrics.width + 40;
		canvas.height = fontSize + 40;

		context.font = `bold ${fontSize}px "Lexend", "sans-serif"`;
		context.textAlign = "center";
		context.textBaseline = "middle";

		context.fillStyle = "rgba(54, 140, 226, 0.12)";
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		return texture;
	}

	init() {
		const count = 35;
		for (let i = 0; i < count; i++) {
			const word = this.words[Math.floor(Math.random() * this.words.length)];
			const texture = this.createWordTexture(word);

			const material = new THREE.SpriteMaterial({
				map: texture,
				transparent: true,
				opacity: 0.8,
			});
			const sprite = new THREE.Sprite(material);

			const aspect = texture.image.width / texture.image.height;
			const size = 5 + Math.random() * 5;
			sprite.scale.set(aspect * size, size, 1);

			// 位置をランダムに
			sprite.position.x = (Math.random() - 0.5) * 120;
			sprite.position.y = (Math.random() - 0.5) * 80;
			sprite.position.z = (Math.random() - 0.5) * 60;

			sprite.userData = {
				velocity: new THREE.Vector3(
					(Math.random() - 0.5) * 0.04,
					(Math.random() - 0.5) * 0.04,
					(Math.random() - 0.5) * 0.02,
				),
				offset: Math.random() * Math.PI * 2,
			};

			this.scene.add(sprite);
			this.wordObjects.push(sprite);
		}
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	animate() {
		requestAnimationFrame(() => this.animate());

		const time = Date.now() * 0.001;

		this.wordObjects.forEach((sprite) => {
			sprite.position.add(sprite.userData.velocity);

			// 画面外に出たら反対側へ
			if (sprite.position.x > 80) sprite.position.x = -80;
			if (sprite.position.x < -80) sprite.position.x = 80;
			if (sprite.position.y > 60) sprite.position.y = -60;
			if (sprite.position.y < -60) sprite.position.y = 60;
			if (sprite.position.z > 20) sprite.position.z = -80;
			if (sprite.position.z < -80) sprite.position.z = 20;

			// ゆらゆらさせる
			sprite.position.y += Math.sin(time + sprite.userData.offset) * 0.01;
			sprite.position.x += Math.cos(time + sprite.userData.offset) * 0.01;
		});

		this.renderer.render(this.scene, this.camera);
	}
}

if (document.fonts) {
	document.fonts.ready.then(() => {
		new Background3D();
	});
} else {
	new Background3D();
}
