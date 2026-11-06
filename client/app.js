const app = document.getElementById("app");

const params = new URLSearchParams(window.location.search);

const username =
    params.get("name") ||
    window.initialUser?.name ||
    "Guest";

function addProfileField(container, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value));
    container.appendChild(paragraph);
}

const profile = document.createElement("section");
const heading = document.createElement("h2");

profile.className = "profile-card";
heading.textContent = `Welcome, ${username}`;
profile.appendChild(heading);

addProfileField(
    profile,
    "Email",
    window.initialUser?.email || "Unknown"
);
addProfileField(
    profile,
    "Role",
    window.initialUser?.role || "User"
);

app.replaceChildren(profile);

function prepareSettings(userSettings) {
    const settings = {};

    for (const key in userSettings) {
        settings[key] = userSettings[key];
    }

    return settings;
}

const saveButton = document.getElementById("save-settings");

saveButton.addEventListener("click", async () => {
    const theme = document.getElementById("theme").value;
    const language = document.getElementById("language").value;
    const fontSize = document.getElementById("fontSize").value;

    const settings = prepareSettings({
        theme,
        language,
        fontSize
    });

    try {
        const response = await fetch("/api/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(settings)
        });

        const result = await response.json();

        document.getElementById("settings-status").textContent =
            result.message;
    } catch (error) {
        document.getElementById("settings-status").textContent =
            "Unable to save settings.";
    }
});