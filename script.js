
const API_URL =
    "https://chatbot-marmitas-api.d2023004130.workers.dev/";

// ==========================================
// 1. CARDÁPIO
// ==========================================

const cardapio = [
    { id: "frango", nome: "Marmita de frango grelhado", preco: 20, palavras: ["frango grelhado", "marmita de frango"] },
    { id: "bife", nome: "Marmita de bife acebolado", preco: 23, palavras: ["bife acebolado", "marmita de bife"] },
    { id: "carne", nome: "Marmita de carne moída", preco: 21, palavras: ["carne moída", "carne moida"] },
    { id: "linguica", nome: "Marmita de linguiça acebolada", preco: 20, palavras: ["linguiça acebolada", "linguica acebolada"] },
    { id: "vegetariana", nome: "Marmita vegetariana", preco: 19, palavras: ["marmita vegetariana", "vegetariana"] },
    { id: "milanesa", nome: "Marmita de frango à milanesa", preco: 22, palavras: ["frango à milanesa", "frango a milanesa"] },
    { id: "ovo", nome: "Ovo frito", preco: 3, palavras: ["ovo frito", "ovos fritos"] },
    { id: "batata", nome: "Batata frita", preco: 5, palavras: ["batata frita", "batatas fritas"] },
    { id: "arroz", nome: "Porção extra de arroz", preco: 4, palavras: ["arroz extra", "porção extra de arroz", "porcao extra de arroz"] },
    { id: "feijao", nome: "Porção extra de feijão", preco: 4, palavras: ["feijão extra", "feijao extra", "porção extra de feijão", "porcao extra de feijao"] }
];

// ==========================================
// 2. DADOS DO ATENDIMENTO
// ==========================================

let carrinho = {};
let historico = [];

let tipoEntrega = "entrega";
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

    // Forma de recebimento

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
        tipoEntrega === "entrega" ? TAXA_ENTREGA : 0;

    return {
        subtotal: subtotal,
        entrega: entrega,
        total: subtotal + entrega
    };
}

// ==========================================
// 6. MOSTRAR CARRINHO
// ==========================================

function exibirCarrinho(chat) {

    const itens = Object.values(carrinho);

    if (itens.length === 0) return;

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
            `${item.quantidade}x ${item.produto.nome} - R$ ${formatarDinheiro(valor)}`;

        resumo.appendChild(linha);

        if (item.personalizacao) {

            const detalhe = document.createElement("small");

            detalhe.textContent =
                "Personalização: " + item.personalizacao;

            resumo.appendChild(detalhe);
        }
    }

    const linhaSubtotal = document.createElement("p");
    linhaSubtotal.textContent =
        "Subtotal: R$ " + formatarDinheiro(valores.subtotal);

    resumo.appendChild(linhaSubtotal);

    const linhaEntrega = document.createElement("p");

    linhaEntrega.textContent =
        tipoEntrega === "entrega"
            ? "Entrega: R$ 5,00"
            : "Retirada: gratuita";

    resumo.appendChild(linhaEntrega);

    const total = document.createElement("strong");

    total.textContent =
        "TOTAL: R$ " + formatarDinheiro(valores.total);

    resumo.appendChild(total);

    chat.appendChild(resumo);
}

// ==========================================
// 7. MONTAR HISTÓRICO PARA A IA
// ==========================================

function montarContexto(novaMensagem) {

    const mensagensRecentes = historico.slice(-8);

    let contexto = `
Você está continuando um atendimento já iniciado.

Considere todo o histórico abaixo para entender
o pedido completo do cliente.

Não peça novamente informações que o cliente
já forneceu.

HISTÓRICO DA CONVERSA:
`;

    for (const mensagem of mensagensRecentes) {

        const autor =
            mensagem.role === "user"
                ? "CLIENTE"
                : "ATENDENTE";

        contexto += `\n${autor}: ${mensagem.content}\n`;
    }

    contexto += `
NOVA MENSAGEM DO CLIENTE:
${novaMensagem}

Continue o atendimento considerando o histórico completo.
`;

    // Respeita o limite de mensagem do Worker
    if (contexto.length > 3500) {
        contexto = contexto.slice(-3500);
    }

    return contexto;
}

// ==========================================
// 8. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    const campo = document.getElementById("mensagem");
    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (texto === "") return;

    campo.value = "";

    // Mostra mensagem do cliente

    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";
    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // Atualiza o carrinho

    atualizarCarrinho(texto);

    // Mostra processamento

    const mensagemBot = document.createElement("div");

    mensagemBot.className = "mensagem bot";
    mensagemBot.textContent = "Processando seu pedido...";

    chat.appendChild(mensagemBot);

    chat.scrollTop = chat.scrollHeight;

    try {

        // Inclui o histórico anterior na mensagem enviada

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
            dados.resposta || "Não recebi uma resposta.";

        mensagemBot.textContent = respostaIA;

        // Salva a conversa para as próximas mensagens

        historico.push({
            role: "user",
            content: texto
        });

        historico.push({
            role: "assistant",
            content: respostaIA
        });

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
});


