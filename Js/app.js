const originalTitle = document.title;
let storedTitle = originalTitle;

window.addEventListener("blur", () => {
    storedTitle = document.title;
    document.title = "Para mi nanis";
});

window.addEventListener("focus", () => {
    document.title = storedTitle;
});

const titleElement = document.getElementById("Titulo");
const textTarget = document.getElementById("Text");
const canvas = document.getElementById("Flor");
const canvasShell = document.querySelector(".canvas-shell");
const ctx = canvas.getContext("2d");

const puzzleIntro = document.getElementById("PuzzleIntro");
const puzzleBody = document.getElementById("PuzzleBody");
const questionCounter = document.getElementById("QuestionCounter");
const petalCounter = document.getElementById("PetalCounter");
const questionText = document.getElementById("QuestionText");
const answerInput = document.getElementById("AnswerInput");
const submitAnswer = document.getElementById("SubmitAnswer");
const feedback = document.getElementById("Feedback");
const resetPuzzle = document.getElementById("ResetPuzzle");
const heroStartButton = document.getElementById("B1");
const puzzleStartButton = document.getElementById("PuzzleStart");

const randomLines = [
];

// Puedes editar estas preguntas y respuestas para personalizar el juego.
const questionList = [
    {
        prompt: "¿Cómo te gusta llamarme?",
        answer: "betito",
        successLine: "Tus ojitos los mas lindos.",
        petals: 1
    },
    {
        prompt: "¿Donde fuimos en nuestra primera cita?",
        answer: "cine",
        successLine: "Tus labios pequeños tan bonitos",
        petals: 1
    },
    {
        prompt: "Como se llaman las primeras flores que te regale?",
        answer: "tulipanes",
        successLine: "Exacto, todo se vuelve mas bonito a tu lado",
        petals: 1
    },
    {
        prompt: "Cual es mi color favorito?",
        answer: "verde",
        successLine: "tan linda desde el primer dia que te vi!",
        petals: 1
    },
    {
        prompt: "Como me gusta decirte?",
        answer: "amor",
        successLine: "Me gustas mucho mi amor, me gustas mucho mi bb",
        petals: 10
    }
];

const flowers = [];
const sparks = [];
let lastFrameTime = 0;
let resizeTimer;
let currentQuestionIndex = 0;
let earnedFlowers = 0;
let puzzleFinished = false;

class Flower {
    constructor(x, y) {
        this.x = x;
        this.baseY = y;
        this.radius = randomBetween(16, 38);
        this.petalCount = Math.floor(randomBetween(6, 9));
        this.rotation = Math.random() * Math.PI;
        this.scale = 0;
        this.life = 0;
        this.floatSpeed = randomBetween(0.001, 0.0022);
        this.floatRange = randomBetween(3, 8);
        this.growSpeed = randomBetween(0.0012, 0.0021);
        this.hue = randomBetween(40, 55);
    }

    update(delta) {
        this.life += delta;
        this.scale = Math.min(1, this.scale + delta * this.growSpeed);
        this.rotation += delta * 0.0002;
    }

    draw(ctx) {
        const offset = Math.sin(this.life * this.floatSpeed) * this.floatRange;
        const currentY = this.baseY + offset;
        const softGlow = "rgba(255, 230, 170, " + (0.2 * this.scale) + ")";
        const glow = ctx.createRadialGradient(this.x, currentY, 0, this.x, currentY, this.radius * 2);
        glow.addColorStop(0, softGlow);
        glow.addColorStop(1, "transparent");

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, currentY, this.radius * 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, currentY);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = 0.85;

        const petalRadius = this.radius;
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (Math.PI * 2 / this.petalCount) * i;
            ctx.save();
            ctx.rotate(angle);
            const gradient = ctx.createLinearGradient(0, 0, petalRadius * 1.5, 0);
            gradient.addColorStop(0, "hsl(" + this.hue + ", 95%, 68%)");
            gradient.addColorStop(1, "hsl(" + (this.hue - 5) + ", 90%, 52%)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(petalRadius * 0.6, petalRadius * 0.1, 0, petalRadius * 1.8);
            ctx.quadraticCurveTo(-petalRadius * 0.6, petalRadius * 0.1, 0, 0);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = "#fff9d7";
        ctx.beginPath();
        ctx.arc(0, 0, petalRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = "rgba(40, 142, 96, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, currentY + petalRadius * 0.8);
        ctx.lineTo(this.x, currentY + petalRadius * 2.8);
        ctx.stroke();
        ctx.restore();
    }
}

class Spark {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = randomBetween(2, 4);
        this.life = 0;
        this.maxLife = randomBetween(900, 1500);
    }

    update(delta) {
        this.life += delta;
        this.y -= delta * 0.02;
    }

    get finished() {
        return this.life >= this.maxLife;
    }

    draw(ctx) {
        const alpha = Math.max(0, 1 - this.life / this.maxLife);
        ctx.save();
        ctx.fillStyle = "rgba(255, 225, 161, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function resizeCanvas() {
    const bounds = canvasShell.getBoundingClientRect();
    canvas.width = Math.floor(bounds.width);
    canvas.height = Math.floor(bounds.height);
}

resizeCanvas();
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCanvas();
        redrawGarden();
    }, 120);
});

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1d0b3d");
    gradient.addColorStop(0.55, "#2f165d");
    gradient.addColorStop(1, "#060f1d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = "rgba(8, 38, 90, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.85);
    ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height * 0.75, canvas.width * 0.5, canvas.height * 0.9);
    ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height, canvas.width, canvas.height * 0.82);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function scatterBlooms(amount = 1, area = "random") {
    for (let i = 0; i < amount; i++) {
        let x = randomBetween(50, canvas.width - 50);
        let y = randomBetween(canvas.height * 0.35, canvas.height * 0.8);
        if (area === "center") {
            x = canvas.width * 0.4 + Math.random() * canvas.width * 0.2;
            y = canvas.height * 0.45 + Math.random() * canvas.height * 0.2;
        }
        flowers.push(new Flower(x, y));
        sparks.push(new Spark(x, y));
    }
}

