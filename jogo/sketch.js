// ================== VARIÁVEIS ==================
let caio;
let blocoMeio;
let pedra;
let olhandoEsquerda = false;
let frameSize = 100; 
let runFrame = 0;
let frameDelay = 6;
let frameCountAnim = 0;
let idleSheet;
let idleFrame = 0;
const idleFrameSize = 100;
let idleDelay = 12;
let idleCounter = 0;
let jumpImg;
let lastJumpPress = 0;
const JUMP_BUFFER = 120; // ms pra "guardar" o comando de pulo
const COYOTE_TIME = 120; // ms que pode pular após cair
const jumpForce = -20;   // força do pulo


let inventario = [
    { nome: "plataformaMovel", quantidade: 0 },
    { nome: "blocoNormal", quantidade: 0 },
    { nome: "puzzleBlock", quantidade: 0 } // blocos que o jogador coleta (9 no total espalhados)
];
let slotAtivo = 0; // qual item está selecionado na hotbar

// ENERGIA
let energiaMax = 100;
let energia = energiaMax;
let custoEditar = 10; // cada vez que ativa o editor consome 10

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
let modoEditor = false;
let ferramentaAtiva = "mover";

// ===== MAPA / CÂMERA =====
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 800; // canvas height
let camX = 0;

// ===== COLETÁVEIS / CHAVE / SAÍDA / PUZZLES =====
let colecionaveis = []; // 9 itens espalhados
let chave = { x: WORLD_WIDTH - 200, y: 300, r: 14, collected: false, active: false }; // chave só aparece quando pegar todos os puzzleBlocks
let saida = { x: WORLD_WIDTH - 120, y: 220, w: 60, h: 80, active: false }; // saída final
let venceu = false;

let posicoesAlvo = [
  { x: 90, y: 350, w: 160, h: 50, ok: false },
  { x: 1500, y: 350, w: 150, h: 50, ok: false },
  { x: 2300, y: 300, w: 150, h: 50, ok: false }
];

let puzzlesCompletos = 0; // conta quantos alvos foram completados (recarrega energia a cada 3)

// ================== PRELOAD ==================
function preload(){
    blocoMeio = loadImage("blocos img/bloco_meio.png");
    caio = loadImage("persona/Caio.png");
    pedra = loadImage("blocos img/pedra.png");
    runSheet = loadImage("persona/Caio-Sp.png");
    idleSheet = loadImage("persona/Caio-Pa.png");
    jumpImg = loadImage("persona/Caio-Pu.png");
}

// ================== SETUP ==================
function setup() {
    createCanvas(windowWidth, WORLD_HEIGHT);
    posY = height - 150;

    // cria mapa base (plataformas iniciais). Mantive as plataformas que você já tinha e adicionei mais espalhadas
criarPlataforma(800, 300, 150, 35, { textura: "pedra" });
criarPlataforma(110, 450, 150, 35, { dx: 2, minX: 290, maxX: 700, textura: "blocoMeio" });
criarPlataforma(1150, 200, 80, 35, { textura: "pedra" });
criarPlataforma(900, 500, 150, 35, { dy: 1.5, minY: 250, maxY: 500, textura: "blocoMeio" });

criarPlataforma(1200, 520, 150, 35, { textura: "pedra" });
criarPlataforma(1400, 380, 150, 35, { dx: 1.5, minX: 1400, maxX: 1600, textura: "pedra" });
criarPlataforma(1600, 300, 150, 35, { textura: "pedra" });

criarPlataforma(2000, 520, 200, 35, { textura: "blocoMeio" });
criarPlataforma(2400, 420, 180, 35, { textura: "blocoMeio" });
criarPlataforma(2600, 320, 180, 35, { textura: "blocoMeio" });
    // colecionáveis (9 espalhados pelo mapa)
    colecionaveis = [
        { x: 1290, y: 670, w: 30, h: 30, color: [200, 50, 50], collected: false },
        { x: 450, y: 60, w: 30, h: 30, color: [50, 200, 50], collected: false },
        { x: 920, y: 280, w: 30, h: 30, color: [50, 100, 200], collected: false },

        { x: 1250, y: 480, w: 30, h: 30, color: [200, 150, 50], collected: false },
        { x: 1470, y: 340, w: 30, h: 30, color: [180, 50, 200], collected: false },
        { x: 1700, y: 260, w: 30, h: 30, color: [50, 200, 180], collected: false },

        { x: 2150, y: 500, w: 30, h: 30, color: [220, 100, 100], collected: false },
        { x: 2450, y: 380, w: 30, h: 30, color: [100, 220, 120], collected: false },
        { x: 2700, y: 280, w: 30, h: 30, color: [120, 140, 220], collected: false }
    ];
}

