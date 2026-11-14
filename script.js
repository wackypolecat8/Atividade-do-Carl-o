
const API
const API_URL =
    "https://chatbot-marmitas-api.d2023004130.workers.dev/";

// ==========================================
// 1. CARDÁPIO
// ==========================================

const cardapio = [
    {
        id: "frango",
        nome: "Marmita de frango grelhado",
        preco: 20,
        palavras: ["frango grelhado", "marmita de frango"]
    },
    {
        id: "bife",
        nome: "Marmita de bife acebolado",
        preco: 23,
        palavras: ["bife acebolado", "marmita de bife"]
    },
    {
        id: "carne",
        nome: "Marmita de carne moída",
        preco: 21,
        palavras: ["carne moída", "carne moida"]
    },
    {
        id: "linguica",
        nome: "Marmita de linguiça acebolada",
        preco: 20,
        palavras: ["linguiça acebolada", "linguica acebolada"]
    },
    {
        id: "vegetariana",
        nome: "Marmita vegetariana",
        preco: 19,
        palavras: ["marmita vegetariana", "vegetariana"]
    },
    {
        id: "milanesa",
        nome: "Marmita de frango à milanesa",
        preco: 22,
        palavras: ["frango à milanesa", "frango a milanesa"]
    },
    {
        id: "ovo",
        nome: "Ovo frito",
        preco: 3,
        palavras: ["ovo frito", "ovos fritos"]
    },
    {
        id: "batata",
        nome: "Batata frita",
        preco: 5,
        palavras: ["batata frita", "batatas fritas"]
    },
    {
        id: "arroz",
        nome: "Porção extra de arroz",
        preco: 4,
        palavras: [
            "arroz extra",
            "porção extra de arroz",
            "porcao extra de arroz"
        ]
    },
    {
        id: "feijao",
        nome: "Porção extra de feijão",
        preco: 4,
        palavras: [
            "feijão extra",
            "feijao extra",
            "porção extra de feijão",
            "porcao extra de feijao"
        ]
    }
];

// ==========================================
// 2. DADOS DO ATENDIMENTO
// ==========================================

let carrinho = {};
let historico = [];

let tipoEntrega = "entrega";

const TAXA_ENTREGA = 5;

// Evita enviar várias mensagens simultaneamente.
let enviando = false;

// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function formatarDinheiro(valor) {

    return valor.toFixed(2).replace(".", ",");
}

function obterQuantidade(texto, posicao) {

    const antes = texto.slice(
        Math.max(0, posicao - 40),
        posicao
    );

    const resultado = antes.match(
        /(\d+|um|uma|dois|duas|tres|quatro|cinco)\s*(?:marmitas?\s+de\s+)?$/
    );

    if (!resultado) return 1;

    const numeros = {
        um: 1,
        uma: 1,
        dois: 2,
        duas: 2,
        tres: 3,
        quatro: 4,
        cinco: 5
    };

    return numeros[resultado[1]] ||
        parseInt(resultado[1]) ||
        1;
}

// ==========================================
// 4. ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho(textoOriginal) {

    const texto = normalizar(textoOriginal);

    const remover =
        /\b(remover|retirar|tirar|excluir|cancelar|cancele)\b/.test(texto);

    let encontrouProduto = false;

    for (const produto of cardapio) {

        let posicao = -1;

        for (const palavra of produto.palavras) {

            posicao = texto.indexOf(normalizar(palavra));

            if (posicao !== -1) break;
        }

        if (posicao === -1) continue;

        encontrouProduto = true;

        if (remover) {

            delete carrinho[produto.id];

            continue;
        }

        const quantidade = obterQuantidade(texto, posicao);

        if (!carrinho[produto.id]) {

            carrinho[produto.id] = {
                produto: produto,
                quantidade: 0,
                personalizacao: ""
            };
        }

        carrinho[produto.id].quantidade += quantidade;

        const personalizacoes = [];

        if (texto.includes("sem cebola")) {
            personalizacoes.push("Sem cebola");
        }

        if (texto.includes("sem alho")) {
            personalizacoes.push("Sem alho");
        }

        if (texto.includes("bem passada")) {
            personalizacoes.push("Bem passada");
        }

        if (texto.includes("mal passada")) {
            personalizacoes.push("Malpassada");
        }

        if (texto.includes("ao ponto")) {
            personalizacoes.push("Ao ponto");
        }

        if (personalizacoes.length > 0) {

            carrinho[produto.id].personalizacao =
                personalizacoes.join(", ");
        }
    }

    // FORMA DE RECEBIMENTO

    if (
        texto.includes("retirada") ||
        texto.includes("vou buscar") ||
        texto.includes("buscar no restaurante")
    ) {
        tipoEntrega = "retirada";
    }

    if (
        texto.includes("com entrega") ||
        texto.includes("quero entrega") ||
        texto.includes("entrega em casa")
    ) {
        tipoEntrega = "entrega";
    }

    return encontrouProduto;
}

