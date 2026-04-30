// Arle Nadja Bot - Modified from Vibri's template
let arle = io("//");

// Initial Connection
arle.emit("client", "MAIN");
arle.emit("login", {
    passcode: "",
    name: "Arle Nadja",
    room: "", // You can specify a room name here
});
{
function sendMsg(msg) {
arle.emit("talk", {text: msg});
}
};
// Join Message
arle.on("connect", () => {
    setTimeout(() => {
        arle.emit("command", { list: ["color", "arle"] });
    },);
    setTimeout(() => {
        sendMsg("Bayoen! I'm Arle.");
    }, 1000);
});

// Chat Interaction
arle.on("talk", (data) => {
    // Don't respond to yourself
    if (data.name === "Arle Nadja") return;

    const input = data.text.toLowerCase();

    if (input.includes("puyo")) {
        sendMsg("Fire! Ice Storm! Diacute! BAYOEN!");
    } 
    
    if (input.includes("carbuncle") || input.includes("carby")) {
        sendMsg("Gu-ga-gugu! ('Hello!')");
    }
});