// ================== DRAW ==================
function draw() {
  // fundo
  background(55);

  // atualiza camera para seguir jogador
  camX = constrain(posX - width / 2, 0, WORLD_WIDTH - width);

  // tudo que desenha em mundo vai aqui
  push();
  translate(-camX, 0);

  // chão e plataformas
  chao();
  for (let p of plataformas) desenharPlataforma(p.x, p.y, p.w, p.h, p.textura);

  // atualiza movimento das plataformas móveis
  atualizarPlataformas();

  // elementos do jogo
  desenharAlvos();
  checarBlocosNosAlvos();
  verificarAlvosCompletos();
  desenharColecionaveis();
  desenharChave();
  desenharSaida();

  // editor highlight (se houver)
  if (modoEditor && plataformaSelecionada) {
    stroke(255, 0, 0);
    noFill();
    rect(plataformaSelecionada.x, plataformaSelecionada.y, plataformaSelecionada.w, plataformaSelecionada.h);
    noStroke();
  }

  // física e movimento (aplica primeiro para atualizar posY antes de desenhar)
  if (!modoEditor) moverPersonagem();

  // ===== PLAYER SPRITE & ANIMAÇÃO =====
  // detectar movimento de teclas (usado só para decidir "isMoving")
  let isMoving = keyIsDown(65) || keyIsDown(37) || keyIsDown(68) || keyIsDown(39);

  // quais sprites usar e qual coluna (sx) cortar da sprite sheet
  let spriteSheetToDraw;
  let sx = 0;

  // número de frames nas sheets (calcula a partir da largura)
  let runFrames = runSheet ? Math.floor(runSheet.width / frameSize) : 4;
  let idleFrames = idleSheet ? Math.floor(idleSheet.width / frameSize) : 4;

  // Prioridade: pulo (subindo) -> queda -> idle -> corrida
  if (!noChao && velY < 0) {
    // PULO (subindo)
    spriteSheetToDraw = jumpImg;
    sx = 0; // frame único de pulo
  } else if (!noChao && velY > 2) {
    // QUEDA — usa a sheet de idle como fallback (ou um sprite de queda se tiver)
    spriteSheetToDraw = idleSheet;
    // animação leve de "queda" usando idle frames
    idleCounter++;
    if (idleCounter >= idleDelay) {
      idleFrame = (idleFrame + 1) % idleFrames;
      idleCounter = 0;
    }
    sx = idleFrame * frameSize;
  } else if (!isMoving && noChao) {
    // IDLE
    spriteSheetToDraw = idleSheet;
    idleCounter++;
    if (idleCounter >= idleDelay) {
      idleFrame = (idleFrame + 1) % idleFrames;
      idleCounter = 0;
    }
    sx = idleFrame * frameSize;
  } else {
    // CORRIDA
    spriteSheetToDraw = runSheet;
    frameCountAnim++;
    if (frameCountAnim >= frameDelay) {
      runFrame = (runFrame + 1) % runFrames;
      frameCountAnim = 0;
    }
    sx = runFrame * frameSize;
  }

  // Desenha o personagem com flip corretamente
  push();
  translate(posX, posY);

  if (olhandoEsquerda) {
    // flip horizontal: desenha a imagem virada
    // Usando mesma assinatura que você já usava para crop:
    // image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
    // mas para compatibilidade entre versões, usamos a forma que já funciona no seu projeto:
    scale(-1, 1);
    image(spriteSheetToDraw, -frameSize, 0, frameSize, frameSize, sx, 0, frameSize, frameSize);
  } else {
    image(spriteSheetToDraw, 0, 0, frameSize, frameSize, sx, 0, frameSize, frameSize);
  }

  // hitbox só no editor
  if (modoEditor) {
    noFill();
    stroke(0, 255, 0);
    rect(hitboxOffsetX, hitboxOffsetY, hitboxW, hitboxH);
    noStroke();
  }

  pop(); // personagem
  pop(); // camera

  // ===== HUD / Overlays =====
  desenharEnergia();
  desenharHUD();

  // indicador de modo / hotbar
  fill(0, 150);
  rect(10, 10, 320, 60, 5);
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Modo: " + (modoEditor ? "Editor" : "Jogo"), 20, 15);
  if (modoEditor) {
    text("Ferramenta: " + ferramentaAtiva.charAt(0).toUpperCase() + ferramentaAtiva.slice(1), 20, 35);
    desenharHotbar();
  }

  // vitória
  if (venceu) {
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("🎉 Você venceu! 🎉", width / 2, height / 2 - 40);
    textSize(18);
    text("Pressione F5 para reiniciar.", width / 2, height / 2 + 20);
    noLoop();
  }
}
// ---------------- funções auxiliares ----------------
function chao() {
   let chaoY = 705;
   for( let x = 0; x < WORLD_WIDTH; x += blocoMeio.width){
    image(blocoMeio, x, chaoY, blocoMeio.width, 50);
   }
}
// ================== moverPersonagem (substituir a função atual) ==================
function moverPersonagem() {
  // velocidade horizontal desejada
  let vx = 0;
  if (keyIsDown(65) || keyIsDown(37)) vx = -5;
  if (keyIsDown(68) || keyIsDown(39)) vx = 5;

  // marca direção de olhar (mantém variável que você já usa)
  if (vx < 0) olhandoEsquerda = true;
  else if (vx > 0) olhandoEsquerda = false;

  // aplica gravidade
  velY += gravidade;
  let vy = velY;

  // atualiza hitbox local
  let hbLeft = posX + hitboxOffsetX;
  let hbRight = hbLeft + hitboxW;
  let hbTop = posY + hitboxOffsetY;
  let hbBottom = hbTop + hitboxH;

  // assume no chão = falso até checar colisões
  noChao = false;
if (noChao) {
    lastGrounded = millis();
}
  // mover vertical primeiro
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

    // colisão vertical (cair sobre plataforma)
    if (hbRight > platLeft && hbLeft < platRight) {
      // caindo
      if (vy > 0 && hbBottom > platTop && hbTop < platTop) {
        posY = platTop - hitboxH - hitboxOffsetY;
        velY = 0;
        noChao = true;

        // empurra junto com plataforma móvel
        posX += p.dx;
        posY += p.dy;
      }
      // batendo de baixo
      if (vy < 0 && hbTop < platBottom && hbBottom > platBottom) {
        posY = platBottom - hitboxOffsetY;
        velY = 0;
      }
    }
  }

  // chão do mundo
  let chaoY = 705;
  hbBottom = posY + hitboxOffsetY + hitboxH;
  if (hbBottom >= chaoY) {
    posY = chaoY - hitboxH - hitboxOffsetY;
    velY = 0;
    noChao = true;
  }

  // Se estiver no chão, atualiza lastGrounded (para possíveis coyote jumps)
  if (noChao) lastGrounded = millis();

  // mover horizontal
  posX += vx;
  hbLeft = posX + hitboxOffsetX;
  hbRight = hbLeft + hitboxW;

  // colisão horizontal (bloqueia passar por plataformas pelas laterais)
  for (let p of plataformas) {
    let platTop = p.y;
    let platBottom = p.y + p.h;
    let platLeft = p.x;
    let platRight = p.x + p.w;

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

  // limites do mundo
  posX = constrain(posX, 0, WORLD_WIDTH - playerW);

  // reset safety (se cair muito)
  if (posY > WORLD_HEIGHT + 200) {
    posX = 100;
    posY = 100;
    velY = 0;
  }

}

