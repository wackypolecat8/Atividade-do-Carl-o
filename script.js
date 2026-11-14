
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

let ultimoProdutoId = null;

// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function normalizar(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function formatarDinheiro(valor) {

    return Number(valor)
        .toFixed(2)
        .replace(".", ",");
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

    return numeros[valor] || parseInt(valor, 10) || 1;
}

// ==========================================
// 4. IDENTIFICAR CONSULTAS INFORMATIVAS
// ==========================================

function ehConsultaInformativa(texto) {

    const consultas = [

        // Perguntas sobre ingredientes e composição.

        /\b(o que vem|o que acompanha|que acompanha|o que tem|quais ingredientes|ingredientes|composicao|acompanha)\b/,

        // Perguntas sobre preços.

        /\b(quanto custa|quanto e|qual o preco|qual preco|preco de|valor de)\b/,

        // Perguntas sobre o cardápio.

        /\b(cardapio|quais sao as opcoes|quais produtos|opcoes disponiveis|o que voces vendem)\b/,

        // Perguntas sobre disponibilidade.

        /\b(tem|ha|existe)\b.*\b(vegetariana|frango|bife|carne moida|linguica|milanesa|batata frita|ovo frito)\b/,

        // Perguntas indiretas.

        /\b(quero saber|gostaria de saber|pode me informar|me informe)\b.*\b(o que|quanto|preco|ingredientes|tem|disponivel)\b/,

        // Perguntas sobre um produto específico.

        /\b(como e|como vem|como funciona|o que inclui)\b/
    ];

    return consultas.some(regex => regex.test(texto));
}

// ==========================================
// 5. IDENTIFICAR QUANTIDADE
// ==========================================

function obterQuantidade(texto, posicao) {

    const antes = texto.slice(
        Math.max(0, posicao - 45),
        posicao
    );

    const resultado = antes.match(
        /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s*(?:(?:marmitas?|porcoes?|extras?)\s*)?(?:de\s*)?$/
    );

    if (resultado) {
        return converterNumero(resultado[1]);
    }

    return 1;
}

// ==========================================
// 6. IDENTIFICAR PRODUTOS
// ==========================================

function identificarProdutos(texto) {

    const candidatos = [];

    const tiposMarmita = {
        1: "frango",
        2: "bife",
        3: "carne",
        4: "linguica",
        5: "vegetariana",
        6: "milanesa"
    };

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

            candidatos.push({
                produto,
                posicao: numeroTipo.index,
                tamanho: numeroTipo[0].length,
                quantidade: obterQuantidade(
                    texto,
                    numeroTipo.index
                )
            });
        }
    }

    for (const produto of cardapio) {

        for (const palavra of produto.palavras) {

            let inicio = 0;

            while (true) {

                const posicao = texto.indexOf(
                    palavra,
                    inicio
                );

                if (posicao === -1) break;

                const antes = texto[posicao - 1] || "";

                const depois =
                    texto[posicao + palavra.length] || "";

                const limiteAntes =
                    !/[a-z0-9]/.test(antes);

                const limiteDepois =
                    !/[a-z0-9]/.test(depois);

                if (limiteAntes && limiteDepois) {

                    candidatos.push({
                        produto,
                        posicao,
                        tamanho: palavra.length,
                        quantidade: obterQuantidade(
                            texto,
                            posicao
                        )
                    });
                }

                inicio = posicao + 1;
            }
        }
    }

    candidatos.sort(
        (a, b) => b.tamanho - a.tamanho
    );

    const encontrados = [];

    for (const candidato of candidatos) {

        const inicio = candidato.posicao;

        const fim = inicio + candidato.tamanho;

        const sobrepoe = encontrados.some(item => {

            const outroInicio = item.posicao;

            const outroFim =
                outroInicio + item.tamanho;

            return (
                inicio < outroFim &&
                fim > outroInicio
            );
        });

        const produtoJaExiste = encontrados.some(
            item => item.produto.id === candidato.produto.id
        );

        if (!sobrepoe && !produtoJaExiste) {

            encontrados.push(candidato);
        }
    }

    return encontrados.sort(
        (a, b) => a.posicao - b.posicao
    );
}

