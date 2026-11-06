const deleteAccountButton = document.getElementById("delete-account");
const status = document.getElementById("status");

deleteAccountButton.addEventListener("click", () => {
    status.textContent = "Account deletion action triggered.";
});
