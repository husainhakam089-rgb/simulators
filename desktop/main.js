// نافذة التطبيق: تحمّل النسخة أحادية الملف نفسها التي تعمل في المتصفح،
// فلا يوجد منطق مكرّر — الاختلاف الوحيد أنها داخل نافذة بدل تبويب.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,
    minHeight: 480,
    show: false,
    backgroundColor: '#0a0f1c',          // نفس خلفية التطبيق، فلا وميض أبيض
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'app.html'));

  // أي رابط خارجي يُفتح بمتصفح النظام بدل أن يبتلع نافذة التطبيق
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);         // بلا شريط قوائم: التطبيق ملء النافذة
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
