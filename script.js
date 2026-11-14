
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
            "marmita de frango",
            "frango"
        ]
    },
    {
        id: "bife",
        nome: "Marmita de bife acebolado",
        preco: 23,
        palavras: [
            "marmita de bife acebolado",
            "bife acebolado",
            "marmita de bife",
            "bifes",
            "bife"
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
            "porcoes de batata frita",
            "porcao de batata frita",
            "batatas fritas",
            "batata frita",
            "porcao de batata",
            "batata extra",
            "batata"
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

// Guarda o último produto mencionado.
// Permite interpretar mensagens como "mais uma"
// e "deixa só duas".

let ultimoProdutoId = null;

// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?;:]/g, " ");
}

function formatarDinheiro(valor) {

    return valor.toFixed(2).replace(".", ",");
}

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

// ==========================================
// 4. IDENTIFICAR QUANTIDADES
// ==========================================

function obterQuantidade(texto, posicao) {

    const antes = texto.slice(
        Math.max(0, posicao - 50),
        posicao
    );

    const resultado = antes.match(
        /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:(?:marmitas?|porcoes?|extras?)\s*(?:de)?\s*)?$/
    );

    if (resultado) {
        return converterNumero(resultado[1]);
    }

    return 1;
}

// ==========================================
// 5. IDENTIFICAR PRODUTOS
// ==========================================

