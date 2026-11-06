const app = document.getElementById("app");

const params = new URLSearchParams(window.location.search);

const allowedSettings = {
    theme: new Set(["light", "dark"]),
    language: new Set(["en", "fr"]),
    fontSize: new Set(["small", "medium", "large"])
};

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
    const settings = Object.create(null);

    for (const [key, value] of Object.entries(userSettings)) {
        if (
            !Object.hasOwn(allowedSettings, key) ||
            !allowedSettings[key].has(value)
        ) {
            throw new Error(`Invalid setting: ${key}`);
        }

        settings[key] = value;
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

        if (!response.ok) {
            throw new Error(result.error || "Settings request failed.");
        }

        document.getElementById("settings-status").textContent =
            result.message;
    } catch (error) {
        console.error("Unable to save settings.", error);
        document.getElementById("settings-status").textContent =
            "Unable to save settings.";
    }
});