// Atualiza movimento das plataformas móveis
function atualizarPlataformas() {
    for (let p of plataformas) {
        if (p.dx !== 0) {
            p.x += p.dx;
            if (p.x < p.minX) { p.x = p.minX; p.dx *= -1; }
            if (p.x + p.w > p.maxX) { p.x = p.maxX - p.w; p.dx *= -1; }
        }
        if (p.dy !== 0) {
            p.y += p.dy;
            if (p.y < p.minY) { p.y = p.minY; p.dy *= -1; }
            if (p.y + p.h > p.maxY) { p.y = p.maxY - p.h; p.dy *= -1; }
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
  let plataforma = {
    x: x,
    y: y,
    w: w,
    h: h,
    textura: options.textura || "blocoMeio", // 🔹 tipo de textura
    dx: options.dx || 0,
    dy: options.dy || 0,
    minX: options.minX ?? x,
    maxX: options.maxX ?? x,
    minY: options.minY ?? y,
    maxY: options.maxY ?? y,
    adicionado: options.adicionado || false,
    nomeItem: options.nomeItem || null
  };
  plataformas.push(plataforma);
  return plataforma;
}

function desenharAlvos() {
  for (let alvo of posicoesAlvo) {
    noFill();
    stroke(alvo.ok ? [50,200,50] : [255,255,0]);
    rect(alvo.x, alvo.y, alvo.w, alvo.h);
  }
}

function checarBlocosNosAlvos() {
  for (let alvo of posicoesAlvo) {
    alvo.ok = false;
    for (let p of plataformas) {
      if (!p.adicionado) continue; // só considera blocos colocados pelo jogador
      // checa se o centro da plataforma está dentro do alvo
      let centroP_x = p.x + p.w / 2;
      let centroP_y = p.y + p.h / 2;
      if (centroP_x > alvo.x && centroP_x < alvo.x + alvo.w &&
          centroP_y > alvo.y && centroP_y < alvo.y + alvo.h) {
        alvo.ok = true;
        break;
      }
    }
  }
}

function verificarAlvosCompletos() {
  let antes = puzzlesCompletos;
  let completos = posicoesAlvo.filter(a => a.ok).length;
  if (completos > antes) {
    puzzlesCompletos = completos;
    // recarrega energia quando atingir múltiplos de 3 (no seu caso 3 alvos -> energia total)
    if (puzzlesCompletos % 3 === 0) {
      energia = energiaMax;
      console.log("⚡ Energia totalmente recarregada! Puzzles completos:", puzzlesCompletos);
    }
  }
  // observe: puzzlesCompletos não decrece se o jogador remover um bloco - isso evita abuso.
}

// DESENHA E COLETA OS Puzzles (colecionáveis)
function desenharColecionaveis() {
    // checa colisão com hitbox do jogador (uso posX do mundo)
    let hbLeft = posX + hitboxOffsetX;
    let hbRight = hbLeft + hitboxW;
    let hbTop = posY + hitboxOffsetY;
    let hbBottom = hbTop + hitboxH;

    for (let c of colecionaveis) {
        if (!c.collected) {
            fill(...c.color);
            rect(c.x, c.y, c.w, c.h);

            // colisão AABB
            if (hbRight > c.x && hbLeft < c.x + c.w && hbBottom > c.y && hbTop < c.y + c.h) {
                c.collected = true;
                // dá 1 puzzleBlock ao inventário
                let it = inventario.find(i => i.nome === "puzzleBlock");
                if (it) it.quantidade++;
                else inventario.push({ nome: "puzzleBlock", quantidade: 1 });
                console.log("Coletado! puzzleBlock:", inventario.find(i=>i.nome==="puzzleBlock").quantidade);
            }
        }
    }

    // se todos coletados, ativa a chave no final do mapa
    if (colecionaveis.every(c => c.collected) && !chave.active) {
        chave.active = true;
        console.log("🔑 Todos os puzzleBlocks coletados — chave ativada!");
    }
}

function desenharChave() {
    if (!chave.active || chave.collected) return;
    // desenha a chave como elipse amarela com contorno (no mundo)
    fill(255, 220, 0);
    stroke(200, 180, 0);
    ellipse(chave.x, chave.y, chave.r * 2, chave.r * 2);
    noStroke();

    // colisão simples: AABB entre hitbox e a elipse bounding box
    let hbLeft = posX + hitboxOffsetX;
    let hbRight = hbLeft + hitboxW;
    let hbTop = posY + hitboxOffsetY;
    let hbBottom = hbTop + hitboxH;

    let keyLeft = chave.x - chave.r;
    let keyRight = chave.x + chave.r;
    let keyTop = chave.y - chave.r;
    let keyBottom = chave.y + chave.r;

    if (hbRight > keyLeft && hbLeft < keyRight && hbBottom > keyTop && hbTop < keyBottom) {
        chave.collected = true;
        saida.active = true; // ativa saída
        console.log("Chave coletada! Saída ativada.");
    }
}

function desenharSaida() {
    if (saida.active) {
        fill(255, 215, 0); // dourado
    } else {
        fill(120); // inativa
    }
    rect(saida.x, saida.y, saida.w, saida.h, 6);

    // colisão com saída (vitoria)
    if (saida.active && !venceu) {
        let hbLeft = posX + hitboxOffsetX;
        let hbRight = hbLeft + hitboxW;
        let hbTop = posY + hitboxOffsetY;
        let hbBottom = hbTop + hitboxH;

        if (hbRight > salidaLeft() && hbLeft < salidaRight() && hbBottom > salidaTop() && hbTop < salidaBottom()) {
            venceu = true;
            console.log("Vitória!");
        }
    }
}
function salidaLeft(){ return saida.x; }
function salidaRight(){ return saida.x + saida.w; }
function salidaTop(){ return saida.y; }
function salidaBottom(){ return saida.y + saida.h; }

// HUD simples com contador de puzzleBlocks e hint
function desenharHUD() {
    fill(0, 0, 0, 160);
    rect(width - 260, 10, 250, 110, 6);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(14);
    let pb = inventario.find(i => i.nome === "puzzleBlock");
    let qtd = pb ? pb.quantidade : 0;
    text("Puzzle blocks: " + qtd, width - 240, 20);
    text("Puzzles completos: " + puzzlesCompletos, width - 240, 42);
    text("Colete blocos e use o editor para posicioná-los nos alvos.", width - 240, 64);
    text("A cada 3 puzzles completos, energia volta a 100.", width - 240, 84);
}

//                  ---------- core ---------------
function desenharPlataforma(x, y, largura, altura, textura) {
  let img;
  if (textura === "pedra") img = pedra;
  else img = blocoMeio;

  let imgW = img.width;
  let imgH = img.height;

  for (let i = 0; i < largura; i += imgW) {
    for (let j = 0; j < altura; j += imgH) {
      let w = min(imgW, largura - i);
      let h = min(imgH, altura - j);
      image(img, x + i, y + j, w, h);
    }
  }
}


function usarEnergia() {
    // Não usamos para ações contínuas; energia só é consumida ao entrar no editor (já implementado)
    energia -= custoEditar;
    if (energia < 0) energia = 0;
}

// Hotbar desenhada na parte inferior da tela (fixa). Mostra itens e quantidades
function desenharHotbar() {
    let hotbarX = width / 2 - 455; // centraliza 9 slots de 50px (ajustado)
    let hotbarY = height - 90;
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
            text(item.quantidade, slotX + slotSize / 2, hotbarY + 38);
        }
    }
}