function identificarProdutos(texto) {

    const encontrados = [];

    const tiposMarmita = {
        1: "frango",
        2: "bife",
        3: "carne",
        4: "linguica",
        5: "vegetariana",
        6: "milanesa"
    };

    // Reconhecimento por número do cardápio.

    const numeroTipo = texto.match(
        /\b(?:tipo|opcao|numero|n)\s*(\d+)\b/
    );

    if (
        numeroTipo &&
        /\bmarmitas?\b/.test(texto)
    ) {

        const id = tiposMarmita[numeroTipo[1]];

        const produto = cardapio.find(
            item => item.id === id
        );

        if (produto) {

            encontrados.push({
                produto,
                posicao: numeroTipo.index,
                quantidade: obterQuantidade(
                    texto,
                    numeroTipo.index
                )
            });
        }
    }

    // Reconhecimento por nomes e apelidos.

    for (const produto of cardapio) {

        if (
            encontrados.some(
                item => item.produto.id === produto.id
            )
        ) {
            continue;
        }

        const palavras = [...produto.palavras]
            .sort((a, b) => b.length - a.length);

        for (const palavra of palavras) {

            const posicao = texto.indexOf(palavra);

            if (posicao !== -1) {

                encontrados.push({
                    produto,
                    posicao,
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
// 6. IDENTIFICAR OPERAÇÃO
// ==========================================

function identificarOperacao(texto) {

    // DEFINIR quantidade exata.

    const definirQuantidade =
        /\b(somente|apenas|so|deixa so|fica so|ajusta para|defina para|definir para)\b/.test(texto);

    if (definirQuantidade) {
        return "definir";
    }

    // REMOVER produto.

    const remover =
        /\b(remover|remova|retirar|retire|tirar|tira|excluir|exclua|cancelar|cancele|nao quero mais|nao quero)\b/.test(texto);

    if (remover) {
        return "remover";
    }

    // ADICIONAR por padrão.

    return "adicionar";
}

// ==========================================
// 7. IDENTIFICAR PERSONALIZAÇÕES
// ==========================================

function identificarPersonalizacoes(textoOriginal) {

    const texto = normalizar(textoOriginal);

    const personalizacoes = [];

    if (
        /\b(sem cebola|retirar cebola|tirar cebola|tira cebola|remover cebola)\b/.test(texto)
    ) {
        personalizacoes.push("Sem cebola");
    }

    if (
        /\b(sem alho|retirar alho|tirar alho|tira alho|remover alho)\b/.test(texto)
    ) {
        personalizacoes.push("Sem alho");
    }

    const bemPassada = texto.includes("bem passado");
    const malPassada = texto.includes("mal passado");
    const aoPonto = texto.includes("ao ponto");

    if (bemPassada && malPassada) {

        const quantidadeBem = texto.match(
            /(\d+|um|uma|dois|duas|tres|quatro)\s+(?:bifes?\s+)?bem passado/
        );

        const quantidadeMal = texto.match(
            /(\d+|um|uma|dois|duas|tres|quatro)\s+(?:bifes?\s+)?mal passado/
        );

        const qtdBem = quantidadeBem
            ? converterNumero(quantidadeBem[1])
            : 1;

        const qtdMal = quantidadeMal
            ? converterNumero(quantidadeMal[1])
            : 1;

        personalizacoes.push(
            `${qtdBem} bem passadas e ${qtdMal} malpassadas`
        );

    } else if (bemPassada) {

        personalizacoes.push("Bem passada");

    } else if (malPassada) {

        personalizacoes.push("Malpassada");

    } else if (aoPonto) {

        personalizacoes.push("Ao ponto");
    }

    return personalizacoes;
}

// ==========================================
// 8. APLICAR PERSONALIZAÇÕES
// ==========================================

function aplicarPersonalizacao(id, personalizacoes) {

    if (!carrinho[id]) return;

    for (const personalizacao of personalizacoes) {

        const atual = carrinho[id].personalizacao;

        if (
            !atual.includes(personalizacao)
        ) {

            carrinho[id].personalizacao =
                atual
                    ? atual + ", " + personalizacao
                    : personalizacao;
        }
    }
}

// ==========================================
// 9. ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho(textoOriginal) {

    const texto = normalizar(textoOriginal);

    // Forma de recebimento.

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

    const encontrados = identificarProdutos(texto);

    const personalizacoes =
        identificarPersonalizacoes(texto);

    const mencionaIngrediente =
        /\b(cebola|alho|sal|pimenta)\b/.test(texto);

    // Personalização sem repetir o nome do produto.
    // Exemplo: "tira a cebola".

    if (
        encontrados.length === 0 &&
        personalizacoes.length > 0 &&
        ultimoProdutoId
    ) {

        aplicarPersonalizacao(
            ultimoProdutoId,
            personalizacoes
        );

        return true;
    }

    // Se a mensagem fala de ingrediente,
    // não devemos remover a marmita inteira.

    if (
        encontrados.length === 0 &&
        mencionaIngrediente
    ) {
        return false;
    }

    const operacao = identificarOperacao(texto);

    // Mensagens curtas como "mais uma" ou "deixa só duas".

    if (
        encontrados.length === 0 &&
        ultimoProdutoId &&
        /\b(mais uma|mais um|mais duas|mais dois|outra|outro|so uma|so um|so duas|so dois|deixa so|fica so)\b/.test(texto)
    ) {

        const quantidadeMatch = texto.match(
            /\b(\d+|um|uma|dois|duas|tres|quatro|cinco)\b/
        );

        const quantidade = quantidadeMatch
            ? converterNumero(quantidadeMatch[1])
            : 1;

        alterarQuantidade(
            ultimoProdutoId,
            quantidade,
            operacao
        );

        return true;
    }

    for (const item of encontrados) {

        const id = item.produto.id;

        ultimoProdutoId = id;

        // Ingredientes e ponto de carne são aplicados
        // à marmita, sem remover o produto.

        if (
            personalizacoes.length > 0 &&
            ["frango", "bife", "carne", "linguica", "milanesa"].includes(id)
        ) {

            if (!carrinho[id]) {

                carrinho[id] = {
                    produto: item.produto,
                    quantidade: item.quantidade,
                    personalizacao: ""
                };

            } else if (item.quantidade > 0) {

                // Não adiciona novamente o produto
                // quando a mensagem é somente personalização.
            }

            aplicarPersonalizacao(
                id,
                personalizacoes
            );

            continue;
        }

        // Aplica a operação ao produto.

        alterarQuantidade(
            id,
            item.quantidade,
            operacao,
            item.produto
        );
    }

    return encontrados.length > 0;
}

// ==========================================
// 10. ALTERAR QUANTIDADE
// ==========================================

function alterarQuantidade(
    id,
    quantidade,
    operacao,
    produtoReferencia = null
) {

    const produto =
        produtoReferencia ||
        cardapio.find(item => item.id === id);

    if (!produto) return;

    if (!carrinho[id]) {

        carrinho[id] = {
            produto,
            quantidade: 0,
            personalizacao: ""
        };
    }

    if (operacao === "definir") {

        carrinho[id].quantidade = quantidade;

    } else if (operacao === "remover") {

        carrinho[id].quantidade -= quantidade;

    } else {

        carrinho[id].quantidade += quantidade;
    }

    // Impede quantidades negativas.

    if (carrinho[id].quantidade <= 0) {

        delete carrinho[id];
    }
}

// ==========================================
// 11. CALCULAR VALORES
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
        subtotal,
        entrega,
        total: subtotal + entrega
    };
}

// ==========================================
// 12. MOSTRAR NOTA DO PEDIDO
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
// 13. MONTAR CONTEXTO DA IA
// ==========================================

function montarContexto(novaMensagem) {

    const mensagensRecentes = historico.slice(-8);

    const valores = calcularTotal();

    let contexto = `
Você é o atendente virtual da Marmita Caseira.

Continue a conversa considerando o histórico
e o estado atual do carrinho.

Não pergunte novamente informações que o cliente
já forneceu.

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
Forma de recebimento: ${tipoEntrega}.

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
// 14. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    if (enviando) return;

    const campo = document.getElementById("mensagem");

    const chat = document.getElementById("chat");

    if (!campo || !chat) return;

    const texto = campo.value.trim();

    if (!texto) return;

    campo.value = "";

    enviando = true;

    // MENSAGEM DO CLIENTE

    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";

    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // ATUALIZA CARRINHO

    atualizarCarrinho(texto);

    exibirCarrinho();

    // PROCESSAMENTO

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

        } catch {

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

        // HISTÓRICO

        historico.push({
            role: "user",
            content: texto
        });

        historico.push({
            role: "assistant",
            content: respostaIA
        });

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
// 15. ENVIAR COM ENTER
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