function redrawGarden() {
    flowers.length = 0;
    sparks.length = 0;
}

function animateGarden(timestamp = 0) {
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    drawBackground();

    flowers.forEach((flower) => flower.update(delta));
    flowers.forEach((flower) => flower.draw(ctx));

    sparks.forEach((spark) => spark.update(delta));
    sparks.forEach((spark) => spark.draw(ctx));
    for (let i = sparks.length - 1; i >= 0; i--) {
        if (sparks[i].finished) {
            sparks.splice(i, 1);
        }
    }

    requestAnimationFrame(animateGarden);
}

requestAnimationFrame(animateGarden);

function updateMessage(newText) {
    const text = newText || randomLines[Math.floor(Math.random() * randomLines.length)];
    textTarget.textContent = text;
}

function glowTitle() {
    titleElement.classList.add("is-glow");
    setTimeout(() => titleElement.classList.remove("is-glow"), 1200);
}

function normalizeAnswer(value) {
    return value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9ñ ]/g, "")
        .trim();
}

function matchesAnswer(userValue, expected) {
    if (Array.isArray(expected)) {
        return expected.some((ans) => normalizeAnswer(ans) === normalizeAnswer(userValue));
    }
    return normalizeAnswer(expected) === normalizeAnswer(userValue);
}

function loadQuestion() {
    const total = questionList.length;
    const question = questionList[currentQuestionIndex];
    questionCounter.textContent = "Pregunta " + (currentQuestionIndex + 1) + " de " + total;
    questionText.textContent = question.prompt;
    feedback.textContent = "";
    feedback.classList.remove("is-error", "is-success");
    answerInput.value = "";
    answerInput.disabled = false;
    submitAnswer.disabled = false;
    answerInput.focus();
}

function updatePetalCounter() {
    petalCounter.textContent = "Flores: " + earnedFlowers;
}

function startPuzzle() {
    if (!puzzleBody || !puzzleIntro) return;
    puzzleIntro.hidden = true;
    puzzleBody.hidden = false;
    currentQuestionIndex = 0;
    earnedFlowers = 0;
    puzzleFinished = false;
    redrawGarden();
    updatePetalCounter();
    loadQuestion();
    updateMessage("El rompecorazones ya está abierto para ti.");
    glowTitle();
}

function handleCorrect(question) {
    const petalsAward = question.petals || 1;
    scatterBlooms(petalsAward, petalsAward > 1 ? "random" : "center");
    earnedFlowers += petalsAward;
    updatePetalCounter();
    feedback.textContent = question.successLine || "Respuesta correcta!";
    feedback.classList.add("is-success");
    feedback.classList.remove("is-error");
    updateMessage(question.successLine || "Respiramos amor dorado.");
    glowTitle();
}

function finishPuzzle() {
    puzzleFinished = true;
    answerInput.disabled = true;
    submitAnswer.disabled = true;
    feedback.textContent += " ";
    updateMessage("");
}

function processAnswer() {
    if (!answerInput || !questionList[currentQuestionIndex]) return;
    if (puzzleFinished) return;

    const userValue = answerInput.value;
    if (!userValue.trim()) {
        feedback.textContent = "Escribe tu respuesta hermosa antes de continuar.";
        feedback.classList.add("is-error");
        feedback.classList.remove("is-success");
        return;
    }

    const currentQuestion = questionList[currentQuestionIndex];
    const isCorrect = matchesAnswer(userValue, currentQuestion.answer);

    if (!isCorrect) {
        feedback.textContent = "Mmm... inténtalo otra vez";
        feedback.classList.add("is-error");
        feedback.classList.remove("is-success");
        return;
    }

    handleCorrect(currentQuestion);

    if (currentQuestionIndex >= questionList.length - 1) {
        finishPuzzle();
        return;
    }

    currentQuestionIndex += 1;
    setTimeout(() => loadQuestion(), 900);
}

function resetPuzzleFlow() {
    puzzleIntro.hidden = false;
    puzzleBody.hidden = true;
    puzzleFinished = false;
    currentQuestionIndex = 0;
    earnedFlowers = 0;
    updatePetalCounter();
    feedback.textContent = "";
    feedback.classList.remove("is-error", "is-success");
    redrawGarden();
    updateMessage("Reinicié el campo para volver a jugar.");
}

heroStartButton?.addEventListener("click", () => {
    startPuzzle();
    document.getElementById("PuzzleArea")?.scrollIntoView({ behavior: "smooth" });
});

puzzleStartButton?.addEventListener("click", () => {
    startPuzzle();
});

submitAnswer?.addEventListener("click", processAnswer);
answerInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        processAnswer();
    }
});

resetPuzzle?.addEventListener("click", resetPuzzleFlow);

canvas.addEventListener("mousemove", (() => {
    let lastTrail = 0;
    return (event) => {
        const now = Date.now();
        if (now - lastTrail < 120) return;
        lastTrail = now;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        sparks.push(new Spark(x, y));
    };
})());

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    flowers.push(new Flower(x, y));
    sparks.push(new Spark(x, y));
    updateMessage("Dejaste caer otra pista.");
});
