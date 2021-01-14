import {Client, Presence} from "discord-rpc";
import {app, BrowserWindow, Menu, Tray} from "electron";
import * as fs from "fs";
import * as path from "path";

let mainWindow: BrowserWindow;
let tray: Tray;
let closing = false;
const client = new Client({
    transport: "ipc"
});

app.whenReady().then(() => {
    tray = new Tray(path.join(__dirname, "rpc.png"));
    tray.on("click", () => mainWindow.show())
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: "Quit",
            click() {
                closing = true;
                app.quit();
            }
        }
    ]))
    mainWindow = new BrowserWindow({
        title: "Discord Rich Presence Client",
        icon: path.join(__dirname, "rpc-dark.png"),
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });
    mainWindow.removeMenu();
    mainWindow.loadFile("index.html").catch(console.error);
    mainWindow.on("close", event => {
        if (closing) return;
        event.preventDefault();
        mainWindow.hide();
    });

    updateActivity().catch(console.error);
    setInterval(() => updateActivity(), 15e3);
}).catch(console.error);

async function updateActivity() {
    if (!mainWindow) return;
    const clientID = await mainWindow.webContents.executeJavaScript(`document.querySelector("#client-id").value`);
    if (!clientID) return;
    if (!client.application || client.application.id !== clientID) {
        if (client.application) await client.destroy();
        await client.login({
            clientId: clientID
        });
        await new Promise<void>((resolve) => {
            client.once("ready", resolve);
        });
    }

    const details = await mainWindow.webContents.executeJavaScript(`document.querySelector("#details").value`);
    const state = await mainWindow.webContents.executeJavaScript(`document.querySelector("#state").value`);
    const start = await mainWindow.webContents.executeJavaScript(`document.querySelector("#start").value`);
    const end = await mainWindow.webContents.executeJavaScript(`document.querySelector("#end").value`);
    const largeImageKey = await mainWindow.webContents.executeJavaScript(`document.querySelector("#large-image-key").value`);
    const largeImageText = await mainWindow.webContents.executeJavaScript(`document.querySelector("#large-image-text").value`);
    const smallImageKey = await mainWindow.webContents.executeJavaScript(`document.querySelector("#small-image-key").value`);
    const smallImageText = await mainWindow.webContents.executeJavaScript(`document.querySelector("#small-image-text").value`);
    const partySize = await mainWindow.webContents.executeJavaScript(`document.querySelector("#party-size").value`);
    const partyMax = await mainWindow.webContents.executeJavaScript(`document.querySelector("#party-max").value`);

    if (details && details.length < 2) return;
    if (state && state.length < 2) return;
    if (largeImageText && largeImageText.length < 2) return;
    if (smallImageText && smallImageText.length < 2) return;

    const activity: Presence = {};
    if (details) activity.details = details;
    if (state) activity.state = state;
    if (start) activity.startTimestamp = new Date(start);
    if (end) activity.endTimestamp = new Date(end);
    if (largeImageKey) activity.largeImageKey = largeImageKey;
    if (largeImageText) activity.largeImageText = largeImageText;
    if (smallImageKey) activity.smallImageKey = smallImageKey;
    if (smallImageText) activity.smallImageText = smallImageText;
    if (partySize) activity.partySize = parseInt(partySize);
    if (partyMax) activity.partyMax = parseInt(partyMax);
    await client.setActivity(activity);

    fs.writeFileSync(path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share"), "rpc.json"), JSON.stringify({
        clientID, details, state, start, end, largeImageKey, largeImageText, smallImageKey, smallImageText, partySize, partyMax
    }));
}