// teclas
function keyPressed() {

    // ===== Alterna entre jogo/editor com custo de energia =====
    if (key === 'e' || key === 'E') {
        if (!modoEditor) {
            // entrando no editor
            if (energia >= custoEditar) {
                energia -= custoEditar;
                modoEditor = true;
                console.log("🛠️ Entrou no modo editor. Energia restante:", energia);
            } else {
                console.log("⚡ Energia insuficiente para entrar no editor!");
            }
        } else {
            // saindo do editor
            modoEditor = false;
            console.log("🔁 Saiu do modo editor.");
        }
        return; // evita conflito com pulo
    }

    // ===== Quando no editor: mudar ferramenta =====
    if (modoEditor) {
        if (key === 'a' || key === 'A') ferramentaAtiva = "adicionar";
        if (key === 'm' || key === 'M') ferramentaAtiva = "mover";
        if (key === 'r' || key === 'R') ferramentaAtiva = "redimensionar";
        if (key === 'z' || key === 'Z') ferramentaAtiva = "remover";
        return; // editor não pula nem mexe personagem
    }

    // ===== Sistema de pulo no modo jogo =====
    // salva o momento que o jogador pediu pulo (jump buffer)
    if (key === 'w' || keyCode === UP_ARROW || key === ' ') {
        lastJumpPress = millis();

        let timeSinceGround = millis() - lastGrounded;
        let timeSincePress = millis() - lastJumpPress;

        // pode pular se:
        // - está no chão OU
        // - dentro do coyote time OU
        // - ainda no período do jump buffer
        // só pula se não pulou no ar ainda
if (
    noChao ||
    (millis() - lastGrounded < COYOTE_TIME) ||
    (millis() - lastJumpPress < JUMP_BUFFER && noChao)
) {
    velY = jumpForce;
    noChao = false;

    // limpa buffer e coyote depois do pulo
    lastGrounded = -99999; 
    lastJumpPress = -99999;
}
    }

    // ===== Troca slot do inventário =====
    if (key >= '1' && key <= String(inventario.length)) {
        slotAtivo = int(key) - 1;
        console.log("Slot ativo:", slotAtivo, inventario[slotAtivo].nome);
    }
}

