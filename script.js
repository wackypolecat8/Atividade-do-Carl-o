function enviarMensagem() {
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
    mensagemBot.textContent = "Entendi! Estou analisando seu pedido.";

    chat.appendChild(mensagemBot);

    chat.scrollTop = chat.scrollHeight;
}
