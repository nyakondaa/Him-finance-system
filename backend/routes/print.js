// backend/routes/print.js
import { exec } from "child_process";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { printer, text, copies } = req.body;

  if (!printer || !text) {
    return res.status(400).json({ error: "Printer and text are required" });
  }

  try {
    let command;

    const copiesOpt = Math.max(1, parseInt(copies, 10) || 1);

    if (process.platform === "win32") {
      // Use PowerShell to print text on Windows
      // Notepad doesn't support copies; repeat the command copies times
      const psEscaped = text.replace(/\n/g,'`n').replace(/'/g, "''");
      const cmdOnce = `powershell -Command "$text='${psEscaped}'; Add-Content -Path 'C:\\temp\\receipt.txt' -Value $text; Start-Process -FilePath 'notepad.exe' -ArgumentList '/p','C:\\temp\\receipt.txt' -NoNewWindow -Wait"`;
      command = Array(copiesOpt).fill(cmdOnce).join(' && ');
    } else {
      // Linux/macOS -> use lp (CUPS)
      // Send in raw mode and set copies via -n
      command = `echo "${text.replace(/"/g, '\\"')}" | lp -o raw -n ${copiesOpt} -d "${printer}"`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Print error:", stderr || error.message);
        return res.status(500).json({ error: stderr || error.message });
      }

      return res.status(200).json({ message: "Printed successfully" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