// ==========================================
// 7. IDENTIFICAR OPERAÇÃO
// ==========================================

function identificarOperacao(texto) {

    const definir =
        /\b(somente|apenas|so|exatamente|deixa so|fica so|ajusta para|defina para|definir para)\b/.test(texto);

    if (definir) {
        return "definir";
    }

    const remover =
        /\b(remover|remova|retirar|retire|retira|tirar|tira|excluir|exclua|cancelar|cancele|cancela|menos|nao quero mais|nao quero)\b/.test(texto);

    if (remover) {
        return "remover";
    }

    return "adicionar";
}

// ==========================================
// 8. IDENTIFICAR PERSONALIZAÇÕES
// ==========================================

function identificarPersonalizacoes(textoOriginal) {

    const texto = normalizar(textoOriginal);

    const personalizacoes = [];

    if (
        /\b(sem cebola|retirar cebola|retire cebola|retira cebola|tirar cebola|tira cebola|remover cebola)\b/.test(texto)
    ) {

        personalizacoes.push("Sem cebola");
    }

    if (
        /\b(sem alho|retirar alho|retire alho|retira alho|tirar alho|tira alho|remover alho)\b/.test(texto)
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
// 9. APLICAR PERSONALIZAÇÕES
// ==========================================

function aplicarPersonalizacao(id, personalizacoes) {

    if (!carrinho[id]) return;

    for (const personalizacao of personalizacoes) {

        const atual =
            carrinho[id].personalizacao || "";

        if (!atual.includes(personalizacao)) {

            carrinho[id].personalizacao =
                atual
                    ? atual + ", " + personalizacao
                    : personalizacao;
        }
    }
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

    // Não cria um produto quando a operação é remover
    // e ele ainda não está no carrinho.

    if (!carrinho[id] && operacao === "remover") {
        return;
    }

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

    if (carrinho[id].quantidade <= 0) {

        delete carrinho[id];
    }
}

// ==========================================
// 11. FORMA DE RECEBIMENTO
// ==========================================

function atualizarFormaRecebimento(texto) {

    if (
        /\b(retirada|vou buscar|buscar no restaurante|retirar no restaurante)\b/.test(texto)
    ) {

        tipoEntrega = "retirada";
    }

    if (
        /\b(com entrega|quero entrega|entrega em casa|receber em casa)\b/.test(texto)
    ) {

        tipoEntrega = "entrega";
    }
}

// ==========================================
// 12. ATUALIZAR CARRINHO
// ==========================================

function atualizarCarrinho(textoOriginal) {

    const texto = normalizar(textoOriginal);

    // PRIMEIRA PROTEÇÃO:
    // Perguntas não podem alterar o carrinho.

    if (ehConsultaInformativa(texto)) {

        return false;
    }

    atualizarFormaRecebimento(texto);

    const encontrados = identificarProdutos(texto);

    const personalizacoes =
        identificarPersonalizacoes(texto);

    const mencionaIngrediente =
        /\b(cebola|alho|sal|pimenta)\b/.test(texto);

    const operacao = identificarOperacao(texto);

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

    // Não confundir retirada de ingredientes
    // com remoção da marmita.

    const apenasPersonalizacao =
        personalizacoes.length > 0 &&
        !/\b(quero|adiciona|adicionar|coloca|colocar|manda|separa|gostaria de|vou querer)\b/.test(texto);

    if (
        apenasPersonalizacao &&
        encontrados.length > 0
    ) {

        for (const item of encontrados) {

            const id = item.produto.id;

            if (carrinho[id]) {

                ultimoProdutoId = id;

                aplicarPersonalizacao(
                    id,
                    personalizacoes
                );
            }
        }

        return true;
    }

    // Se fala de ingrediente, não remove a marmita.

    if (
        encontrados.length === 0 &&
        mencionaIngrediente
    ) {

        return false;
    }

    // Mensagens curtas que usam o último produto.
    // Exemplo: "mais uma", "deixa só duas".

    if (
        encontrados.length === 0 &&
        ultimoProdutoId &&
        /\b(mais uma|mais um|mais duas|mais dois|outra|outro|so uma|so um|so duas|so dois|deixa so|fica so)\b/.test(texto)
    ) {

        const quantidadeMatch = texto.match(
            /\b(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/
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

    // Adiciona, remove ou define quantidades.

    for (const item of encontrados) {

        const id = item.produto.id;

        alterarQuantidade(
            id,
            item.quantidade,
            operacao,
            item.produto
        );

        if (carrinho[id]) {

            ultimoProdutoId = id;

            if (personalizacoes.length > 0) {

                aplicarPersonalizacao(
                    id,
                    personalizacoes
                );
            }

        } else if (ultimoProdutoId === id) {

            ultimoProdutoId = null;
        }
    }

    return encontrados.length > 0;
}

// ==========================================
// 13. RESETAR PEDIDO
// ==========================================

function mostrarBoasVindas() {

    const chat = document.getElementById("chat");

    if (!chat) return;

    chat.innerHTML = "";

    const boasVindas = document.createElement("div");

    boasVindas.className = "mensagem bot";

    boasVindas.textContent =
        "Olá! Seja bem-vindo novamente à Marmita Caseira! " +
        "Seu pedido anterior foi apagado. " +
        "Como posso ajudar?";

    chat.appendChild(boasVindas);
}

function limparPedido() {

    carrinho = {};

    historico = [];

    ultimoProdutoId = null;

    tipoEntrega = "entrega";

    const campo = document.getElementById("mensagem");

    if (campo) {
        campo.value = "";
    }

    mostrarBoasVindas();

    exibirCarrinho();

    if (campo) {
        campo.focus();
    }
}

// ==========================================
// 14. BOTÃO NOVO PEDIDO
// ==========================================

function novoPedido() {

    if (enviando) {

        alert("Aguarde o atendimento atual terminar.");

        return;
    }

    const confirmar = window.confirm(
        "Deseja realmente começar um novo pedido?\n\n" +
        "A conversa anterior e todos os produtos do carrinho serão apagados."
    );

    if (confirmar) {

        limparPedido();
    }
}

// ==========================================
// 15. RECONHECER PEDIDO NOVO PELO CHAT
// ==========================================

function solicitouNovoPedido(textoOriginal) {

    const texto = normalizar(textoOriginal);

    const frases = [
        "novo pedido",
        "comecar outro pedido",
        "fazer outro pedido",
        "comecar de novo",
        "comecar novamente",
        "quero recomecar",
        "vamos recomecar",
        "quero mudar meu pedido",
        "quero mudar o pedido",
        "mudar meu pedido",
        "mudar o pedido",
        "apagar a conversa",
        "limpar a conversa",
        "cancelar tudo",
        "cancela tudo",
        "zerar o pedido",
        "comecar do zero",
        "comecar desde o inicio"
    ];

    return frases.some(
        frase => texto.includes(frase)
    );
}

// ==========================================
// 16. CALCULAR VALORES
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
// 17. REMOVER PRODUTO DIRETAMENTE DA NOTA
// ==========================================

function removerUmaUnidade(id) {

    if (!carrinho[id]) return;

    alterarQuantidade(
        id,
        1,
        "remover"
    );

    if (!carrinho[id] && ultimoProdutoId === id) {

        ultimoProdutoId = null;
    }

    exibirCarrinho();
}

function removerProdutoCompleto(id) {

    if (!carrinho[id]) return;

    const produto = carrinho[id].produto.nome;

    const confirmar = window.confirm(
        `Deseja remover ${produto} completamente do pedido?`
    );

    if (!confirmar) return;

    delete carrinho[id];

    if (ultimoProdutoId === id) {

        ultimoProdutoId = null;
    }

    exibirCarrinho();
}

// ==========================================
// 18. MOSTRAR NOTA FISCAL
// ==========================================

function exibirCarrinho() {

    const nota = document.getElementById("notaFiscal");

    if (!nota) return;

    const itens = Object.values(carrinho);

    nota.innerHTML = "";

    // Cabeçalho.

    const cabecalho = document.createElement("div");

    cabecalho.className = "nota-cabecalho";

    const titulo = document.createElement("h2");

    titulo.textContent = "🧾 Seu pedido";

    const nome = document.createElement("p");

    nome.textContent = "Marmita Caseira";

    cabecalho.appendChild(titulo);

    cabecalho.appendChild(nome);

    nota.appendChild(cabecalho);

    // Carrinho vazio.

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

    // Produtos.

    for (const item of itens) {

        const id = item.produto.id;

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

        // Personalização.

        if (item.personalizacao) {

            const detalhe = document.createElement("small");

            detalhe.textContent =
                "Personalização: " + item.personalizacao;

            linha.appendChild(detalhe);
        }

        // CONTROLES DE QUANTIDADE E REMOÇÃO.

        const controles = document.createElement("div");

        controles.style.display = "flex";
        controles.style.gap = "8px";
        controles.style.marginTop = "10px";
        controles.style.alignItems = "center";
        controles.style.flexWrap = "wrap";

        // Botão diminuir uma unidade.

        const botaoDiminuir = document.createElement("button");

        botaoDiminuir.type = "button";

        botaoDiminuir.textContent = "−  Diminuir 1";

        botaoDiminuir.style.padding = "6px 10px";
        botaoDiminuir.style.border = "1px solid #cbd5e1";
        botaoDiminuir.style.borderRadius = "6px";
        botaoDiminuir.style.background = "#f1f5f9";
        botaoDiminuir.style.color = "#172033";
        botaoDiminuir.style.cursor = "pointer";
        botaoDiminuir.style.fontSize = "12px";

        botaoDiminuir.addEventListener("click", function () {

            removerUmaUnidade(id);
        });

        // Botão remover produto inteiro.

        const botaoRemover = document.createElement("button");

        botaoRemover.type = "button";

        botaoRemover.textContent = "Remover produto";

        botaoRemover.style.padding = "6px 10px";
        botaoRemover.style.border = "1px solid #fecaca";
        botaoRemover.style.borderRadius = "6px";
        botaoRemover.style.background = "#fef2f2";
        botaoRemover.style.color = "#b91c1c";
        botaoRemover.style.cursor = "pointer";
        botaoRemover.style.fontSize = "12px";

        botaoRemover.addEventListener("click", function () {

            removerProdutoCompleto(id);
        });

        controles.appendChild(botaoDiminuir);

        controles.appendChild(botaoRemover);

        linha.appendChild(controles);

        nota.appendChild(linha);
    }

    // Subtotal e entrega.

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

    // Total.

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

    // Rodapé.

    const rodape = document.createElement("div");

    rodape.className = "nota-rodape";

    rodape.textContent =
        "Obrigado pela preferência!";

    nota.appendChild(rodape);
}

// ==========================================
// 19. MONTAR CONTEXTO DA IA
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

IMPORTANTE:
- Uma pergunta sobre ingredientes, composição,
  preço ou disponibilidade NÃO representa uma compra.
- Só considere um produto comprado quando houver
  intenção clara de adicionar ou selecionar o produto.
- Não diga que um produto foi adicionado se ele não
  estiver no estado atual do carrinho.
- Não invente produtos, preços, promoções ou informações.

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
                `${item.quantidade}x ${item.produto.nome}. `;

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
// 20. ENVIAR MENSAGEM
// ==========================================

async function enviarMensagem() {

    if (enviando) return;

    const campo = document.getElementById("mensagem");

    const chat = document.getElementById("chat");

    if (!campo || !chat) return;

    const texto = campo.value.trim();

    if (!texto) return;

    // Verifica se o cliente quer começar novamente.

    if (solicitouNovoPedido(texto)) {

        const confirmar = window.confirm(
            "Deseja apagar a conversa anterior e começar um novo pedido?\n\n" +
            "Todos os produtos do carrinho também serão removidos."
        );

        if (confirmar) {

            limparPedido();

        } else {

            campo.value = "";
        }

        return;
    }

    campo.value = "";

    enviando = true;

    // Mensagem do cliente.

    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";

    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // Atualiza o carrinho.

    atualizarCarrinho(texto);

    exibirCarrinho();

    // Indicador de processamento.

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

        // Guarda o histórico somente após resposta válida.

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
// 21. ENVIAR COM ENTER
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