// ==========================================
// 5. CALCULAR VALORES
// ==========================================

function calcularTotal() {

    let subtotal = 0;

    for (const item of Object.values(carrinho)) {

        subtotal +=
            item.produto.preco * item.quantidade;
    }

    const entrega =
        tipoEntrega === "entrega"
            ? TAXA_ENTREGA
            : 0;

    return {
        subtotal: subtotal,
        entrega: entrega,
        total: subtotal + entrega
    };
}

// ==========================================
// 6. MOSTRAR NOTA DO PEDIDO
// ==========================================

function exibirCarrinho() {

    const nota = document.getElementById("notaFiscal");

    const itens = Object.values(carrinho);

    // Limpa o conteúdo anterior.

    nota.innerHTML = "";

    // CABEÇALHO

    const cabecalho = document.createElement("div");

    cabecalho.className = "nota-cabecalho";

    const titulo = document.createElement("h2");

    titulo.textContent = "🧾 Seu pedido";

    const nomeRestaurante = document.createElement("p");

    nomeRestaurante.textContent = "Marmita Caseira";

    cabecalho.appendChild(titulo);
    cabecalho.appendChild(nomeRestaurante);

    nota.appendChild(cabecalho);

    // CARRINHO VAZIO

    if (itens.length === 0) {

        const vazio = document.createElement("div");

        vazio.className = "nota-vazia";

        const icone = document.createElement("span");

        icone.textContent = "🛒";

        const mensagem = document.createElement("p");

        mensagem.textContent =
            "Seu pedido aparecerá aqui.";

        const detalhe = document.createElement("small");

        detalhe.textContent =
            "Escolha os itens pelo chat para começar.";

        vazio.appendChild(icone);
        vazio.appendChild(mensagem);
        vazio.appendChild(detalhe);

        nota.appendChild(vazio);

        return;
    }

    // VALORES DO PEDIDO

    const valores = calcularTotal();

    // LISTA DE PRODUTOS

    for (const item of itens) {

        const linha = document.createElement("div");

        linha.className = "nota-item";

        const valor =
            item.produto.preco * item.quantidade;

        const nome = document.createElement("div");

        nome.className = "nota-item-linha";

        const descricao = document.createElement("span");

        descricao.textContent =
            `${item.quantidade}x ${item.produto.nome}`;

        const preco = document.createElement("span");

        preco.textContent =
            `R$ ${formatarDinheiro(valor)}`;

        nome.appendChild(descricao);
        nome.appendChild(preco);

        linha.appendChild(nome);

        // PERSONALIZAÇÕES

        if (item.personalizacao) {

            const detalhe = document.createElement("small");

            detalhe.textContent =
                "Personalização: " + item.personalizacao;

            linha.appendChild(detalhe);
        }

        nota.appendChild(linha);
    }

    // SUBTOTAL E ENTREGA

    const valoresDiv = document.createElement("div");

    valoresDiv.className = "nota-valores";

    const linhaSubtotal = document.createElement("div");

    linhaSubtotal.className = "nota-valor-linha";

    const textoSubtotal = document.createElement("span");

    textoSubtotal.textContent = "Subtotal";

    const precoSubtotal = document.createElement("span");

    precoSubtotal.textContent =
        `R$ ${formatarDinheiro(valores.subtotal)}`;

    linhaSubtotal.appendChild(textoSubtotal);
    linhaSubtotal.appendChild(precoSubtotal);

    valoresDiv.appendChild(linhaSubtotal);

    const linhaEntrega = document.createElement("div");

    linhaEntrega.className = "nota-valor-linha";

    const textoEntrega = document.createElement("span");

    textoEntrega.textContent =
        tipoEntrega === "entrega"
            ? "Entrega"
            : "Retirada";

    const precoEntrega = document.createElement("span");

    precoEntrega.textContent =
        tipoEntrega === "entrega"
            ? `R$ ${formatarDinheiro(valores.entrega)}`
            : "Grátis";

    linhaEntrega.appendChild(textoEntrega);
    linhaEntrega.appendChild(precoEntrega);

    valoresDiv.appendChild(linhaEntrega);

    nota.appendChild(valoresDiv);

    // TOTAL

    const total = document.createElement("div");

    total.className = "nota-total";

    const textoTotal = document.createElement("span");

    textoTotal.textContent = "TOTAL";

    const precoTotal = document.createElement("span");

    precoTotal.textContent =
        `R$ ${formatarDinheiro(valores.total)}`;

    total.appendChild(textoTotal);
    total.appendChild(precoTotal);

    nota.appendChild(total);

    // RODAPÉ

    const rodape = document.createElement("div");

    rodape.className = "nota-rodape";

    rodape.textContent =
        "Obrigado pela preferência!";

    nota.appendChild(rodape);
}

