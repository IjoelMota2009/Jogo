// ================== VARIÁVEIS ==================
let caio;
let blocoMeio;
let inventario = [
    { nome: "plataformaMovel", quantidade: 3 }, // você tem 3 para colocar
    { nome: "blocoNormal", quantidade: 10 },    // 10 blocos normais
];
let slotAtivo = 0; // qual item está selecionado na hotbar


// posição e gravidade
let posX = 100;
let posY;
let velY = 0;
let gravidade = 0.8;
let noChao = false;

// dimensões do sprite
const playerW = 100;
const playerH = 100;

// hitbox do personagem
const hitboxW = 50;
const hitboxH = 80;
const hitboxOffsetX = 25;
const hitboxOffsetY = 20;

// ===== PLATAFORMAS =====
let plataformas = [];
let plataformaSelecionada = null;
let offsetX = 0;
let offsetY = 0;
let resizeMode = null; // "move", "w", "h", "both"
let handleSize = 10;

// ===== MODO EDITOR =====
let modoEditor = true;
let ferramentaAtiva = "mover";



// ================== PRELOAD ==================
function preload(){
    blocoMeio = loadImage("blocos img/bloco_meio.png");
    caio = loadImage("persona/Caio.png");
}

// ================== SETUP ==================
function setup() {
    createCanvas(windowWidth, windowHeight);
    posY = height - 150;

     // Plataforma estática
    criarPlataforma(300, 550, 150, 35);

    // Plataforma horizontal que vai e volta
    criarPlataforma(500, 400, 150, 35, {
        dx: 2,      // velocidade horizontal
        minX: 400,  // limite mínimo
        maxX: 700   // limite máximo
    });

    // Plataforma vertical que sobe e desce
    criarPlataforma(800, 300, 150, 35, {
        dy: 1.5,
        minY: 250,
        maxY: 500
    });
}


// ================== DRAW ==================
function draw() {
    background(55,55,55);

    chao();

    

    for (let p of plataformas) {
        desenharPlataforma(p.x, p.y, p.w, p.h);

        // handle de redimensionamento no modo editor
        if (modoEditor && ferramentaAtiva === "redimensionar") {
            fill(255, 0, 0);
            noStroke();
            rect(p.x + p.w - handleSize / 2, p.y + p.h - handleSize / 2, handleSize, handleSize);
        }
    }

    if (!modoEditor) {
        moverPersonagem();
    }

    // seleção da plataforma
    if (modoEditor && plataformaSelecionada) {
        stroke(255, 0, 0);
        noFill();
        rect(plataformaSelecionada.x, plataformaSelecionada.y, plataformaSelecionada.w, plataformaSelecionada.h);
        noStroke();
    }

    personagem();

    // --- INDICADOR DE MODO / FERRAMENTA ---
    fill(0, 0, 0, 150);
    rect(10, 10, 200, 50, 5);
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    text("Modo: " + (modoEditor ? "Editor" : "Jogo"), 20, 15);
    if (modoEditor) {
        text("Ferramenta: " + ferramentaAtiva.charAt(0).toUpperCase() + ferramentaAtiva.slice(1), 20, 35);
    }

    if (modoEditor) desenharHotbar();
}

//                  ---------- funçoes ---------------
function chao() {
   let chaoY = 705;

   for( let x = 0; x < width; x += blocoMeio.width){
    image(blocoMeio, x, chaoY, blocoMeio.width, 50);
   }
}


function personagem() {
    image(caio, posX, posY, playerW, playerH);

    // --- HITBOX PARA AJUSTE ---
    if (modoEditor) {
        noFill();
        stroke(0, 255, 0);
        strokeWeight(2);
        rect(
            posX + hitboxOffsetX,
            posY + hitboxOffsetY,
            hitboxW,
            hitboxH
        );
    }
}

