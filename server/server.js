const express = require("express");
const path = require("path");

const { user, defaultSettings } = require("./data");

const app = express();
const PORT = 3000;

const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
].join("; ");

const allowedSettings = {
    theme: new Set(["light", "dark"]),
    language: new Set(["en", "fr"]),
    fontSize: new Set(["small", "medium", "large"])
};

const forbiddenPropertyNames = new Set([
    "__proto__",
    "constructor",
    "prototype"
]);

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", contentSecurityPolicy);
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

app.use(express.json());

function toClientUser(serverUser) {
    return {
        id: serverUser.id,
        name: serverUser.name,
        email: serverUser.email,
        role: serverUser.role
    };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function validateSettings(input) {
    if (
        input === null ||
        typeof input !== "object" ||
        Array.isArray(input)
    ) {
        return {
            error: "Settings must be a JSON object."
        };
    }

    const settings = Object.create(null);

    for (const [key, value] of Object.entries(input)) {
        if (forbiddenPropertyNames.has(key)) {
            return {
                error: `Setting "${key}" is not allowed.`
            };
        }

        if (!Object.hasOwn(allowedSettings, key)) {
            return {
                error: `Unknown setting "${key}".`
            };
        }

        if (!allowedSettings[key].has(value)) {
            return {
                error: `Invalid value for setting "${key}".`
            };
        }

        settings[key] = value;
    }

    return {
        settings
    };
}

/*
 * Home page
 */
app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>User Security Dashboard</title>
            <link rel="stylesheet" href="/styles.css">
        </head>

        <body>
            <header class="header">
                <h1>User Security Dashboard</h1>
                <nav>
                    <a href="/">Dashboard</a>
                    <a href="/account">Account Settings</a>
                </nav>
            </header>

            <main class="container">
                <div id="app"></div>

                <section class="settings">
                    <h2>User Settings</h2>

                    <label>
                        Theme:
                        <select id="theme">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </label>

                    <label>
                        Language:
                        <select id="language">
                            <option value="en">English</option>
                            <option value="fr">French</option>
                        </select>
                    </label>

                    <label>
                        Font Size:
                        <select id="fontSize">
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </label>

                    <button id="save-settings">
                        Save Settings
                    </button>

                    <p id="settings-status"></p>
                </section>
            </main>

            <script src="/app.js" defer></script>
        </body>
        </html>
    `);
});

/*
 * Profile API
 */
app.get("/api/profile", (req, res) => {
    res.json(toClientUser(user));
});

/*
 * Settings API
 */
app.get("/api/settings", (req, res) => {
    res.json(defaultSettings);
});

app.post("/api/settings", (req, res) => {
    const result = validateSettings(req.body);

    if (result.error) {
        return res.status(400).json({
            error: result.error
        });
    }

    return res.json({
        message: "Settings saved successfully.",
        settings: result.settings
    });
});

/*
 * Account page
 */
app.get("/account", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>Account Settings</title>
            <link rel="stylesheet" href="/styles.css">
        </head>

        <body class="account-page">
            <div class="account-card">
                <h1>Account Settings</h1>

                <p>
                    <strong>Name:</strong>
                    ${escapeHtml(user.name)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHtml(user.email)}
                </p>

                <p>
                    <strong>Role:</strong>
                    ${escapeHtml(user.role)}
                </p>

                <button
                    id="delete-account"
                    class="danger"
                >
                    Delete Account
                </button>

                <p id="status"></p>
            </div>

            <script src="/account.js" defer></script>
        </body>
        </html>
    `);
});

app.use(express.static(path.join(__dirname, "..", "client")));

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400) {
        return res.status(400).json({
            error: "Request body must contain valid JSON."
        });
    }

    return next(error);
});

app.listen(PORT, () => {
    console.log(`Application running at http://localhost:${PORT}`);
});