// ==========================================
// 7. MONTAR HISTÓRICO PARA A IA
// ==========================================

function montarContexto(novaMensagem) {

    const mensagensRecentes = historico.slice(-8);

    let contexto = `
Você está continuando um atendimento da Marmita Caseira.

Considere o histórico abaixo para entender o pedido completo.

Não peça novamente informações que o cliente já forneceu.

HISTÓRICO DA CONVERSA:
`;

    for (const mensagem of mensagensRecentes) {

        const autor =
            mensagem.role === "user"
                ? "CLIENTE"
                : "ATENDENTE";

        contexto +=
            `\n${autor}: ${mensagem.content}\n`;
    }

    // ESTADO ATUAL DO CARRINHO

    const itens = Object.values(carrinho);

    const valores = calcularTotal();

    contexto += `

ESTADO ATUAL DO CARRINHO:

`;

    if (itens.length === 0) {

        contexto += "O carrinho está vazio.\n";

    } else {

        for (const item of itens) {

            contexto +=
                `${item.quantidade}x ${item.produto.nome} - R$ ${formatarDinheiro(item.produto.preco)} por unidade. `;

            if (item.personalizacao) {

                contexto +=
                    `Personalização: ${item.personalizacao}. `;
            }

            contexto += "\n";
        }
    }

    contexto += `
Subtotal: R$ ${formatarDinheiro(valores.subtotal)}
Entrega: ${tipoEntrega === "entrega" ? "R$ " + formatarDinheiro(valores.entrega) : "Retirada gratuita"}
TOTAL: R$ ${formatarDinheiro(valores.total)}

Use esses valores como referência para responder sobre o pedido.
Não invente preços nem altere os valores do carrinho.

NOVA MENSAGEM DO CLIENTE:
${novaMensagem}

Continue o atendimento considerando o histórico e o carrinho atual.
`;

    // LIMITA O TAMANHO DA MENSAGEM

    if (contexto.length > 3500) {

        contexto = contexto.slice(-3500);
    }

    return contexto;
}

// ==========================================
// 8. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    if (enviando) return;

    const campo = document.getElementById("mensagem");

    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (texto === "") return;

    campo.value = "";

    enviando = true;

    // MOSTRA MENSAGEM DO CLIENTE

    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";

    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // ATUALIZA CARRINHO

    atualizarCarrinho(texto);

    exibirCarrinho();

    // MOSTRA PROCESSAMENTO

    const mensagemBot = document.createElement("div");

    mensagemBot.className = "mensagem bot";

    mensagemBot.textContent =
        "Processando seu pedido...";

    chat.appendChild(mensagemBot);

    chat.scrollTop = chat.scrollHeight;

    try {

        // MONTA CONTEXTO

        const contexto = montarContexto(texto);

        // ENVIA PARA O WORKER

        const resposta = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                mensagem: contexto,

                modelo: "groq"

            })
        });

        const textoResposta = await resposta.text();

        let dados;

        try {

            dados = JSON.parse(textoResposta);

        } catch (erro) {

            throw new Error(
                "Resposta inválida do servidor: " +
                textoResposta.slice(0, 200)
            );
        }

        if (!resposta.ok) {

            throw new Error(
                dados.detalhe ||
                dados.erro ||
                "Erro HTTP " + resposta.status
            );
        }

        const respostaIA =
            dados.resposta ||
            "Não recebi uma resposta.";

        // MOSTRA RESPOSTA DA IA

        mensagemBot.textContent = respostaIA;

        // SALVA HISTÓRICO

        historico.push({

            role: "user",

            content: texto

        });

        historico.push({

            role: "assistant",

            content: respostaIA

        });

        // ATUALIZA NOTA

        exibirCarrinho();

    } catch (erro) {

        console.error(
            "Erro no atendimento:",
            erro
        );

        mensagemBot.textContent =
            "Desculpe, ocorreu um problema: " +
            erro.message;
    }

    chat.scrollTop = chat.scrollHeight;

    enviando = false;

    campo.focus();
}

// ==========================================
// 9. ENVIAR COM ENTER
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const campo = document.getElementById("mensagem");

    if (campo) {

        campo.addEventListener("keydown", function (evento) {

            if (
                evento.key === "Enter" &&
                !evento.shiftKey
            ) {

                evento.preventDefault();

                enviarMensagem();
            }
        });
    }

    // EXIBE O CARRINHO INICIAL

    exibirCarrinho();

});

});


