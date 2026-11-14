
async function enviarMensagem() {

    const campo = document.getElementById("mensagem");
    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (texto === "") {
        return;
    }

    // Impede envios vazios
    campo.value = "";

    // Mostra mensagem do usuário
    const mensagemUsuario = document.createElement("div");

    mensagemUsuario.className = "mensagem usuario";
    mensagemUsuario.textContent = texto;

    chat.appendChild(mensagemUsuario);

    // Mostra mensagem de processamento
    const mensagemBot = document.createElement("div");

    mensagemBot.className = "mensagem bot";
    mensagemBot.textContent = "Processando seu pedido...";

    chat.appendChild(mensagemBot);

    chat.scrollTop = chat.scrollHeight;

    try {

        const resposta = await fetch(
            "https://chatbot-marmitas-api.d2023004130.workers.dev/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mensagem: texto,
                    modelo: "gemini"
                })
            }
        );

        // Primeiro recebe como texto
        const textoResposta = await resposta.text();

        let dados;

        // Tenta converter para JSON
        try {
            dados = JSON.parse(textoResposta);

        } catch (erro) {

            throw new Error(
                "Resposta inválida do servidor: " +
                textoResposta.slice(0, 200)
            );
        }

        // Verifica erros HTTP
        if (!resposta.ok) {

            throw new Error(
                dados.detalhe ||
                dados.erro ||
                "Erro HTTP " + resposta.status
            );
        }

        // Exibe resposta da inteligência artificial
        mensagemBot.textContent =
            dados.resposta || "Não recebi uma resposta.";

    } catch (erro) {

        console.error("Erro no atendimento:", erro);

        mensagemBot.textContent =
            "Desculpe, ocorreu um problema: " + erro.message;

    }

    chat.scrollTop = chat.scrollHeight;
}


// Permite enviar mensagem apertando ENTER
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

