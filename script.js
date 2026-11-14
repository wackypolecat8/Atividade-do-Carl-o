
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
        palavras: [
            "marmita de frango grelhado",
            "frango grelhado",
            "marmita de frango"
        ]
    },
    {
        id: "bife",
        nome: "Marmita de bife acebolado",
        preco: 23,
        palavras: [
            "marmita de bife acebolado",
            "bife acebolado",
            "marmita de bife"
        ]
    },
    {
        id: "carne",
        nome: "Marmita de carne moída",
        preco: 21,
        palavras: [
            "marmita de carne moida",
            "carne moida",
            "marmita de carne"
        ]
    },
    {
        id: "linguica",
        nome: "Marmita de linguiça acebolada",
        preco: 20,
        palavras: [
            "marmita de linguica acebolada",
            "linguica acebolada",
            "marmita de linguica"
        ]
    },
    {
        id: "vegetariana",
        nome: "Marmita vegetariana",
        preco: 19,
        palavras: [
            "marmita vegetariana",
            "vegetariana"
        ]
    },
    {
        id: "milanesa",
        nome: "Marmita de frango à milanesa",
        preco: 22,
        palavras: [
            "marmita de frango a milanesa",
            "frango a milanesa"
        ]
    },
    {
        id: "ovo",
        nome: "Ovo frito",
        preco: 3,
        palavras: [
            "ovos fritos extras",
            "ovos fritos",
            "ovo frito",
            "ovos extras",
            "ovo extra",
            "ovos",
            "ovo"
        ]
    },
    {
        id: "batata",
        nome: "Batata frita",
        preco: 5,
        palavras: [
            "batatas fritas",
            "batata frita",
            "batata extra"
        ]
    },
    {
        id: "arroz",
        nome: "Porção extra de arroz",
        preco: 4,
        palavras: [
            "porcao extra de arroz",
            "arroz extra"
        ]
    },
    {
        id: "feijao",
        nome: "Porção extra de feijão",
        preco: 4,
        palavras: [
            "porcao extra de feijao",
            "feijao extra"
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

// Converte números escritos por extenso.

function converterNumero(valor) {

    const numeros = {
        um: 1,
        uma: 1,
        dois: 2,
        duas: 2,
        tres: 3,
        quatro: 4,
        cinco: 5,
        seis: 6,
        sete: 7,
        oito: 8,
        nove: 9,
        dez: 10
    };

    return numeros[valor] || parseInt(valor) || 1;
}

// Identifica a quantidade do produto.

function obterQuantidade(texto, posicao) {

    // Primeiro procura quantidade associada a marmitas.
    // Exemplo: "quero 2 marmitas do tipo 2".

    const quantidadeMarmitas = texto.match(
        /\b(\d+|um|uma|dois|duas|tres|quatro|cinco)\s+marmitas?\b/
    );

    if (quantidadeMarmitas) {
        return converterNumero(quantidadeMarmitas[1]);
    }

    // Depois procura quantidade imediatamente antes do produto.
    // Exemplo: "quero 2 ovos extras".

    const antes = texto.slice(
        Math.max(0, posicao - 50),
        posicao
    );

    const resultado = antes.match(
        /(\d+|um|uma|dois|duas|tres|quatro|cinco)\s*$/
    );

    if (resultado) {
        return converterNumero(resultado[1]);
    }

    return 1;
}

// ==========================================
// 4. IDENTIFICAR PRODUTOS
// ==========================================

function identificarProdutos(texto) {

    const encontrados = [];

    // Números correspondentes às marmitas.

    const tiposMarmita = {
        1: "frango",
        2: "bife",
        3: "carne",
        4: "linguica",
        5: "vegetariana",
        6: "milanesa"
    };

    // Exemplo: "quero 2 marmitas do tipo 2".

    const numeroTipo = texto.match(
        /\b(?:tipo|opcao|numero|n)\s*(\d+)\b/
    );

    if (
        numeroTipo &&
        /\bmarmitas?\b/.test(texto)
    ) {

        const id = tiposMarmita[numeroTipo[1]];

        if (id) {

            const produto = cardapio.find(
                item => item.id === id
            );

            if (produto) {

                encontrados.push({
                    produto: produto,
                    posicao: numeroTipo.index,
                    quantidade: obterQuantidade(
                        texto,
                        numeroTipo.index
                    )
                });
            }
        }
    }

    // Identifica os produtos pelo nome ou apelido.

    for (const produto of cardapio) {

        // Evita adicionar duas vezes o mesmo produto
        // quando ele já foi reconhecido pelo número.

        if (
            encontrados.some(
                item => item.produto.id === produto.id
            )
        ) {
            continue;
        }

        // Prioriza expressões maiores.

        const palavras = [...produto.palavras]
            .sort((a, b) => b.length - a.length);

        for (const palavra of palavras) {

            const posicao = texto.indexOf(
                normalizar(palavra)
            );

            if (posicao !== -1) {

                encontrados.push({
                    produto: produto,
                    posicao: posicao,
                    quantidade: obterQuantidade(
                        texto,
                        posicao
                    )
                });

                break;
            }
        }
    }

    return encontrados;
}

// ==========================================
// 5. PERSONALIZAÇÕES
// ==========================================

function identificarPersonalizacoes(texto) {

    const personalizacoes = [];

    if (
        texto.includes("sem cebola") ||
        texto.includes("retirar cebola") ||
        texto.includes("tirar cebola")
    ) {
        personalizacoes.push("Sem cebola");
    }

    if (
        texto.includes("sem alho") ||
        texto.includes("retirar alho") ||
        texto.includes("tirar alho")
    ) {
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

    return personalizacoes;
}

// ==========================================
// 6. ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho(textoOriginal) {

    const texto = normalizar(textoOriginal);

    // Reconhece a forma de recebimento.

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

    // Identifica produtos.

    const encontrados = identificarProdutos(texto);

    const personalizacoes =
        identificarPersonalizacoes(texto);

    const mencionaIngrediente =
        /cebola|alho|sal|pimenta/.test(texto);

    const remover =
        /\b(remover|retirar|tirar|excluir|cancelar|cancele)\b/.test(texto)
        && !mencionaIngrediente;

    for (const item of encontrados) {

        const produto = item.produto;

        if (remover) {

            delete carrinho[produto.id];

            continue;
        }

        if (!carrinho[produto.id]) {

            carrinho[produto.id] = {
                produto: produto,
                quantidade: 0,
                personalizacao: ""
            };
        }

        carrinho[produto.id].quantidade +=
            item.quantidade;

        if (personalizacoes.length > 0) {

            carrinho[produto.id].personalizacao =
                personalizacoes.join(", ");
        }
    }

    return encontrados.length > 0;
}

// ==========================================
// 7. CALCULAR VALORES
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
// 8. MOSTRAR NOTA DO PEDIDO
// ==========================================

function exibirCarrinho() {

    const nota = document.getElementById("notaFiscal");

    if (!nota) return;

    const itens = Object.values(carrinho);

    nota.innerHTML = "";

    // CABEÇALHO

    const cabecalho = document.createElement("div");

    cabecalho.className = "nota-cabecalho";

    const titulo = document.createElement("h2");

    titulo.textContent = "🧾 Seu pedido";

    const nome = document.createElement("p");

    nome.textContent = "Marmita Caseira";

    cabecalho.appendChild(titulo);
    cabecalho.appendChild(nome);

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

    const valores = calcularTotal();

    // PRODUTOS

    for (const item of itens) {

        const linha = document.createElement("div");

        linha.className = "nota-item";

        const valor =
            item.produto.preco * item.quantidade;

        const nomeProduto = document.createElement("div");

        nomeProduto.className = "nota-item-linha";

        const descricao = document.createElement("span");

        descricao.textContent =
            `${item.quantidade}x ${item.produto.nome}`;

        const preco = document.createElement("span");

        preco.textContent =
            `R$ ${formatarDinheiro(valor)}`;

        nomeProduto.appendChild(descricao);
        nomeProduto.appendChild(preco);

        linha.appendChild(nomeProduto);

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
// 9. MONTAR CONTEXTO DA IA
// ==========================================

function montarContexto(novaMensagem) {

    const mensagensRecentes = historico.slice(-8);

    const valores = calcularTotal();

    let contexto = `
Você é o atendente virtual da Marmita Caseira.

Continue a conversa considerando o histórico e o estado do carrinho.

Não pergunte novamente informações que o cliente já forneceu.

HISTÓRICO:
`;

    for (const mensagem of mensagensRecentes) {

        const autor =
            mensagem.role === "user"
                ? "CLIENTE"
                : "ATENDENTE";

        contexto +=
            `\n${autor}: ${mensagem.content}\n`;
    }

    contexto += `

ESTADO ATUAL DO CARRINHO:
`;

    const itens = Object.values(carrinho);

    if (itens.length === 0) {

        contexto += "Carrinho vazio.\n";

    } else {

        for (const item of itens) {

            contexto +=
                `${item.quantidade}x ${item.produto.nome}, ` +
                `preço unitário R$ ${formatarDinheiro(item.produto.preco)}. `;

            if (item.personalizacao) {

                contexto +=
                    `Personalização: ${item.personalizacao}. `;
            }

            contexto += "\n";
        }
    }

    contexto += `
Subtotal: R$ ${formatarDinheiro(valores.subtotal)}
Entrega: ${tipoEntrega === "entrega"
        ? "R$ " + formatarDinheiro(valores.entrega)
        : "Gratuita"}
Total: R$ ${formatarDinheiro(valores.total)}

Use o estado do carrinho para responder sobre o pedido.
Não invente produtos ou preços.

NOVA MENSAGEM DO CLIENTE:
${novaMensagem}

Responda naturalmente, em português brasileiro.
`;

    if (contexto.length > 3500) {

        contexto = contexto.slice(-3500);
    }

    return contexto;
}

// ==========================================
// 10. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    if (enviando) return;

    const campo = document.getElementById("mensagem");

    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (!texto) return;

    campo.value = "";

    enviando = true;

    // MOSTRA MENSAGEM DO CLIENTE

    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";

    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // ATUALIZA O CARRINHO IMEDIATAMENTE

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

        const contexto = montarContexto(texto);

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
// 11. ENVIAR COM ENTER
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

    exibirCarrinho();

});