function moverPersonagem() {
    // velocidade desejada
    let vx = 0;
    if (keyIsDown(65) || keyIsDown(37)) vx = -5; // esquerda
    if (keyIsDown(68) || keyIsDown(39)) vx = 5;  // direita

    // aplica gravidade
    velY += gravidade;
    let vy = velY;

    // hitbox atual
    let hbLeft = posX + hitboxOffsetX;
    let hbRight = hbLeft + hitboxW;
    let hbTop = posY + hitboxOffsetY;
    let hbBottom = hbTop + hitboxH;

    noChao = false;

    // mover eixo Y primeiro
    posY += vy;
    hbTop = posY + hitboxOffsetY;
    hbBottom = hbTop + hitboxH;

    for (let p of plataformas) {
    if (!p.dx) p.dx = 0;
    if (!p.dy) p.dy = 0;

    let platTop = p.y;
    let platBottom = p.y + p.h;
    let platLeft = p.x;
    let platRight = p.x + p.w;

    // colisão vertical
    if (hbRight > platLeft && hbLeft < platRight) {
        // caindo
        if (vy > 0 && hbBottom > platTop && hbTop < platTop) {
            posY = platTop - hitboxH - hitboxOffsetY;
            velY = 0;
            noChao = true;

            // mover personagem junto da plataforma
            posX += p.dx;
            posY += p.dy;
        }
        // subindo
        if (vy < 0 && hbTop < platBottom && hbBottom > platBottom) {
            posY = platBottom - hitboxOffsetY;
            velY = 0;
        }
    }

    // --- Movimento das plataformas móveis (corrigido) ---
if (p.dx !== 0) {
    p.x += p.dx;

    // Evita que saia do limite X
    if (p.x < p.minX) {
        p.x = p.minX;
        p.dx *= -1;
    } else if (p.x + p.w > p.maxX) {
        p.x = p.maxX - p.w;
        p.dx *= -1;
    }
}

if (p.dy !== 0) {
    p.y += p.dy;

    // Evita que saia do limite Y
    if (p.y < p.minY) {
        p.y = p.minY;
        p.dy *= -1;
    } else if (p.y + p.h > p.maxY) {
        p.y = p.maxY - p.h;
        p.dy *= -1;
    }
}
}

    // colisão com chão
    let chaoY = 705;
    hbBottom = posY + hitboxOffsetY + hitboxH;
    if (hbBottom >= chaoY) {
        posY = chaoY - hitboxH - hitboxOffsetY;
        velY = 0;
        noChao = true;
    }

    // eixo X (horizontal)
    posX += vx;
    hbLeft = posX + hitboxOffsetX;
    hbRight = hbLeft + hitboxW;

    for (let p of plataformas) {
        let platTop = p.y;
        let platBottom = p.y + p.h;
        let platLeft = p.x;
        let platRight = p.x + p.w;

        // colisão horizontal
        if (hbBottom > platTop && hbTop < platBottom) {
            // esquerda
            if (vx < 0 && hbLeft < platRight && hbRight > platRight) {
                posX = platRight - hitboxOffsetX;
            }
            // direita
            if (vx > 0 && hbRight > platLeft && hbLeft < platLeft) {
                posX = platLeft - hitboxW - hitboxOffsetX;
            }
        }
    }
}

function checarColisaoPlataformas() {
   
    for (let p of plataformas) {
        let playerBottom = posY + playerH;
        let playerTop = posY;
        let playerLeft = posX;
        let playerRight = posX + playerW;

        let platTop = p.y;
        let platBottom = p.y + p.h;
        let platLeft = p.x;
        let platRight = p.x + p.w;

        // colisão de cima (cair na plataforma)
        if (
            playerRight > platLeft &&
            playerLeft < platRight &&
            playerBottom >= platTop &&
            playerTop < platTop
        ) {
            posY = platTop - playerH;
            velY = 0;
            noChao = true;
        }
    }
}

// Função para criar plataformas móveis
function criarPlataforma(x, y, w, h, options = {}) {
    // opções padrão
    let plataforma = {
        x: x,
        y: y,
        w: w,
        h: h,
        dx: options.dx || 0,       // velocidade horizontal
        dy: options.dy || 0,       // velocidade vertical
        minX: options.minX ?? x,   // limite mínimo X
        maxX: options.maxX ?? x,   // limite máximo X
        minY: options.minY ?? y,   // limite mínimo Y
        maxY: options.maxY ?? y    // limite máximo Y
    };
    plataformas.push(plataforma);
    return plataforma;
}

function desenharHotbar() {
    let hotbarX = width / 2 - 455; // centraliza 9 slots de 50px
    let hotbarY = height - 745;
    let slotSize = 70;
    let padding = 15;

    for (let i = 0; i < inventario.length; i++) {
        let slotX = hotbarX + i * (slotSize + padding);

        // fundo do slot
        fill(50);
        if (i === slotAtivo) fill(255, 255, 0); // destaca slot ativo
        rect(slotX, hotbarY, slotSize, slotSize, 5);

        // item dentro do slot
        let item = inventario[i];
        if (item) {
            fill(255);
            textAlign(CENTER, CENTER);
            textSize(12);
            text(item.nome, slotX + slotSize / 2, hotbarY + 15);

            // quantidade
            textSize(14);
            text(item.quantidade, slotX + slotSize / 2, hotbarY + 35);
        }
    }
}
// teclas 

