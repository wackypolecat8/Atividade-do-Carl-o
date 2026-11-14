
async function enviarMensagem() {
    const campo = document.getElementById("mensagem");
    const chat = document.getElementById("chat");

    const texto = campo.value.trim();

    if (texto === "") {
        return;
    }

    const mensagemUsuario = document.createElement("div");
    mensagemUsuario.className = "mensagem usuario";
    mensagemUsuario.textContent = texto;
    chat.appendChild(mensagemUsuario);

    campo.value = "";

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

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.detalhe || dados.erro || "Falha na API"
            );
        }

        mensagemBot.textContent =
            dados.resposta || "Não recebi uma resposta.";

    } catch (erro) {
        mensagemBot.textContent = "Erro: " + erro.message;
        console.error("Erro no atendimento:", erro);
    }

    chat.scrollTop = chat.scrollHeight;
}

