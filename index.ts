//import { Client } from "discord-rpc";
import {app, BrowserWindow, Menu, Tray} from "electron";

let mainWindow: BrowserWindow;
let tray: Tray;

app.whenReady().then(() => {
    tray = new Tray("rpc.png");
    tray.on("click", () => mainWindow.show())
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: "Quit",
            click() {
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
       event.preventDefault();
       mainWindow.hide();
    });
}).catch(console.error);
