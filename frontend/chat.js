const socket = io("http://localhost:5000");

let currentRoom = "";
let username = localStorage.getItem("username");

document.addEventListener("DOMContentLoaded", function() {
    if (!username) {
        window.location.href = "login.html";
    }

    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("username");
        window.location.href = "login.html";
    });

    document.getElementById("roomName").textContent = currentRoom;

    document.getElementById("sendMessageBtn").addEventListener("click", sendMessage);
    document.getElementById("messageInput").addEventListener("input",
