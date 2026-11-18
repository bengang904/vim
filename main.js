import { VimWasm, checkBrowserCompatibility } from "./vimwasm.js";

const canvas = document.getElementById("vim-screen");
const input = document.getElementById("vim-input");
const message = document.getElementById("vim-message");

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function cancelDrop(event) {
  event.preventDefault();
  event.stopPropagation();
}

const compatibilityMessage = checkBrowserCompatibility();
if (compatibilityMessage) {
  showMessage(compatibilityMessage);
} else {
  const vim = new VimWasm({
    canvas,
    input,
    workerScriptPath: "./vim.js",
  });

  canvas.addEventListener("click", () => input.focus());
  canvas.addEventListener("dragover", (event) => {
    cancelDrop(event);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  });
  canvas.addEventListener("drop", (event) => {
    cancelDrop(event);
    if (event.dataTransfer) {
      vim.dropFiles(event.dataTransfer.files).catch((error) => showMessage(error.message));
    }
  });

  vim.onFileExport = (fullpath, contents) => {
    const filename = fullpath.split("/").pop() || "vim-file";
    const blob = new Blob([contents], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (navigator.clipboard) {
    vim.readClipboard = () => navigator.clipboard.readText();
    vim.onWriteClipboard = (text) => navigator.clipboard.writeText(text);
  }

  vim.onTitleUpdate = (title) => {
    document.title = title || "Vim";
  };
  vim.onVimExit = (status) => showMessage(`Vim exited with status ${status}.`);
  vim.onError = (error) => showMessage(error.message || String(error));

  vim.start({
    persistentDirs: ["/home/web_user/.vim"],
  });
  input.focus();
}
