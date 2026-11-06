const app = document.getElementById("app");

const params = new URLSearchParams(window.location.search);

const allowedSettings = {
    theme: new Set(["light", "dark"]),
    language: new Set(["en", "fr"]),
    fontSize: new Set(["small", "medium", "large"])
};

function addProfileField(container, label, value) {
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value));
    container.appendChild(paragraph);
}

function renderProfile(user) {
    const profile = document.createElement("section");
    const heading = document.createElement("h2");
    const username = params.get("name") || user.name || "Guest";

    profile.className = "profile-card";
    heading.textContent = `Welcome, ${username}`;
    profile.appendChild(heading);

    addProfileField(profile, "Email", user.email || "Unknown");
    addProfileField(profile, "Role", user.role || "User");

    app.replaceChildren(profile);
}

async function loadProfile() {
    try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
            throw new Error(`Profile request failed with ${response.status}`);
        }

        renderProfile(await response.json());
    } catch (error) {
        console.error("Unable to load profile.", error);
        app.textContent = "Unable to load profile.";
    }
}

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

loadProfile();

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