function keyPressed() {
    // alterna modo editor/jogo
    if (key === 'e' || key === 'E') {
        modoEditor = !modoEditor;
    }

    if (modoEditor) {
        // alterna ferramenta
        if (key === 'a' || key === 'A') ferramentaAtiva = "adicionar";
        if (key === 'm' || key === 'M') ferramentaAtiva = "mover";
        if (key === 'r' || key === 'R') ferramentaAtiva = "redimensionar";
        if (key === 'z' || key === 'Z') ferramentaAtiva = "remover";
    } else {
        // pulo do personagem
        if ((key === 'w' || keyCode === UP_ARROW) && noChao) {
            velY = -15;
        }
    }
     if (key >= '1' && key <= String(inventario.length)) {
        slotAtivo = int(key) - 1;
    
        console.log("Slot ativo:", slotAtivo, inventario[slotAtivo].nome);
    }

    
}
// -------------- mouse -------
function mousePressed() {
    if (!modoEditor) return;

    // 🔹 ADICIONAR NOVO BLOCO (só se a ferramenta for "adicionar")
    if (ferramentaAtiva === "adicionar") {
    let item = inventario[slotAtivo];
    if (item && item.quantidade > 0) {
        if (item.nome === "plataformaMovel") {
    plataformas.push({
        x: mouseX,
        y: mouseY,
        w: 150,
        h: 50,
        dx: 1,
        dy: 0,
        minX: mouseX - 100,
        maxX: mouseX + 100,
        adicionado: true,
        nomeItem: item.nome  // <-- adicione esta linha
    });
} else if (item.nome === "blocoNormal") {
    plataformas.push({
        x: mouseX,
        y: mouseY,
        w: 150,
        h: 50,
        adicionado: true,
        nomeItem: item.nome  // <-- adicione esta linha
    });
}
        item.quantidade--;
    
            console.log(item.nome + " adicionado! Restam:", item.quantidade);
        } else {
            console.log("❌ Sem itens desse tipo!");
        }
        return; // impede o resto do código de rodar
    }
    if (ferramentaAtiva === "remover") {
    for (let i = plataformas.length - 1; i >= 0; i--) {
        let p = plataformas[i];
        if (
            mouseX > p.x &&
            mouseX < p.x + p.w &&
            mouseY > p.y &&
            mouseY < p.y + p.h &&
            p.adicionado
        ) {
            // aumenta a quantidade do item no inventario
            let item = inventario.find(it => it.nome === p.nomeItem);
            if (item) {
                item.quantidade++;
            }

            plataformas.splice(i, 1);
            console.log("🗑️ Bloco removido! Quantidade restaurada:", item ? item.quantidade : 0);
            break;
        }
    }
    return;
}

    // 🔹 MOVER OU REDIMENSIONAR
    for (let p of plataformas) {
        if (
            ferramentaAtiva === "redimensionar" &&
            mouseX > p.x + p.w - handleSize &&
            mouseX < p.x + p.w &&
            mouseY > p.y + p.h - handleSize &&
            mouseY < p.y + p.h
        ) {
            plataformaSelecionada = p;
            resizeMode = "both";
            return;
        }

        if (
            ferramentaAtiva === "mover" &&
            mouseX > p.x &&
            mouseX < p.x + p.w &&
            mouseY > p.y &&
            mouseY < p.y + p.h
        ) {
            plataformaSelecionada = p;
            resizeMode = "move";
            offsetX = mouseX - p.x;
            offsetY = mouseY - p.y;
            return;
        }
    }
}

// arrastar plataforma
function mouseDragged() {
    if (!modoEditor || !plataformaSelecionada) return;

    if (resizeMode === "move") {
        plataformaSelecionada.x = mouseX - offsetX;
        plataformaSelecionada.y = mouseY - offsetY;
    } else if (resizeMode === "both") {
        plataformaSelecionada.w = mouseX - plataformaSelecionada.x;
        plataformaSelecionada.h = mouseY - plataformaSelecionada.y;
    }
}



// soltar plataforma
function mouseReleased() {
    plataformaSelecionada = null;
    resizeMode = null;
}

 //-------------plataformas-----------------

    function desenharPlataforma(x, y, largura, altura) {
    let imgW = blocoMeio.width;
    let imgH = blocoMeio.height;

    for (let i = 0; i < largura; i += imgW) {
        for (let j = 0; j < altura; j += imgH) {
            let w = min(imgW, largura - i);
            let h = min(imgH, altura - j);
            image(blocoMeio, x + i, y + j, w, h);
        }
    }
}