// -------------- mouse -------
function mousePressed() {
    // No editor, usamos coordenadas do mundo (adiciona camX)
    let worldMouseX = mouseX + camX;
    let worldMouseY = mouseY;

    if (!modoEditor) return;
    

    // REMOVER
    if (ferramentaAtiva === "remover") {
        for (let i = plataformas.length - 1; i >= 0; i--) {
            let p = plataformas[i];
            if (
                worldMouseX > p.x &&
                worldMouseX < p.x + p.w &&
                worldMouseY > p.y &&
                worldMouseY < p.y + p.h &&
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

    // 🔹 ADICIONAR NOVO BLOCO (só se a ferramenta for "adicionar")
   if (ferramentaAtiva === "adicionar") {
        let item = inventario[slotAtivo];
        if (item && item.quantidade > 0 && podeAdicionarBloco(worldMouseX, worldMouseY)) {
            // (adiciona bloco normalmente)
            let w = 150;
            let h = 35;
            let nova = criarPlataforma(worldMouseX - w/2, worldMouseY - h/2, w, h, {
                adicionado: true,
                nomeItem: item.nome
            });
            nova.adicionado = true;
            nova.nomeItem = item.nome;

            // desconta do inventário
            item.quantidade--;
            console.log("✅ Bloco adicionado pelo jogador. Restam:", item.quantidade);
        } else {
            console.log("❌ Não é possível adicionar (sem item/quantidade ou área proibida).");
        }
        return;
    }

    // 🔹 MOVER OU REDIMENSIONAR (começa seleção)
    for (let p of plataformas) {
        if (
            ferramentaAtiva === "redimensionar" &&
            worldMouseX > p.x + p.w - handleSize &&
            worldMouseX < p.x + p.w &&
            worldMouseY > p.y + p.h - handleSize &&
            worldMouseY < p.y + p.h
        ) {
            plataformaSelecionada = p;
            resizeMode = "both";
            return;
        }

        if (
            ferramentaAtiva === "mover" &&
            worldMouseX > p.x &&
            worldMouseX < p.x + p.w &&
            worldMouseY > p.y &&
            worldMouseY < p.y + p.h
        ) {
            plataformaSelecionada = p;
            resizeMode = "move";
            offsetX = worldMouseX - p.x;
            offsetY = worldMouseY - p.y;
            return;
        }
    }
}

// arrastar plataforma
function mouseDragged() {
    if (!modoEditor || !plataformaSelecionada) return;

    // ao arrastar usamos coordenadas do mundo
    let worldMouseX = mouseX + camX;
    let worldMouseY = mouseY;

    if (resizeMode === "move") {
        plataformaSelecionada.x = worldMouseX - offsetX;
        plataformaSelecionada.y = worldMouseY - offsetY;
    } else if (resizeMode === "both") {
        plataformaSelecionada.w = max(20, worldMouseX - plataformaSelecionada.x);
        plataformaSelecionada.h = max(8, worldMouseY - plataformaSelecionada.y);
    }
}

// soltar plataforma
function mouseReleased() {
    plataformaSelecionada = null;
    resizeMode = null;
}

// determina se pode adicionar bloco naquela posição (evita sobrepor jogador ou sair do mapa)
function podeAdicionarBloco(mx, my) {
    // não posicionar onde o jogador está (distância mínima)
    let distanciaJogador = dist(mx, my, posX + playerW/2, posY + playerH/2);
    if (distanciaJogador < 80) return false;

    // não posicionar dentro da área de HUD superior direita (em tela)
    // converte posição de HUD para coordenadas do mundo: simplificamos e evitamos usar área global
    if (mx > WORLD_WIDTH - 300 && my < 130) return false;

    // não posicionar fora do mundo
    if (mx < 0 || mx > WORLD_WIDTH) return false;

    // pode adicionar
    return true;
}

// ENERGIA desenha barra fixa no canto superior esquerdo (largura fixa)
function desenharEnergia() {
    // barra fixa no canto superior esquerdo (largura fixa)
    let bx = 10;
    let by = 70;
    let bw = 200; // largura fixa
    let bh = 18;

    // fundo
    fill(0);
    rect(bx, by, bw, bh, 6);

    // preenchimento proporcional
    let wPreenchido = map(energia, 0, energiaMax, 0, bw);
    fill(0, 150, 255);
    rect(bx, by, wPreenchido, bh, 6);

    // texto
    fill(255);
    textSize(12);
    textAlign(LEFT, CENTER);
    text("Energia: " + Math.floor(energia), bx + 6, by + bh / 2);
}

// Funções de criação rápida de colecionáveis / chave / saída (utilitárias)
function criarColecionaveis() {
    colecionaveis = [
        { x: 300, y: 400, w: 30, h: 30, collected: false },
        { x: 550, y: 300, w: 30, h: 30, collected: false },
        { x: 750, y: 200, w: 30, h: 30, collected: false }
    ];
}

function criarChave() {
    chave = { x: WORLD_WIDTH - 200, y: 300, r: 14, collected: false, active: false };
}

function criarSaida() {
    saida = { x: WORLD_WIDTH - 120, y: 220, w: 60, h: 80, active: false };
}
