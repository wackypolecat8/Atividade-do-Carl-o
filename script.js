
const API_URL =
    "https://chatbot-marmitas-api.d2023004130.workers.dev/";

// ==========================================
// 1. CARDÁPIO E PREÇOS
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
        palavras: ["carne moida", "carne moída"]
    },
    {
        id: "linguica",
        nome: "Marmita de linguiça acebolada",
        preco: 20,
        palavras: ["linguica acebolada", "linguiça acebolada"]
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
        palavras: ["frango a milanesa", "frango à milanesa"]
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
        palavras: ["arroz extra", "porcao extra de arroz", "porção extra de arroz"]
    },
    {
        id: "feijao",
        nome: "Porção extra de feijão",
        preco: 4,
        palavras: ["feijao extra", "feijão extra", "porcao extra de feijao", "porção extra de feijão"]
    }
];

// ==========================================
// 2. ESTADO DO CARRINHO
// ==========================================

let carrinho = {};
let tipoEntrega = "entrega";
let pedidoConfirmado = false;

const TAXA_ENTREGA = 5;

// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function obterQuantidade(texto, posicao) {

    const antes = texto.slice(
        Math.max(0, posicao - 35),
        posicao
    );

    const resultado = antes.match(
        /(\d+|um|uma|dois|duas|tres|quatro|cinco)\s*(?:marmitas?\s+de\s+)?$/
    );

    if (!resultado) {
        return 1;
    }

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
// 4. IDENTIFICAR PRODUTOS NA MENSAGEM
// ==========================================

function atualizarCarrinho(textoOriginal) {

    const texto = normalizar(textoOriginal);

    let encontrouProduto = false;

    const remover =
        /\b(remover|retirar|tirar|excluir|cancele|cancelar)\b/.test(texto);

    for (const produto of cardapio) {

        let posicao = -1;

        for (const palavra of produto.palavras) {

            const palavraNormalizada = normalizar(palavra);

            posicao = texto.indexOf(palavraNormalizada);

            if (posicao !== -1) {
                break;
            }
        }

        if (posicao === -1) {
            continue;
        }

        encontrouProduto = true;

        if (remover) {
            delete carrinho[produto.id];
            continue;
        }

        const quantidade = obterQuantidade(
            texto,
            posicao
        );

        if (!carrinho[produto.id]) {
            carrinho[produto.id] = {
                produto: produto,
                quantidade: 0,
                personalizacao: ""
            };
        }

        carrinho[produto.id].quantidade += quantidade;

        // Registra personalizações mencionadas
        const personalizacoes = [];

        if (texto.includes("sem cebola")) {
            personalizacoes.push("Sem cebola");
        }

        if (texto.includes("sem alho")) {
            personalizacoes.push("Sem alho");
        }

        if (texto.includes("bem passada")) {
            personalizacoes.push("Carne bem passada");
        }

        if (texto.includes("mal passada")) {
            personalizacoes.push("Carne malpassada");
        }

        if (texto.includes("ao ponto")) {
            personalizacoes.push("Carne ao ponto");
        }

        if (personalizacoes.length > 0) {
            carrinho[produto.id].personalizacao =
                personalizacoes.join(", ");
        }
    }

    // Identifica o tipo de entrega
    if (texto.includes("retirada") ||
        texto.includes("buscar no restaurante") ||
        texto.includes("vou buscar")) {

        tipoEntrega = "retirada";
    }

    if (texto.includes("com entrega") ||
        texto.includes("quero entrega") ||
        texto.includes("entrega em casa")) {

        tipoEntrega = "entrega";
    }

    if (encontrouProduto) {
        pedidoConfirmado = false;
    }

    return encontrouProduto;
}

// ==========================================
// 5. CALCULAR TOTAL DO CARRINHO
// ==========================================

function calcularTotal() {

    let subtotal = 0;

    for (const item of Object.values(carrinho)) {

        subtotal +=
            item.produto.preco * item.quantidade;
    }

    const entrega =
        tipoEntrega === "entrega" ? TAXA_ENTREGA : 0;

    return {
        subtotal,
        entrega,
        total: subtotal + entrega
    };
}

// ==========================================
// 6. EXIBIR RESUMO DO PEDIDO
// ==========================================

function exibirCarrinho(chat) {

    const itens = Object.values(carrinho);

    if (itens.length === 0) {
        return;
    }

    const valores = calcularTotal();

    const resumo = document.createElement("div");

    resumo.className = "mensagem bot";

    const titulo = document.createElement("strong");
    titulo.textContent = "🛒 Resumo atualizado do pedido";

    resumo.appendChild(titulo);

    for (const item of itens) {

        const linha = document.createElement("p");

        const valor =
            item.produto.preco * item.quantidade;

        linha.textContent =
            `${item.quantidade}x ${item.produto.nome} - ` +
            `R$ ${valor.toFixed(2).replace(".", ",")}`;

        resumo.appendChild(linha);

        if (item.personalizacao) {

            const detalhe = document.createElement("small");

            detalhe.textContent =
                "Personalização: " + item.personalizacao;

            resumo.appendChild(detalhe);
        }
    }

    const entrega = document.createElement("p");

    entrega.textContent =
        tipoEntrega === "entrega"
            ? "Entrega: R$ 5,00"
            : "Retirada: grátis";

    resumo.appendChild(entrega);

    const total = document.createElement("strong");

    total.textContent =
        "Total: R$ " +
        valores.total.toFixed(2).replace(".", ",");

    resumo.appendChild(total);

    if (pedidoConfirmado) {

        const confirmado = document.createElement("p");

        confirmado.textContent =
            "Pedido marcado como confirmado nesta demonstração.";

        resumo.appendChild(confirmado);
    }

    chat.appendChild(resumo);
}

// ==========================================
// 7. ENVIAR MENSAGEM PARA A GROQ
// ==========================================

async function enviarMensagem() {

    const campo = document.getElementById("mensagem");
    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (texto === "") {
        return;
    }

    campo.value = "";

    // Mostra mensagem do usuário
    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";
    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // Atualiza o carrinho com os produtos identificados
    atualizarCarrinho(texto);

    // Verifica confirmação explícita
    const textoNormalizado = normalizar(texto);

    if (
        /\b(confirmo|pode confirmar|confirmar pedido|pode fechar|fechar pedido)\b/
            .test(textoNormalizado)
    ) {
        if (Object.keys(carrinho).length > 0) {
            pedidoConfirmado = true;
        }
    }

    // Mensagem de processamento
    const mensagemBot = document.createElement("div");

    mensagemBot.className = "mensagem bot";
    mensagemBot.textContent = "Processando seu pedido...";

    chat.appendChild(mensagemBot);

    chat.scrollTop = chat.scrollHeight;

    try {

        const resposta = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                mensagem: texto,
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

        mensagemBot.textContent =
            dados.resposta || "Não recebi uma resposta.";

        // Mostra o carrinho atualizado
        exibirCarrinho(chat);

    } catch (erro) {

        console.error("Erro no atendimento:", erro);

        mensagemBot.textContent =
            "Desculpe, ocorreu um problema: " + erro.message;
    }

    chat.scrollTop = chat.scrollHeight;
}

// ==========================================
// 8. ENVIO COM ENTER
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
});


