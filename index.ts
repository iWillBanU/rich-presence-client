import { Client } from "discord-rpc";
import {app, BrowserWindow, Menu, Tray} from "electron";

let mainWindow: BrowserWindow;
let tray: Tray;
let closing = false;
const client = new Client({
    transport: "ipc"
});

app.whenReady().then(() => {
    tray = new Tray("rpc.png");
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

    await client.setActivity({
        details: await mainWindow.webContents.executeJavaScript(`document.querySelector("#details").value`),
        state: await mainWindow.webContents.executeJavaScript(`document.querySelector("#state").value`),
        startTimestamp: new Date(await mainWindow.webContents.executeJavaScript(`document.querySelector("#start").value`)),
        endTimestamp: new Date(await mainWindow.webContents.executeJavaScript(`document.querySelector("#end").value`)),
        largeImageKey: await mainWindow.webContents.executeJavaScript(`document.querySelector("#large-image-key").value`),
        largeImageText: await mainWindow.webContents.executeJavaScript(`document.querySelector("#large-image-text").value`),
        smallImageKey: await mainWindow.webContents.executeJavaScript(`document.querySelector("#small-image-key").value`),
        smallImageText: await mainWindow.webContents.executeJavaScript(`document.querySelector("#small-image-text").value`),
        partySize: parseInt(await mainWindow.webContents.executeJavaScript(`document.querySelector("#party-size").value`)),
        partyMax: parseInt(await mainWindow.webContents.executeJavaScript(`document.querySelector("#party-max").value`))
    })
}